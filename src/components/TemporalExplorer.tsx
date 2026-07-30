"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useData } from "@/hooks/useData";
import { formatCurrency } from "@/lib/data-processor";
import type { Transaccion } from "@/lib/types";
import DataTable from "./DataTable";
import { WeeklyChart, MonthlyChart } from "./Charts";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const sum = (items: Transaccion[], field: "entradas" | "gastos" | "balance") => items.reduce((total, item) => total + item[field], 0);

function Metrics({ items, title }: { items: Transaccion[]; title: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div><p className="text-[10px] text-gray-500">Ventas</p><p className="text-sm font-bold text-green-700">{formatCurrency(sum(items, "entradas"))}</p></div>
        <div><p className="text-[10px] text-gray-500">Gastos</p><p className="text-sm font-bold text-red-700">{formatCurrency(sum(items, "gastos"))}</p></div>
        <div><p className="text-[10px] text-gray-500">Balance</p><p className="text-sm font-bold text-primary">{formatCurrency(sum(items, "balance"))}</p></div>
      </div>
    </div>
  );
}

function ProductInsights({ items }: { items: Transaccion[] }) {
  const products = useMemo(() => Array.from(items.filter((item) => item.tipo === "Entrada").reduce((map, item) => map.set(item.concepto || "Sin producto", (map.get(item.concepto || "Sin producto") || 0) + item.monto), new Map<string, number>()).entries()).sort((a, b) => b[1] - a[1]), [items]);
  if (!products.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-green-50 border border-green-100 p-3">
        <p className="text-[10px] text-green-700">Más vendido</p>
        <p className="text-sm font-bold text-green-800 truncate">{products[0][0]}</p>
        <p className="text-xs text-green-700">{formatCurrency(products[0][1])}</p>
      </div>
      <div className="rounded-xl bg-orange-50 border border-orange-100 p-3">
        <p className="text-[10px] text-orange-700">Menos vendido</p>
        <p className="text-sm font-bold text-orange-800 truncate">{products[products.length - 1][0]}</p>
        <p className="text-xs text-orange-700">{formatCurrency(products[products.length - 1][1])}</p>
      </div>
    </div>
  );
}

export default function TemporalExplorer() {
  const { data, loading } = useData();
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");

  const ahora = new Date();
  const [year, setYear] = useState<number | null>(focus === "anio" || focus === "mes" || focus === "semana" || focus === "dia" ? ahora.getFullYear() : null);
  const [month, setMonth] = useState<number | null>(focus === "mes" || focus === "semana" || focus === "dia" ? ahora.getMonth() + 1 : null);
  const [week, setWeek] = useState<number | null>(focus === "semana" || focus === "dia" ? Math.ceil(ahora.getDate() / 7) : null);
  const [day, setDay] = useState<string | null>(focus === "dia" ? `${ahora.getDate().toString().padStart(2,"0")}/${(ahora.getMonth()+1).toString().padStart(2,"0")}/${ahora.getFullYear()}` : null);

  const allData = data?.transacciones || [];
  const years = [...new Set(allData.map((item) => item.anio))].sort((a, b) => b - a);
  const yearItems = allData.filter((item) => year === null || item.anio === year);
  const months = [...new Set(yearItems.map((item) => item.mes))].filter(Boolean).sort((a, b) => a - b);
  const monthItems = yearItems.filter((item) => month === null || item.mes === month);
  const weeks = [...new Set(monthItems.map((item) => item.semana))].sort((a, b) => a - b);
  const weekItems = monthItems.filter((item) => week === null || item.semana === week);
  const days = [...new Set(weekItems.map((item) => item.fecha))].sort((a, b) => a.localeCompare(b));
  const dayItems = weekItems.filter((item) => day === null || item.fecha === day);

  if (loading && !data) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <p className="text-center text-gray-500 py-12">No hay datos para explorar.</p>;

  const reset = (level: "year" | "month" | "week") => {
    if (level === "year") { setMonth(null); setWeek(null); setDay(null); }
    if (level === "month") { setWeek(null); setDay(null); }
    if (level === "week") setDay(null);
  };

  return (
    <div className="space-y-4 pb-4">
      <header>
        <h1 className="text-xl font-bold text-primary">Explorador de períodos</h1>
        <p className="text-xs text-gray-500">Año → mes → semana → día → registros</p>
      </header>

      <nav className="flex flex-wrap gap-2 text-xs" aria-label="Miga de pan">
        <button onClick={() => { setYear(null); reset("year"); }} className="text-primary font-bold">Años</button>
        {year && <><span>/</span><button onClick={() => reset("year")} className="text-primary font-bold">{year}</button></>}
        {month && <><span>/</span><button onClick={() => reset("month")} className="text-primary font-bold">{MONTHS[month - 1]}</button></>}
        {week && <><span>/</span><button onClick={() => reset("week")} className="text-primary font-bold">Semana {week}</button></>}
        {day && <><span>/</span><span className="text-gray-600">{day}</span></>}
      </nav>

      {year === null && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold">Años disponibles</h2>
          <div className="grid grid-cols-2 gap-3">
            {years.map((value) => (
              <button key={value} onClick={() => { setYear(value); reset("year"); }} className="rounded-xl bg-gradient-to-br from-primary to-[#3949AB] text-white p-5 text-left shadow-sm">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs opacity-80">Ver meses, semanas y días</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {year !== null && month === null && (
        <>
          <Metrics items={yearItems} title={`Resumen anual ${year}`} />
          <section className="space-y-2">
            <h2 className="text-sm font-bold">Meses</h2>
            <div className="grid grid-cols-2 gap-3">
              {months.map((value) => (
                <button key={value} onClick={() => { setMonth(value); reset("month"); }} className="bg-white border border-gray-200 rounded-xl p-4 text-left card-hover">
                  <p className="font-bold text-primary">{MONTHS[value - 1]}</p>
                  <p className="text-xs text-gray-500">{yearItems.filter((item) => item.mes === value).length} registros</p>
                </button>
              ))}
            </div>
          </section>
          {data.resumen.anual.meses.length > 0 && <MonthlyChart meses={data.resumen.anual.meses.filter((item) => item.anio === year)} />}
        </>
      )}

      {month !== null && week === null && (
        <>
          <Metrics items={monthItems} title={`${MONTHS[month - 1]} ${year}`} />
          <section className="space-y-2">
            <h2 className="text-sm font-bold">Semanas de {MONTHS[month - 1]}</h2>
            <div className="grid grid-cols-2 gap-3">
              {weeks.map((value) => (
                <button key={value} onClick={() => { setWeek(value); reset("week"); }} className="bg-white border border-gray-200 rounded-xl p-4 text-left card-hover">
                  <p className="font-bold text-primary">Semana {value}</p>
                  <p className="text-xs text-gray-500">{monthItems.filter((item) => item.semana === value).length} registros</p>
                </button>
              ))}
            </div>
          </section>
          <WeeklyChart transacciones={monthItems} />
        </>
      )}

      {week !== null && day === null && (
        <>
          <Metrics items={weekItems} title={`Semana ${week}`} />
          <ProductInsights items={weekItems} />
          <p className="text-xs text-gray-500">Promedio diario: {formatCurrency(sum(weekItems, "balance") / Math.max(days.length, 1))}</p>
          <section className="space-y-2">
            <h2 className="text-sm font-bold">Días</h2>
            <div className="grid grid-cols-2 gap-3">
              {days.map((value) => (
                <button key={value} onClick={() => setDay(value)} className="bg-white border border-gray-200 rounded-xl p-4 text-left card-hover">
                  <p className="font-bold text-primary">{value}</p>
                  <p className="text-xs text-gray-500">{weekItems.filter((item) => item.fecha === value).length} movimientos</p>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {day !== null && (
        <>
          <Metrics items={dayItems} title={`Registro diario · ${day}`} />
          <ProductInsights items={dayItems} />
          <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <DataTable transacciones={dayItems} titulo={`Movimientos de ${day}`} limit={100} />
          </section>
          <button onClick={() => setDay(null)} className="w-full py-3 text-xs font-bold text-primary bg-blue-50 rounded-xl min-h-[44px] active:scale-95 transition-transform">
            ← Volver a semanas
          </button>
        </>
      )}
    </div>
  );
}
