"use client";

import { useMemo } from "react";
import type { Transaccion, ResumenMensual } from "@/lib/types";

interface SimpleBarChartProps {
  data: { label: string; entradas: number; gastos: number; balance: number }[];
  height?: number;
}

export function SimpleBarChart({ data, height = 160 }: SimpleBarChartProps) {
  const maxVal = useMemo(
    () => Math.max(...data.map((d) => Math.max(d.entradas, d.gastos, Math.abs(d.balance))), 1),
    [data]
  );

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const hEnt = (d.entradas / maxVal) * 100;
          const hGas = (d.gastos / maxVal) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: "100%" }}>
                <div
                  className="w-full rounded-t-sm bg-green-500 transition-all"
                  style={{ height: `${Math.max(hEnt, 2)}%` }}
                  title={`Entradas: ${d.entradas}`}
                />
                <div
                  className="w-full rounded-t-sm bg-red-500 transition-all"
                  style={{ height: `${Math.max(hGas, 2)}%` }}
                  title={`Gastos: ${d.gastos}`}
                />
              </div>
              <span className="text-[8px] text-gray-500 truncate w-full text-center mt-1">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WeeklyChart({ transacciones }: { transacciones: Transaccion[] }) {
  const data = useMemo(() => {
    const map = new Map<number, { entradas: number; gastos: number; balance: number }>();
    for (const tx of transacciones) {
      if (!map.has(tx.semana))
        map.set(tx.semana, { entradas: 0, gastos: 0, balance: 0 });
      const d = map.get(tx.semana)!;
      d.entradas += tx.entradas;
      d.gastos += tx.gastos;
      d.balance += tx.balance;
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([sem, vals]) => ({
        label: `S${sem}`,
        ...vals,
      }));
  }, [transacciones]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-gray-700 mb-3">Por Semana</h3>
      <SimpleBarChart data={data} />
      <div className="flex justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
          <span className="text-[10px] text-gray-500">Entradas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
          <span className="text-[10px] text-gray-500">Gastos</span>
        </div>
      </div>
    </div>
  );
}

export function MonthlyChart({ meses }: { meses: ResumenMensual[] }) {
  const data = useMemo(
    () =>
      meses.map((m) => ({
        label: m.nombre.substring(0, 3),
        entradas: m.entradas,
        gastos: m.gastos,
        balance: m.balance,
      })),
    [meses]
  );

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-gray-700 mb-3">Evolución Mensual</h3>
      <SimpleBarChart data={data} height={180} />
    </div>
  );
}
