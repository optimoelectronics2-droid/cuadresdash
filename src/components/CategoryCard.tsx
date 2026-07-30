"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/data-processor";

interface CategoryCardProps {
  nombre: string;
  slug: string;
  total: number;
  color: string;
  icono?: string;
  subcategorias?: { nombre: string; total: number; slug: string; color: string }[];
  esSubcategoria?: boolean;
  maxTotal?: number;
}

function Icon({ icono, color }: { icono?: string; color: string }) {
  const s = 22;
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icono) {
    case "trending-up":
      return <svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
    case "shopping-cart":
      return <svg {...props}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>;
    case "wallet":
      return <svg {...props}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>;
    case "file-text":
      return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
  }
}

export default function CategoryCard({ nombre, slug, total, color, icono, subcategorias, esSubcategoria, maxTotal }: CategoryCardProps) {
  const href = slug === "ventas" || slug === "gastos" || slug === "balance" || slug === "historial"
    ? `/categories/${slug}`
    : `/categories/${slug}`;

  const pct = maxTotal && maxTotal > 0 ? (total / maxTotal) * 100 : 0;

  return (
    <Link
      href={href}
      className="block rounded-xl bg-white border border-gray-100 shadow-sm card-hover overflow-hidden"
    >
      <div className="p-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "15" }}>
            <Icon icono={icono} color={color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 truncate">{nombre}</h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" className="flex-shrink-0 ml-2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <p className="text-lg font-bold mt-0.5" style={{ color }}>{formatCurrency(total)}</p>
          </div>
        </div>
        {maxTotal && maxTotal > 0 && (
          <div className="mt-2.5 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
          </div>
        )}
        {subcategorias && subcategorias.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {subcategorias.slice(0, 3).map((sc) => (
              <span key={sc.slug} className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 truncate max-w-[100px]">
                {sc.nombre}: {formatCurrency(sc.total)}
              </span>
            ))}
            {subcategorias.length > 3 && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">+{subcategorias.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
