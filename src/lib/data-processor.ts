import type {
  Transaccion,
  ResumenDiario,
  ResumenSemanal,
  ResumenMensual,
  ResumenAnual,
  DashboardData,
  FileInfo,
  Categoria,
  DateFilter,
} from "./types";

const DIAS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function parseNum(v: any): number {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number") return v;
  return parseFloat(String(v).replace(/[$, ]/g, "")) || 0;
}

export function parseExcelData(raw: any[], fileName: string): Transaccion[] {
  const transacciones: Transaccion[] = [];

  const wkMatch = fileName.match(/Semana_?(\d+)/i);
  const mesMatch = fileName.match(/^([A-Za-z]+)/);
  const anioMatch = fileName.match(/(\d{4})/);

  let semana = wkMatch ? parseInt(wkMatch[1]) : 1;
  let mesNum = 0;
  let anio = anioMatch ? parseInt(anioMatch[1]) : new Date().getFullYear();

  if (mesMatch) {
    const idx = MESES.findIndex(
      (m) => m.toLowerCase().startsWith(mesMatch[1].toLowerCase())
    );
    if (idx >= 0) mesNum = idx + 1;
  }

  let lastFecha = "";
  let lastDia = "";
  let acumulado = 0;

  function extractFechaDesdeHeader(texto: string): string | null {
    const match = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) return `${match[1].padStart(2,"0")}/${match[2].padStart(2,"0")}/${match[3]}`;
    return null;
  }

  function extractDiaDesdeHeader(texto: string): string | null {
    for (const d of DIAS) {
      if (texto.toLowerCase().startsWith(d.toLowerCase().substring(0,2))) return d.toUpperCase();
    }
    const match = texto.match(/^([A-Z]+)\s+\d+/);
    if (match) return match[1];
    return null;
  }

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !Array.isArray(row)) continue;

    // Extraer fecha/dia desde headers de dia (ej: "LUNES 27  |  27/07/2026")
    const col0 = String(row[0] || "").trim();
    const semanaEnHeader = col0.match(/SEMANA\s+(\d+)/i);
    if (semanaEnHeader) semana = Number(semanaEnHeader[1]);
    if (col0 && !row[2]) {
      const f = extractFechaDesdeHeader(col0);
      const d = extractDiaDesdeHeader(col0);
      if (f) lastFecha = f;
      if (d) lastDia = d;
    }

    // Saltar filas estructurales (subtotales, totales, headers de seccion)
    const col0Upper = col0.toUpperCase();
    if (col0Upper.includes("SUBTOTAL") || col0Upper.includes("TOTAL") || col0Upper.includes("RESUMEN")) continue;

    const colC = String(row[2] || "").trim();
    const colF = parseNum(row[5]);
    const colG = parseNum(row[6]);
    const colH = parseNum(row[7]);

    // Determinar tipo: colC explícito, o inferir de G/H
    let tipo = colC === "Entrada" ? "Entrada" : colC === "Gasto" ? "Gasto" : "";
    if (!tipo && colG > 0 && colH === 0) tipo = "Entrada";
    if (!tipo && colH > 0 && colG === 0) tipo = "Gasto";
    if (!tipo && colG > 0 && colH > 0) tipo = colG >= colH ? "Entrada" : "Gasto";
    if (!tipo) continue;

    // Monto: priorizar F, luego G (entradas), luego H (gastos), luego el mayor
    let monto = colF;
    if (monto === 0 && tipo === "Entrada" && colG > 0) monto = colG;
    if (monto === 0 && tipo === "Gasto" && colH > 0) monto = colH;
    if (monto === 0) monto = Math.max(colG, colH);
    if (monto === 0) continue;

    const fechaRaw = String(row[1] || "").trim();
    const diaRaw = String(row[0] || "").trim();

    if (fechaRaw) lastFecha = fechaRaw;
    if (diaRaw) lastDia = diaRaw;

    const fechaParts = lastFecha.split("/");
    let diaNum = parseInt(fechaParts[0]) || 1;
    let mesNumF = parseInt(fechaParts[1]) || mesNum || 1;
    let anioF = parseInt(fechaParts[2]) || anio;

    const fechaObj = new Date(anioF, mesNumF - 1, diaNum);
    const ts = fechaObj.getTime();

    const esEntrada = tipo === "Entrada";
    const balance = esEntrada ? monto : -monto;
    acumulado += balance;

    const transaccion: Transaccion = {
      id: `tx-${ts}-${i}-${hash(fileName)}`,
      dia: lastDia,
      fecha: lastFecha,
      timestamp: ts,
      tipo: tipo as "Entrada" | "Gasto",
      concepto: String(row[3] || "").trim(),
      detalle: String(row[4] || "").trim(),
      monto,
      entradas: esEntrada ? monto : 0,
      gastos: esEntrada ? 0 : monto,
      balance,
      acumulado,
      semana,
      mes: mesNumF,
      anio: anioF,
      archivo: fileName,
      categoria: esEntrada ? "ventas" : "gastos",
    };

    transacciones.push(transaccion);
  }

  return transacciones;
}

function getDiaSemana(fechaStr: string): string {
  const parts = fechaStr.split("/");
  if (parts.length !== 3) return "";
  const d = new Date(
    parseInt(parts[2]),
    parseInt(parts[1]) - 1,
    parseInt(parts[0])
  );
  return DIAS[d.getDay()];
}

export function buildResumen(
  transacciones: Transaccion[]
): DashboardData["resumen"] {
  const ahora = new Date();
  const hoy = `${ahora.getDate().toString().padStart(2, "0")}/${(ahora.getMonth() + 1).toString().padStart(2, "0")}/${ahora.getFullYear()}`;

  const hoyTx = transacciones.filter((t) => t.fecha === hoy);
  const diario: ResumenDiario = {
    fecha: hoy,
    dia: DIAS[ahora.getDay()],
    timestamp: ahora.getTime(),
    transacciones: hoyTx.length,
    entradas: hoyTx.reduce((s, t) => s + t.entradas, 0),
    gastos: hoyTx.reduce((s, t) => s + t.gastos, 0),
    balance: hoyTx.reduce((s, t) => s + t.balance, 0),
  };

  const semanaActual = getSemanaDelMes(ahora);
  const semTx = transacciones.filter((t) => t.semana === semanaActual && t.mes === ahora.getMonth() + 1 && t.anio === ahora.getFullYear());
  const diasSemana = agruparPorDia(semTx);
  const semanal: ResumenSemanal = {
    semana: semanaActual,
    label: `Semana ${semanaActual}`,
    dias: diasSemana,
    entradas: semTx.reduce((s, t) => s + t.entradas, 0),
    gastos: semTx.reduce((s, t) => s + t.gastos, 0),
    balance: semTx.reduce((s, t) => s + t.balance, 0),
  };

  const mesTx = transacciones.filter(
    (t) => t.mes === ahora.getMonth() + 1 && t.anio === ahora.getFullYear()
  );
  const semanasMap = new Map<number, Transaccion[]>();
  for (const tx of mesTx) {
    if (!semanasMap.has(tx.semana)) semanasMap.set(tx.semana, []);
    semanasMap.get(tx.semana)!.push(tx);
  }
  const semanas: ResumenSemanal[] = [];
  for (const [wk, txs] of semanasMap) {
    semanas.push({
      semana: wk,
      label: `Semana ${wk}`,
      dias: agruparPorDia(txs),
      entradas: txs.reduce((s, t) => s + t.entradas, 0),
      gastos: txs.reduce((s, t) => s + t.gastos, 0),
      balance: txs.reduce((s, t) => s + t.balance, 0),
    });
  }
  semanas.sort((a, b) => a.semana - b.semana);

  const mensual: ResumenMensual = {
    mes: ahora.getMonth() + 1,
    nombre: MESES[ahora.getMonth()],
    anio: ahora.getFullYear(),
    semanas,
    entradas: mesTx.reduce((s, t) => s + t.entradas, 0),
    gastos: mesTx.reduce((s, t) => s + t.gastos, 0),
    balance: mesTx.reduce((s, t) => s + t.balance, 0),
  };

  const anioTx = transacciones.filter((t) => t.anio === ahora.getFullYear());
  const mesesMap = new Map<number, Transaccion[]>();
  for (const tx of anioTx) {
    if (!mesesMap.has(tx.mes)) mesesMap.set(tx.mes, []);
    mesesMap.get(tx.mes)!.push(tx);
  }
  const meses: ResumenMensual[] = [];
  for (const [m, txs] of mesesMap) {
    meses.push({
      mes: m,
      nombre: MESES[m - 1],
      anio: ahora.getFullYear(),
      semanas: [],
      entradas: txs.reduce((s, t) => s + t.entradas, 0),
      gastos: txs.reduce((s, t) => s + t.gastos, 0),
      balance: txs.reduce((s, t) => s + t.balance, 0),
    });
  }
  meses.sort((a, b) => a.mes - b.mes);

  const anual: ResumenAnual = {
    anio: ahora.getFullYear(),
    meses,
    entradas: anioTx.reduce((s, t) => s + t.entradas, 0),
    gastos: anioTx.reduce((s, t) => s + t.gastos, 0),
    balance: anioTx.reduce((s, t) => s + t.balance, 0),
  };

  return { diario, semanal, mensual, anual };
}

export function buildCategorias(transacciones: Transaccion[]): Categoria[] {
  const gastos = transacciones.filter((t) => t.tipo === "Gasto");
  const entradas = transacciones.filter((t) => t.tipo === "Entrada");

  const gastosPorConcepto = new Map<string, number>();
  for (const g of gastos) {
    const key = g.concepto || "Sin concepto";
    gastosPorConcepto.set(key, (gastosPorConcepto.get(key) || 0) + g.monto);
  }

  const subcategorias: Categoria[] = [];
  for (const [concepto, total] of gastosPorConcepto) {
    subcategorias.push({
      id: `gasto-${hash(concepto)}`,
      nombre: concepto,
      slug: `gasto-${concepto.toLowerCase().replace(/\s+/g, "-")}`,
      icono: "receipt",
      total,
      color: "#C62828",
    });
  }
  subcategorias.sort((a, b) => b.total - a.total);

  const entradasPorConcepto = new Map<string, number>();
  for (const e of entradas) {
    const key = e.concepto || "Sin concepto";
    entradasPorConcepto.set(key, (entradasPorConcepto.get(key) || 0) + e.monto);
  }

  const subEntradas: Categoria[] = [];
  for (const [concepto, total] of entradasPorConcepto) {
    subEntradas.push({
      id: `venta-${hash(concepto)}`,
      nombre: concepto,
      slug: `venta-${concepto.toLowerCase().replace(/\s+/g, "-")}`,
      icono: "trending-up",
      total,
      color: "#2E7D32",
    });
  }
  subEntradas.sort((a, b) => b.total - a.total);

  return [
    {
      id: "ventas",
      nombre: "Ventas / Entradas",
      slug: "ventas",
      icono: "trending-up",
      total: entradas.reduce((s, t) => s + t.monto, 0),
      color: "#2E7D32",
      subcategorias: subEntradas.length > 0 ? subEntradas : undefined,
    },
    {
      id: "gastos",
      nombre: "Gastos",
      slug: "gastos",
      icono: "shopping-cart",
      total: gastos.reduce((s, t) => s + t.monto, 0),
      color: "#C62828",
      subcategorias: subcategorias.length > 0 ? subcategorias : undefined,
    },
    {
      id: "balance",
      nombre: "Balance Neto",
      slug: "balance",
      icono: "wallet",
      total: entradas.reduce((s, t) => s + t.monto, 0) - gastos.reduce((s, t) => s + t.monto, 0),
      color: "#1A237E",
    },
    {
      id: "historial",
      nombre: "Historial Completo",
      slug: "historial",
      icono: "file-text",
      total: transacciones.length,
      color: "#6A1B9A",
    },
  ];
}

function getSemanaDelMes(fecha: Date): number {
  const dia = fecha.getDate();
  return Math.ceil(dia / 7);
}

function agruparPorDia(transacciones: Transaccion[]): ResumenDiario[] {
  const map = new Map<string, Transaccion[]>();
  for (const tx of transacciones) {
    if (!map.has(tx.fecha)) map.set(tx.fecha, []);
    map.get(tx.fecha)!.push(tx);
  }
  const dias: ResumenDiario[] = [];
  for (const [fecha, txs] of map) {
    dias.push({
      fecha,
      dia: getDiaSemana(fecha),
      timestamp: txs[0].timestamp,
      transacciones: txs.length,
      entradas: txs.reduce((s, t) => s + t.entradas, 0),
      gastos: txs.reduce((s, t) => s + t.gastos, 0),
      balance: txs.reduce((s, t) => s + t.balance, 0),
    });
  }
  dias.sort((a, b) => a.timestamp - b.timestamp);
  return dias;
}

export function filterTransacciones(
  transacciones: Transaccion[],
  filter: DateFilter
): Transaccion[] {
  let result = [...transacciones];

  switch (filter.tipo) {
    case "dia":
      if (filter.dia && filter.mes && filter.anio) {
        const target = `${filter.dia.toString().padStart(2, "0")}/${filter.mes.toString().padStart(2, "0")}/${filter.anio}`;
        result = result.filter((t) => t.fecha === target);
      }
      break;
    case "semana":
      result = result.filter(
        (t) =>
          t.semana === filter.semana &&
          t.mes === filter.mes &&
          t.anio === filter.anio
      );
      break;
    case "mes":
      result = result.filter(
        (t) => t.mes === filter.mes && t.anio === filter.anio
      );
      break;
    case "anio":
      result = result.filter((t) => t.anio === filter.anio);
      break;
    case "rango":
      if (filter.desde) {
        const d = new Date(filter.desde);
        result = result.filter((t) => t.timestamp >= d.getTime());
      }
      if (filter.hasta) {
        const h = new Date(`${filter.hasta}T23:59:59.999`);
        result = result.filter((t) => t.timestamp <= h.getTime());
      }
      break;
  }

  return result;
}

export function formatCurrency(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
