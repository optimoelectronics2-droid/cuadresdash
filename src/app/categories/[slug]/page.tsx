"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/hooks/useData";
import { formatCurrency } from "@/lib/data-processor";
import DataTable from "@/components/DataTable";
import { WeeklyChart } from "@/components/Charts";
import { useMemo, useState } from "react";
import Link from "next/link";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data, loading } = useData();
  const [view, setView] = useState<"tabla" | "grafico">("tabla");

  const categoryInfo = useMemo(() => {
    if (!data) return null;

    if (slug === "historial") {
      return {
        nombre: "Historial Completo",
        color: "#6A1B9A",
        transacciones: data.transacciones,
        total: data.transacciones.reduce((s, t) => s + t.monto, 0),
        icono: "file-text",
      };
    }

    const cat = data.categorias.find((c) => c.slug === slug);
    if (!cat) {
      const allCats = data.categorias.flatMap(
        (c) => c.subcategorias?.map((sc) => ({ ...sc, parentSlug: c.slug })) || []
      );
      const subCat = allCats.find((sc) => sc.slug === slug);
      if (subCat) {
        const txs = data.transacciones.filter(
          (t) =>
            t.concepto.toLowerCase() === subCat.nombre.toLowerCase()
        );
        return {
          nombre: subCat.nombre,
          color: subCat.color,
          transacciones: txs,
          total: subCat.total,
          icono: "receipt",
          parentSlug: subCat.parentSlug,
        };
      }
      return null;
    }

    let txs = data.transacciones;
    if (cat.slug === "ventas") {
      txs = data.transacciones.filter((t) => t.tipo === "Entrada");
    } else if (cat.slug === "gastos") {
      txs = data.transacciones.filter((t) => t.tipo === "Gasto");
    } else if (cat.slug === "balance") {
      txs = data.transacciones;
    }

    return {
      nombre: cat.nombre,
      color: cat.color,
      transacciones: txs,
      total: cat.total,
      icono: cat.icono,
      subcategorias: cat.subcategorias,
    };
  }, [data, slug]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!categoryInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <p className="text-gray-500 mb-4">Categoría no encontrada</p>
        <Link href="/" className="text-primary font-bold text-sm">Volver al inicio</Link>
      </div>
    );
  }

  const ingresos = categoryInfo.transacciones.filter((t) => t.tipo === "Entrada");
  const egresos = categoryInfo.transacciones.filter((t) => t.tipo === "Gasto");

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <Link href="/" className="hover:text-primary">Inicio</Link>
        <span>/</span>
        {(categoryInfo as any).parentSlug ? (
          <>
            <Link href={`/categories/${(categoryInfo as any).parentSlug}`} className="hover:text-primary capitalize">
              {(categoryInfo as any).parentSlug}
            </Link>
            <span>/</span>
          </>
        ) : null}
        <span className="text-gray-800 font-medium">{slug}</span>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold" style={{ color: categoryInfo.color }}>
              {categoryInfo.nombre}
            </h1>
            <p className="text-2xl font-bold mt-1" style={{ color: categoryInfo.color }}>
              {formatCurrency(categoryInfo.total)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">{categoryInfo.transacciones.length} transacciones</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-green-700">Entradas</p>
            <p className="text-sm font-bold text-green-700">
              {formatCurrency(ingresos.reduce((s, t) => s + t.monto, 0))}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-red-700">Gastos</p>
            <p className="text-sm font-bold text-red-700">
              {formatCurrency(egresos.reduce((s, t) => s + t.monto, 0))}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-blue-700">Balance</p>
            <p className="text-sm font-bold text-blue-700">
              {formatCurrency(categoryInfo.transacciones.reduce((s, t) => s + t.balance, 0))}
            </p>
          </div>
        </div>
      </div>

      {(categoryInfo as any).subcategorias && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Subcategorías</h2>
          {(categoryInfo as any).subcategorias.map((sc: any) => (
            <Link
              key={sc.slug}
              href={`/categories/${sc.slug}`}
              className="block bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{sc.nombre}</span>
                <span className="text-sm font-bold" style={{ color: sc.color }}>
                  {formatCurrency(sc.total)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setView("tabla")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold min-h-[44px] transition-all ${
            view === "tabla" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          Tabla
        </button>
        <button
          onClick={() => setView("grafico")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold min-h-[44px] transition-all ${
            view === "grafico" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          Gráfico
        </button>
      </div>

      {view === "tabla" ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <DataTable transacciones={categoryInfo.transacciones} />
        </div>
      ) : (
        <WeeklyChart transacciones={categoryInfo.transacciones} />
      )}

      <div className="flex gap-2">
        <Link
          href={`/search?tipo=${slug === "gastos" ? "Gasto" : slug === "ventas" ? "Entrada" : ""}`}
          className="flex-1 py-3 bg-primary/10 text-primary rounded-xl text-xs font-bold text-center min-h-[44px] flex items-center justify-center"
        >
          Buscar en {categoryInfo.nombre}
        </Link>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold min-h-[44px]"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
