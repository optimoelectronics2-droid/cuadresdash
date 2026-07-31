import { buildCategorias, buildResumen, parseExcelData } from "./data-processor";
import { downloadAndParseExcel, listFolderContents } from "./google-drive";
import { getCachedData, getFetchPromise, setCachedData, setFetchPromise } from "./server-cache";
import type { DashboardData, FileInfo, Transaccion } from "./types";
import { generarComparaciones } from "./comparisons";
import { sendPushNotification } from "./push";
import { getSyncState, setSyncState } from "./sync-state";

const EXCEL_FILE = /\.xlsx?$/i;
const MAX_PARALLEL_DOWNLOADS = 4;
const sentTags = new Map<string, number>();
const TAG_TTL = 1000 * 60 * 60; // 1 hour before allowing re-send of same tag

async function mapWithConcurrency<T, R>(items: T[], worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL_DOWNLOADS, items.length) }, run));
  return results;
}

/** Builds and publishes only complete snapshots; a corrupt workbook never deletes valid data. */
export async function refreshDashboardData(): Promise<DashboardData> {
  const inFlight = getFetchPromise();
  if (inFlight) return inFlight;
  const refresh = (async () => {
    const files = await listFolderContents();
    const excelFiles = files.filter((file) => EXCEL_FILE.test(file.name));
    const archivos: FileInfo[] = excelFiles.map((file) => {
      const year = file.name.match(/(\d{4})/);
      const week = file.name.match(/Semana_?(\d+)/i);
      return { nombre: file.name, ruta: file.id, tipo: file.name.toLowerCase().includes("completo") ? "mensual" : "semanal", anio: year ? Number(year[1]) : new Date().getFullYear(), mes: 0, semana: week ? Number(week[1]) : undefined, tamano: file.size ?? 0, modificado: file.modifiedTime };
    });
    const batches = await mapWithConcurrency(excelFiles, async (file) => parseExcelData(await downloadAndParseExcel(file.id), file.name));
    const transacciones: Transaccion[] = batches.flat().sort((a, b) => a.timestamp - b.timestamp);
    const data: DashboardData = { resumen: buildResumen(transacciones), transacciones, categorias: buildCategorias(transacciones), ultimaActualizacion: new Date().toISOString(), archivos };
    setCachedData(data, archivos.map((file) => ({ name: file.nombre, modified: file.modificado })));

    // Notificar datos nuevos cuando cambian los archivos en Drive (estado persistente: funciona en serverless)
    const signature = archivos
      .map((f) => `${f.nombre}:${f.modificado}`)
      .sort()
      .join("|");
    const state = await getSyncState();
    if (state.lastFileSignature && signature !== state.lastFileSignature && archivos.length > 0) {
      const updated = archivos
        .filter((f) => f.modificado && f.modificado > new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .map((f) => f.nombre);
      const detalle = updated.length > 0
        ? `Actualizado: ${updated.slice(0, 3).join(", ")}${updated.length > 3 ? "..." : ""}`
        : `Se detectaron cambios en ${archivos.length} archivo(s)`;
      sendPushNotification(
        "Datos actualizados",
        `${detalle} | Total: ${transacciones.length} movimientos`,
        "data-updated",
        { tipo: "datos", balance: data.resumen.semanal.balance, url: "/" }
      ).catch(() => {});
    }
    await setSyncState({ lastFileSignature: signature, lastTxCount: transacciones.length, lastNotifiedAt: new Date().toISOString() });

    const comparaciones = generarComparaciones(transacciones, data.resumen.semanal, data.resumen.mensual);
    for (const comp of comparaciones) {
      const tag = comp.tipo === "semanal" ? `week-${data.resumen.semanal.semana}` : `month-${data.resumen.mensual.mes}`;
      const lastSent = sentTags.get(tag);
      if (lastSent && Date.now() - lastSent < TAG_TTL) continue;
      sentTags.set(tag, Date.now());
      sendPushNotification(comp.titulo, comp.mensaje, tag, {
        tipo: comp.tipo,
        ...(comp.tipo === "semanal" ? { semana: data.resumen.semanal.semana } : { mes: data.resumen.mensual.nombre }),
        balance: comp.balanceActual,
      }).catch(() => {});
    }
    return data;
  })();
  setFetchPromise(refresh);
  try { return await refresh; } finally { setFetchPromise(null); }
}

export async function getDashboardData(): Promise<DashboardData> {
  return getCachedData()?.data ?? refreshDashboardData();
}
