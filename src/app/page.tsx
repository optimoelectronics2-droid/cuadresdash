"use client";

import { useData } from "@/hooks/useData";
import { formatCurrency } from "@/lib/data-processor";
import CategoryCard from "@/components/CategoryCard";
import PeriodButtons from "@/components/PeriodButtons";
import { WeeklyChart, MonthlyChart } from "@/components/Charts";
import DataTable from "@/components/DataTable";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function HomePage() {
  const { data, loading, error, configError, lastUpdate, isLive, isRefreshing, refresh } = useData();
  const [timeAgo, setTimeAgo] = useState("");
  const [pullMsg, setPullMsg] = useState("");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const touchStartY = useRef(0);
  const touchMoveY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lastUpdate) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 1000);
      if (diff < 5) setTimeAgo("ahora");
      else if (diff < 60) setTimeAgo(`hace ${diff}s`);
      else if (diff < 3600) setTimeAgo(`hace ${Math.floor(diff / 60)}min`);
      else setTimeAgo(`hace ${Math.floor(diff / 3600)}h`);
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; touchMoveY.current = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      touchMoveY.current = e.touches[0].clientY;
      if (window.scrollY === 0) {
        const diff = touchMoveY.current - touchStartY.current;
        if (diff > 80) setPullMsg("Suelta para actualizar");
        else if (diff > 30) setPullMsg("Desliza hacia abajo");
        else setPullMsg("");
      }
    };
    const onTouchEnd = () => {
      if (window.scrollY === 0 && touchMoveY.current - touchStartY.current > 80) {
        void refresh(true);
        setPullMsg("Actualizando...");
        setTimeout(() => setPullMsg(""), 2000);
      } else setPullMsg("");
    };
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [refresh]);

  const q = globalSearch.toLowerCase().trim();

  if (configError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Acceso a Google Drive</h2>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <div className="bg-blue-50 rounded-xl p-4 text-left text-xs text-gray-700 w-full max-w-sm">
          <p className="font-bold mb-2">Para solucionar:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Comparte la carpeta de Drive con <span className="font-mono">cuadre@pruebas-api-490718.iam.gserviceaccount.com</span></li>
            <li>Dale permisos de <span className="font-mono">Editor</span> o <span className="font-mono">Lector</span> a la carpeta</li>
            <li>Verifica que los archivos Excel estén dentro de la carpeta</li>
          </ol>
        </div>
        <button onClick={() => void refresh(true)} className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm min-h-[44px]">Reintentar</button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500">Cargando datos desde Google Drive...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Sin datos</h2>
        <p className="text-sm text-gray-500 mb-4">{error || "No hay transacciones disponibles"}</p>
        <button onClick={() => void refresh(true)} className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm min-h-[44px]">Reintentar</button>
      </div>
    );
  }

  const { resumen, categorias, transacciones } = data;
  const fechaHoy = resumen.diario.fecha;

  // Filter all data by global search
  const transaccionesFiltradas = q
    ? transacciones.filter(tx =>
        tx.concepto.toLowerCase().includes(q) ||
        tx.detalle.toLowerCase().includes(q) ||
        tx.fecha.includes(q) ||
        tx.dia.toLowerCase().includes(q) ||
        tx.tipo.toLowerCase().includes(q) ||
        tx.categoria.toLowerCase().includes(q) ||
        String(tx.monto).includes(q)
      )
    : transacciones;

  const hayResultados = transaccionesFiltradas.length > 0;

  // Find latest day with transactions for hero fallback
  const diasConDatos = [...new Set(transacciones.map(tx => tx.fecha))].sort().reverse();
  const ultimoDiaConDatos = diasConDatos.length > 0 ? diasConDatos[0] : null;
  const hoyTieneDatos = transacciones.some(tx => tx.fecha === fechaHoy);
  const heroEstaVacio = resumen.diario.transacciones === 0;
  const heroFecha = hoyTieneDatos ? fechaHoy : ultimoDiaConDatos;
  const heroTx = heroFecha ? transacciones.filter(tx => tx.fecha === heroFecha) : [];
  const heroEntradas = heroTx.reduce((s, t) => s + t.entradas, 0);
  const heroGastos = heroTx.reduce((s, t) => s + t.gastos, 0);
  const heroBalance = heroTx.reduce((s, t) => s + t.balance, 0);

  // GetTxDelDia helper
  const getTxDelDia = (fecha: string) => transaccionesFiltradas.filter(tx => tx.fecha === fecha);

  // Build all 7 days of the current week (Dom–Sáb) with or without data
  const DIAS_COMPLETOS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
  const ahoraDt = new Date();
  const diffToSun = ahoraDt.getDay();
  const domingo = new Date(ahoraDt);
  domingo.setDate(ahoraDt.getDate() - diffToSun);
  const semanaCompleta = Array.from({length: 7}, (_, i) => {
    const d = new Date(domingo);
    d.setDate(domingo.getDate() + i);
    const fecha = `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`;
    const txs = transacciones.filter(tx => tx.fecha === fecha);
    const entradas = txs.reduce((s, t) => s + t.entradas, 0);
    const gastos = txs.reduce((s, t) => s + t.gastos, 0);
    return { fecha, dia: DIAS_COMPLETOS[d.getDay()], timestamp: d.getTime(), transacciones: txs.length, entradas, gastos, balance: entradas - gastos, txs, esHoy: fecha === fechaHoy };
  });

  // Category totals filtered
  const categoriasConFiltro = q
    ? categorias.map(cat => {
        const filtradas = cat.subcategorias
          ? { ...cat, subcategorias: cat.subcategorias.filter(sc => sc.nombre.toLowerCase().includes(q)) }
          : cat;
        return filtradas;
      }).filter(cat => cat.nombre.toLowerCase().includes(q) || (cat.subcategorias && cat.subcategorias.length > 0))
    : categorias;

  const totalGeneral = Math.max(
    resumen.anual.entradas + resumen.anual.gastos,
    ...categorias.map(c => c.total),
    1
  );

  return (
    <div ref={mainRef} className="space-y-4 pb-4">
      {pullMsg && (
        <div className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="bg-primary text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg">{pullMsg}</div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Control Tienda</h1>
          <p className="text-[10px] text-gray-500">
            {resumen.mensual.nombre} {resumen.anual.anio}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-100">
            <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 live-dot" : "bg-gray-400"}`} />
            <span className="text-[10px] text-gray-500">{timeAgo || "..."}</span>
          </div>
          <button
            onClick={() => void refresh(true)}
            disabled={isRefreshing}
            className="relative w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-90 transition-transform shadow-sm disabled:opacity-50"
          >
            {isRefreshing ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Global Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={globalSearch}
          onChange={e => { setGlobalSearch(e.target.value); setExpandedDay(null); }}
          placeholder="Buscar por producto, monto, fecha, tipo..."
          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm min-h-[44px] shadow-sm"
        />
        {globalSearch && (
          <button
            onClick={() => setGlobalSearch("")}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Today's Hero - falls back to latest data if today empty */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A237E] via-[#283593] to-[#3949AB] p-5 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[11px] font-medium opacity-80">
                {hoyTieneDatos ? "Resultado de hoy" : "Último día con registros"}
              </p>
              <p className="text-[10px] opacity-60">
                {heroFecha && `${heroTx[0]?.dia || ""} · ${heroFecha}`}
                {!heroFecha && "Sin registros"}
              </p>
            </div>
            <Link
              href={hoyTieneDatos ? "/search?periodo=dia" : `/search?periodo=dia&fecha=${ultimoDiaConDatos}`}
              className="px-3 py-1.5 bg-white/15 rounded-full text-[10px] font-bold active:scale-95 transition-transform"
            >
              {hoyTieneDatos ? "Ver detalle" : "Ver último día"}
            </Link>
          </div>
          {heroFecha ? (
            <>
              <p className="text-4xl font-bold tracking-tight animate-count">
                {heroBalance >= 0 ? "+" : ""}{formatCurrency(heroBalance)}
              </p>
              <div className="flex gap-4 mt-3">
                <div className="bg-white/10 rounded-xl px-3 py-2 flex-1">
                  <p className="text-[9px] opacity-70">Entradas</p>
                  <p className="text-sm font-bold text-green-300">+{formatCurrency(heroEntradas)}</p>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2 flex-1">
                  <p className="text-[9px] opacity-70">Gastos</p>
                  <p className="text-sm font-bold text-red-300">-{formatCurrency(heroGastos)}</p>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2 flex-1">
                  <p className="text-[9px] opacity-70">Movimientos</p>
                  <p className="text-sm font-bold">{heroTx.length}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-lg opacity-70">No hay transacciones registradas</p>
          )}
        </div>
      </div>

      {/* Period Buttons */}
      <PeriodButtons resumen={resumen} formatCurrency={formatCurrency} />

      {/* Results counter when searching */}
      {q && (
        <div className="text-xs text-gray-500 text-center">
          {hayResultados
            ? `${transaccionesFiltradas.length} resultado(s) para "${globalSearch}"`
            : `Sin resultados para "${globalSearch}"`
          }
        </div>
      )}

      {/* Hoy — weekly overview with all 7 days (Dom–Sáb) */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-gray-700">
            {q ? "Resultados por día" : `Hoy · ${resumen.semanal.label}`}
          </h2>
          {!q && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">
                Semana: <strong className="text-gray-700">+{formatCurrency(resumen.semanal.entradas)}</strong> / <strong className="text-gray-700">-{formatCurrency(resumen.semanal.gastos)}</strong>
              </span>
              <Link href="/periods?focus=semana" className="text-[10px] text-primary font-medium">Ver todo</Link>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {semanaCompleta.map((dia, idx) => {
            if (q && dia.transacciones === 0) return null;
            const expandida = expandedDay === dia.fecha;
            return (
              <div
                key={dia.fecha}
                className={`rounded-xl border transition-all animate-fade-in-up ${
                  dia.esHoy
                    ? "bg-primary/5 border-primary/20 shadow-sm shadow-primary/10 ring-1 ring-primary/20"
                    : "bg-white border-gray-100 shadow-sm"
                } ${dia.transacciones === 0 ? "opacity-50" : ""}`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <button
                  onClick={() => dia.transacciones > 0 && setExpandedDay(expandida ? null : dia.fecha)}
                  className={`w-full p-3.5 flex items-center gap-3 text-left ${dia.transacciones === 0 ? "cursor-default" : ""}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    dia.esHoy ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    <span className="text-xs font-bold">{dia.dia.substring(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${dia.esHoy ? "text-primary" : dia.transacciones > 0 ? "text-gray-800" : "text-gray-400"}`}>
                        {dia.dia}
                      </span>
                      <span className="text-[10px] text-gray-400">{dia.fecha}</span>
                      {dia.esHoy && (
                        <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">HOY</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">{dia.transacciones > 0 ? `${dia.transacciones} movimiento(s)` : "Sin registros"}</p>
                  </div>
                  <div className="text-right">
                    {dia.transacciones > 0 ? (
                      <>
                        <p className={`text-sm font-bold ${dia.balance >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {dia.balance >= 0 ? "+" : ""}{formatCurrency(dia.balance)}
                        </p>
                        <div className="flex gap-2 text-[9px] text-gray-500">
                          <span className="text-green-600">+{formatCurrency(dia.entradas)}</span>
                          <span className="text-red-600">-{formatCurrency(dia.gastos)}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-300">—</span>
                    )}
                  </div>
                  {dia.transacciones > 0 && (
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"
                      className={`flex-shrink-0 transition-transform ${expandida ? "rotate-90" : ""}`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>
                {expandida && dia.transacciones > 0 && (
                  <div className="px-3.5 pb-3.5 animate-fade-in-up">
                    <div className="border-t border-gray-100 pt-3">
                      <DataTable transacciones={getTxDelDia(dia.fecha)} titulo={`Movimientos de ${dia.fecha}`} limit={15} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Weekly total bar */}
        {!q && (
          <div className="mt-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="font-bold text-gray-600">Total semana</span>
            <div className="flex items-center gap-4">
              <span className="text-green-700 font-bold">+{formatCurrency(resumen.semanal.entradas)}</span>
              <span className="text-red-700 font-bold">-{formatCurrency(resumen.semanal.gastos)}</span>
              <span className={`font-bold ${resumen.semanal.balance >= 0 ? "text-primary" : "text-red-700"}`}>
                {resumen.semanal.balance >= 0 ? "+" : ""}{formatCurrency(resumen.semanal.balance)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-gray-700">Categorías</h2>
          <Link href="/categories/historial" className="text-[10px] text-primary font-medium">Ver todo</Link>
        </div>
        <div className="space-y-2.5">
          {categoriasConFiltro.map((cat, idx) => (
            <div key={cat.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
              <CategoryCard {...cat} maxTotal={totalGeneral} />
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      {transaccionesFiltradas.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-3">Gráficos</h2>
          <div className="space-y-3">
            <WeeklyChart transacciones={transaccionesFiltradas} />
            {resumen.anual.meses.length > 0 && (
              <MonthlyChart meses={resumen.anual.meses} />
            )}
          </div>
        </section>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-[11px] text-yellow-800 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <span>{error}</span>
          <button onClick={() => void refresh(true)} className="ml-auto text-[10px] font-bold text-yellow-900 underline whitespace-nowrap">Reintentar</button>
        </div>
      )}

      {/* Sync button */}
      <div className="text-center">
        <button
          onClick={() => void refresh(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary text-primary rounded-xl font-bold text-sm min-h-[44px] active:scale-95 transition-transform disabled:opacity-50"
        >
          {isRefreshing ? (
            <><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Sincronizando...</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
            Sincronizar ahora</>
          )}
        </button>
        <p className="text-[10px] text-gray-400 mt-2">Actualización automática cada 5s</p>
      </div>
    </div>
  );
}
