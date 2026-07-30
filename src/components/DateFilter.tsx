"use client";

import { useState } from "react";
import type { DateFilter } from "@/lib/types";

interface DateFilterProps {
  onFilter: (filter: DateFilter) => void;
  currentFilter: DateFilter;
}

export default function DateFilter({ onFilter, currentFilter }: DateFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const desde = currentFilter.tipo === "rango" ? currentFilter.desde || "" : "";
  const hasta = currentFilter.tipo === "rango" ? currentFilter.hasta || "" : "";

  const periodos: { label: string; tipo: DateFilter["tipo"]; filter: DateFilter }[] = [
    { label: "Hoy", tipo: "dia", filter: getTodayFilter() },
    { label: "Semana", tipo: "semana", filter: getWeekFilter() },
    { label: "Mes", tipo: "mes", filter: getMonthFilter() },
    { label: "Año", tipo: "anio", filter: getYearFilter() },
  ];
  const quickPeriods: { label: string; filter: DateFilter }[] = [
    { label: "Ayer", filter: getRelativeDayFilter(-1) },
    { label: "Semana pasada", filter: getRelativeWeekFilter(-1) },
    { label: "Mes anterior", filter: getRelativeMonthFilter(-1) },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {periodos.map((p) => (
          <button
            key={p.tipo}
            onClick={() => {
              onFilter(p.filter);
              setShowCustom(false);
            }}
            className={`py-2.5 px-1 rounded-lg text-xs font-bold min-h-[44px] transition-all active:scale-95 ${
              currentFilter.tipo === p.tipo && !showCustom
                ? "bg-primary text-white shadow-md"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {quickPeriods.map((period) => <button key={period.label} onClick={() => { onFilter(period.filter); setShowCustom(false); }} className="py-2 text-[10px] font-semibold text-gray-700 bg-gray-100 rounded-lg">{period.label}</button>)}
      </div>

      <button
        onClick={() => setShowCustom(!showCustom)}
        className="w-full py-2 text-xs font-medium text-primary bg-blue-50 rounded-lg min-h-[44px]"
      >
        {showCustom ? "Ocultar filtro personalizado" : "Filtro personalizado"}
      </button>

      {showCustom && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-gray-600 block mb-1">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => {
                  if (e.target.value) {
                    onFilter({ tipo: "rango", desde: e.target.value, hasta: hasta || e.target.value });
                  }
                }}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-lg min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-600 block mb-1">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => {
                  if (e.target.value) {
                    onFilter({ tipo: "rango", desde: desde || e.target.value, hasta: e.target.value });
                  }
                }}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-lg min-h-[44px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <button
                key={m}
                onClick={() => onFilter({ tipo: "mes", mes: m, anio: new Date().getFullYear() })}
                className={`py-2 rounded-lg text-[10px] font-medium min-h-[38px] ${
                  currentFilter.mes === m ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-700"
                }`}
              >
                {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][m - 1]}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const prev = new Date();
              prev.setMonth(prev.getMonth() - 1);
              onFilter({
                tipo: "rango",
                desde: new Date(prev.getFullYear(), prev.getMonth(), 1).toISOString().split("T")[0],
                hasta: new Date().toISOString().split("T")[0],
              });
            }}
            className="w-full py-2.5 text-xs font-bold text-white bg-secondary rounded-lg min-h-[44px]"
          >
            Comparar mes anterior
          </button>
        </div>
      )}
    </div>
  );
}

function getTodayFilter(): DateFilter {
  const now = new Date();
  return { tipo: "dia", dia: now.getDate(), mes: now.getMonth() + 1, anio: now.getFullYear() };
}

function getWeekFilter(): DateFilter {
  const now = new Date();
  const semana = Math.ceil(now.getDate() / 7);
  return { tipo: "semana", semana, mes: now.getMonth() + 1, anio: now.getFullYear() };
}

function getMonthFilter(): DateFilter {
  const now = new Date();
  return { tipo: "mes", mes: now.getMonth() + 1, anio: now.getFullYear() };
}

function getYearFilter(): DateFilter {
  return { tipo: "anio", anio: new Date().getFullYear() };
}

function getRelativeDayFilter(days: number): DateFilter {
  const date = new Date(); date.setDate(date.getDate() + days);
  return { tipo: "dia", dia: date.getDate(), mes: date.getMonth() + 1, anio: date.getFullYear() };
}

function getRelativeWeekFilter(weeks: number): DateFilter {
  const date = new Date(); date.setDate(date.getDate() + weeks * 7);
  return { tipo: "semana", semana: Math.ceil(date.getDate() / 7), mes: date.getMonth() + 1, anio: date.getFullYear() };
}

function getRelativeMonthFilter(months: number): DateFilter {
  const date = new Date(); date.setMonth(date.getMonth() + months);
  return { tipo: "mes", mes: date.getMonth() + 1, anio: date.getFullYear() };
}
