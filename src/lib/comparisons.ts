import type { Transaccion, ResumenSemanal, ResumenMensual } from "./types";

export interface Comparacion {
  tipo: "semanal" | "mensual";
  titulo: string;
  mensaje: string;
  mejora: boolean;
  entradasActual: number;
  entradasAnterior: number;
  gastosActual: number;
  gastosAnterior: number;
  balanceActual: number;
  balanceAnterior: number;
}

function fmt(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export function compararSemanas(
  actual: ResumenSemanal,
  anterior: ResumenSemanal | null
): Comparacion | null {
  if (!anterior || (anterior.entradas === 0 && anterior.gastos === 0)) return null;
  const diff = actual.balance - anterior.balance;
  const mejora = diff >= 0;
  return {
    tipo: "semanal",
    titulo: `Semana ${actual.semana} vs Semana ${anterior.semana}`,
    mensaje: mejora
      ? `Mejor que la semana anterior por ${fmt(diff)}`
      : `Peor que la semana anterior por ${fmt(Math.abs(diff))}`,
    mejora,
    entradasActual: actual.entradas,
    entradasAnterior: anterior.entradas,
    gastosActual: actual.gastos,
    gastosAnterior: anterior.gastos,
    balanceActual: actual.balance,
    balanceAnterior: anterior.balance,
  };
}

export function compararMeses(
  actual: ResumenMensual,
  anterior: ResumenMensual | null
): Comparacion | null {
  if (!anterior || (anterior.entradas === 0 && anterior.gastos === 0)) return null;
  const diff = actual.balance - anterior.balance;
  const mejora = diff >= 0;
  return {
    tipo: "mensual",
    titulo: `${actual.nombre} vs ${anterior.nombre}`,
    mensaje: mejora
      ? `Este mes va mejor que ${anterior.nombre} por ${fmt(diff)}`
      : `Este mes va peor que ${anterior.nombre} por ${fmt(Math.abs(diff))}`,
    mejora,
    entradasActual: actual.entradas,
    entradasAnterior: anterior.entradas,
    gastosActual: actual.gastos,
    gastosAnterior: anterior.gastos,
    balanceActual: actual.balance,
    balanceAnterior: anterior.balance,
  };
}

export function obtenerSemanaAnterior(
  transacciones: Transaccion[],
  semanaActual: number,
  mes: number,
  anio: number
): ResumenSemanal | null {
  const semanaAnterior = semanaActual > 1 ? semanaActual - 1 : null;
  if (!semanaAnterior) return null;
  const txs = transacciones.filter(
    (t) => t.semana === semanaAnterior && t.mes === mes && t.anio === anio
  );
  if (txs.length === 0) return null;
  const entradas = txs.reduce((s, t) => s + t.entradas, 0);
  const gastos = txs.reduce((s, t) => s + t.gastos, 0);
  return {
    semana: semanaAnterior,
    label: `Semana ${semanaAnterior}`,
    dias: [],
    entradas,
    gastos,
    balance: entradas - gastos,
  };
}

export function obtenerMesAnterior(
  transacciones: Transaccion[],
  mes: number,
  anio: number
): ResumenMensual | null {
  const mesAnterior = mes > 1 ? mes - 1 : null;
  if (!mesAnterior) return null;
  const txs = transacciones.filter((t) => t.mes === mesAnterior && t.anio === anio);
  if (txs.length === 0) return null;
  const entradas = txs.reduce((s, t) => s + t.entradas, 0);
  const gastos = txs.reduce((s, t) => s + t.gastos, 0);
  return {
    mes: mesAnterior,
    nombre: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][mesAnterior - 1],
    anio,
    semanas: [],
    entradas,
    gastos,
    balance: entradas - gastos,
  };
}

export function generarComparaciones(
  transacciones: Transaccion[],
  semanal: ResumenSemanal,
  mensual: ResumenMensual
): Comparacion[] {
  const result: Comparacion[] = [];
  const semAnterior = obtenerSemanaAnterior(transacciones, semanal.semana, mensual.mes, mensual.anio);
  const compSem = compararSemanas(semanal, semAnterior);
  if (compSem) result.push(compSem);
  const mesAnterior = obtenerMesAnterior(transacciones, mensual.mes, mensual.anio);
  const compMes = compararMeses(mensual, mesAnterior);
  if (compMes) result.push(compMes);
  return result;
}
