"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useData } from "@/hooks/useData";
import { useState, useMemo } from "react";
import type { DateFilter as DateFilterType } from "@/lib/types";
import { filterTransacciones, formatCurrency } from "@/lib/data-processor";
import DateFilterComponent from "@/components/DateFilter";
import DataTable from "@/components/DataTable";

function SearchContent() {
  const searchParams = useSearchParams();
  const { data } = useData();

  const initialTipo = searchParams.get("tipo") || "";
  const initialPeriodo = searchParams.get("periodo") || "";
  const initialFecha = searchParams.get("fecha") || "";

  const [filter, setFilter] = useState<DateFilterType>(() => {
    if (initialFecha) {
      const partes = initialFecha.split("/");
      if (partes.length === 3) return { tipo: "dia", dia: parseInt(partes[0]), mes: parseInt(partes[1]), anio: parseInt(partes[2]) };
    }
    if (initialPeriodo === "dia") return getTodayFilter();
    if (initialPeriodo === "semana") return getWeekFilter();
    if (initialPeriodo === "mes") return getMonthFilter();
    if (initialPeriodo === "anio") return getYearFilter();
    return { tipo: "mes", mes: new Date().getMonth() + 1, anio: new Date().getFullYear() };
  });

  const [searchText, setSearchText] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>(initialTipo);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    let txs = filterTransacciones(data.transacciones, filter);

    if (tipoFilter) {
      txs = txs.filter((t) => t.tipo === tipoFilter);
    }

    if (searchText) {
      const q = searchText.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.concepto.toLowerCase().includes(q) ||
          t.detalle.toLowerCase().includes(q) ||
          t.dia.toLowerCase().includes(q) ||
          t.fecha.includes(q) ||
          String(t.monto).includes(q) ||
          t.categoria.toLowerCase().includes(q) ||
          t.archivo.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
      );
    }
    if (minAmount) txs = txs.filter((t) => t.monto >= Number(minAmount));
    if (maxAmount) txs = txs.filter((t) => t.monto <= Number(maxAmount));

    return txs;
  }, [data, filter, tipoFilter, searchText, minAmount, maxAmount]);

  const summary = useMemo(
    () => ({
      total: filtered.length,
      entradas: filtered.reduce((s, t) => s + t.entradas, 0),
      gastos: filtered.reduce((s, t) => s + t.gastos, 0),
      balance: filtered.reduce((s, t) => s + t.balance, 0),
    }),
    [filtered]
  );

  const periodos: { label: string; filter: DateFilterType }[] = [
    { label: "Hoy", filter: getTodayFilter() },
    { label: "Semana", filter: getWeekFilter() },
    { label: "Mes", filter: getMonthFilter() },
    { label: "Año", filter: getYearFilter() },
  ];

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold text-primary">Buscar</h1>

      <div className="grid grid-cols-4 gap-2">
        {periodos.map((p) => (
          <button
            key={p.label}
            onClick={() => setFilter(p.filter)}
            className={`py-2.5 px-1 rounded-lg text-xs font-bold min-h-[44px] transition-all active:scale-95 ${
              JSON.stringify(filter) === JSON.stringify(p.filter)
                ? "bg-primary text-white shadow-md"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
            placeholder="Producto, cliente, nota, categoría, ID o monto..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm min-h-[44px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input type="number" min="0" inputMode="decimal" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="Monto mínimo" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm" />
        <input type="number" min="0" inputMode="decimal" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="Monto máximo" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm" />
      </div>

      <div className="flex gap-2">
        {["", "Entrada", "Gasto"].map((t) => (
          <button
            key={t}
            onClick={() => setTipoFilter(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold min-h-[38px] transition-all ${
              tipoFilter === t
                ? t === "Entrada"
                  ? "bg-green-600 text-white"
                  : t === "Gasto"
                  ? "bg-red-600 text-white"
                  : "bg-primary text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {t || "Todos"}
          </button>
        ))}
      </div>

      <DateFilterComponent onFilter={setFilter} currentFilter={filter} />

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-[10px] text-gray-500">Transacciones</p>
            <p className="text-sm font-bold">{summary.total}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Entradas</p>
            <p className="text-sm font-bold text-green-700">{formatCurrency(summary.entradas)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Gastos</p>
            <p className="text-sm font-bold text-red-700">{formatCurrency(summary.gastos)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Balance</p>
            <p className="text-sm font-bold text-blue-700">{formatCurrency(summary.balance)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable transacciones={filtered} />
      </div>
    </div>
  );
}

function getTodayFilter(): DateFilterType {
  const now = new Date();
  return { tipo: "dia", dia: now.getDate(), mes: now.getMonth() + 1, anio: now.getFullYear() };
}

function getWeekFilter(): DateFilterType {
  const now = new Date();
  const semana = Math.ceil(now.getDate() / 7);
  return { tipo: "semana", semana, mes: now.getMonth() + 1, anio: now.getFullYear() };
}

function getMonthFilter(): DateFilterType {
  const now = new Date();
  return { tipo: "mes", mes: now.getMonth() + 1, anio: now.getFullYear() };
}

function getYearFilter(): DateFilterType {
  return { tipo: "anio", anio: new Date().getFullYear() };
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
