"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/data-processor";

interface PeriodData {
  entradas: number;
  gastos: number;
  balance: number;
  transacciones?: number;
  dias?: { fecha: string }[];
  semanas?: { label: string }[];
}

interface PeriodButtonsProps {
  resumen: {
    diario: PeriodData & { fecha: string; dia: string };
    semanal: PeriodData & { semana: number; label: string; dias: { fecha: string }[] };
    mensual: PeriodData & { mes: number; nombre: string; semanas: { label: string }[] };
    anual: PeriodData & { anio: number; meses: { nombre: string }[] };
  };
  formatCurrency: (n: number) => string;
}

function PeriodCard({
  label,
  slug,
  data,
  color,
  icon,
  detail,
}: {
  label: string;
  slug: string;
  data: PeriodData;
  color: string;
  icon: React.ReactNode;
  detail: string;
}) {
  const max = Math.max(data.entradas, data.gastos, 1);
  const pctEnt = (data.entradas / max) * 100;
  const pctGas = (data.gastos / max) * 100;

  return (
    <Link
      href={`/periods?focus=${slug}`}
      className="block rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden card-hover"
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
            {label}
          </span>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
            {icon}
          </div>
        </div>
        <p className="text-lg font-bold" style={{ color: data.balance === 0 ? "#6B7280" : data.balance > 0 ? "#2E7D32" : "#C62828" }}>
          {data.balance > 0 ? "+" : data.balance < 0 ? "-" : ""}{formatCurrency(Math.abs(data.balance))}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            +{formatCurrency(data.entradas)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            -{formatCurrency(data.gastos)}
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${pctEnt}%` }} />
          <div className="h-full bg-red-500 transition-all" style={{ width: `${pctGas}%` }} />
        </div>
        <p className="text-[9px] text-gray-400 mt-1.5">{detail}</p>
      </div>
    </Link>
  );
}

export default function PeriodButtons({ resumen, formatCurrency }: PeriodButtonsProps) {
  const periods = [
    {
      label: "Hoy",
      slug: "dia",
      data: resumen.diario,
      color: "#1565C0",
      detail: `${resumen.diario.dia} · ${resumen.diario.fecha}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Semana",
      slug: "semana",
      data: resumen.semanal,
      color: "#2E7D32",
      detail: `${resumen.semanal.dias.length} días · ${resumen.semanal.label}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: "Mes",
      slug: "mes",
      data: resumen.mensual,
      color: "#E65100",
      detail: `${resumen.mensual.semanas.length} semanas · ${resumen.mensual.nombre}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      label: "Año",
      slug: "anio",
      data: resumen.anual,
      color: "#6A1B9A",
      detail: `${resumen.anual.meses.length} meses · ${resumen.anual.anio}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6A1B9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {periods.map((p) => (
        <PeriodCard key={p.slug} {...p} />
      ))}
    </div>
  );
}
