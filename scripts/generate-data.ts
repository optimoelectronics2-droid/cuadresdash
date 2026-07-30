import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const { buildCategorias, buildResumen, parseExcelData } = await import("../src/lib/data-processor");
  const { downloadAndParseExcel, listFolderContents } = await import("../src/lib/google-drive");
  const EXCEL_FILE = /\.xlsx?$/i;
  const MAX_PARALLEL_DOWNLOADS = 4;

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

  console.log("[generate-data] Conectando con Google Drive...");
  const files = await listFolderContents();
  const excelFiles = files.filter(f => EXCEL_FILE.test(f.name));
  console.log(`[generate-data] ${excelFiles.length} archivos Excel encontrados`);

  const archivos = excelFiles.map(f => ({
    nombre: f.name,
    ruta: f.id,
    tipo: f.name.toLowerCase().includes("completo") ? "mensual" as const : "semanal" as const,
    anio: Number(f.name.match(/(\d{4})/)?.[1] || new Date().getFullYear()),
    mes: 0,
    semana: Number(f.name.match(/Semana_?(\d+)/i)?.[1]) || undefined,
    tamano: f.size ?? 0,
    modificado: f.modifiedTime,
  }));

  const batches = await mapWithConcurrency(excelFiles, async f => {
    console.log(`  Descargando: ${f.name}`);
    return parseExcelData(await downloadAndParseExcel(f.id), f.name);
  });

  const transacciones = batches.flat().sort((a, b) => a.timestamp - b.timestamp);
  const data = {
    resumen: buildResumen(transacciones),
    transacciones,
    categorias: buildCategorias(transacciones),
    ultimaActualizacion: new Date().toISOString(),
    archivos,
  };

  const outPath = resolve("public", "data.json");
  writeFileSync(outPath, JSON.stringify(data), "utf-8");
  console.log(`[generate-data] OK: ${transacciones.length} tx → ${outPath}`);
}

main().catch(err => {
  console.error("[generate-data] ERROR:", err.message);
  process.exit(1);
});