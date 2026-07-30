"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cacheDashboardData, getCachedDashboardData } from "@/lib/db";
import { filterTransacciones, formatCurrency } from "@/lib/data-processor";
import { generarNotificaciones, mostrarNotificacion, type Comparacion } from "@/lib/notifications";
import type { DashboardData, DateFilter, Transaccion } from "@/lib/types";

type Summary = { total: number; entradas: number; gastos: number; balance: number; entradasStr: string; gastosStr: string; balanceStr: string };
interface Value { data: DashboardData | null; loading: boolean; error: string | null; configError: boolean; lastUpdate: string; isLive: boolean; isRefreshing: boolean; refresh: (force?: boolean) => Promise<void>; getFilteredData: (filter: DateFilter) => Transaccion[]; getFilteredSummary: (filter: DateFilter) => Summary; }
const DataContext = createContext<Value | null>(null);
const CHANNEL_NAME = "control-tienda-dashboard";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const mountedRef = useRef(true);
  const dataRef = useRef<DashboardData | null>(null);

  const applyData = useCallback(async (next: DashboardData, timestamp = next.ultimaActualizacion) => {
    if (!mountedRef.current) return;
    dataRef.current = next;
    setData(next); setLastUpdate(timestamp); setError(null); setConfigError(false);
    await cacheDashboardData(next);
  }, []);

  const refresh = useCallback(async (force = false) => {
    controllerRef.current?.abort();
    const controller = new AbortController(); controllerRef.current = controller;
    setIsRefreshing(true);
    try {
      const response = await fetch(force ? "/api/data?refresh=1" : "/api/data", { cache: "no-store", signal: controller.signal });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw Object.assign(new Error(payload.error || "Error al obtener datos"), { configError: payload.configError });
      await applyData(payload.data, payload.timestamp); setIsLive(true);
      channelRef.current?.postMessage({ type: "data", data: payload.data, timestamp: payload.timestamp });
    } catch (cause: any) {
      if (cause?.name === "AbortError" || !mountedRef.current) return;
      setIsLive(false); setConfigError(Boolean(cause?.configError));
      const cached = await getCachedDashboardData();
      if (cached) { await applyData(cached.data, new Date(cached.timestamp).toISOString()); setError("Mostrando la última copia local; se actualizará al reconectar."); }
      else if (!dataRef.current) setError(cause?.message || "No se pudo conectar y no hay datos locales.");
    } finally { if (mountedRef.current) { setLoading(false); setIsRefreshing(false); } }
  }, [applyData]);

  useEffect(() => {
    mountedRef.current = true;
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    const onMessage = (event: MessageEvent) => { if (event.data?.type === "data") void applyData(event.data.data, event.data.timestamp); };
    channel?.addEventListener("message", onMessage);
    // Register push subscription for real Android notifications
    if ("Notification" in window && "serviceWorker" in navigator) {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          navigator.serviceWorker.ready.then(async (reg) => {
            try {
              const pubRes = await fetch("/api/push/subscribe");
              const { publicKey } = await pubRes.json();
              if (!publicKey) return;
              const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
              });
              await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription: sub.toJSON() }),
              });
            } catch {}
          });
        }
      }).catch(() => {});
    }
    void (async () => { const cached = await getCachedDashboardData(); if (cached && mountedRef.current) await applyData(cached.data, new Date(cached.timestamp).toISOString()); await refresh(); })();
    const events = new EventSource("/api/events");
    events.onopen = () => setIsLive(true);
    events.onerror = () => setIsLive(false);
    events.addEventListener("data-updated", () => void refresh(true));
    const pollTimer = setInterval(() => void refresh(false), 5000);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(false); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { mountedRef.current = false; controllerRef.current?.abort(); clearInterval(pollTimer); events.close(); document.removeEventListener("visibilitychange", onVisible); channel?.removeEventListener("message", onMessage); channel?.close(); channelRef.current = null; };
  }, [applyData, refresh]);

  const getFilteredData = useCallback((filter: DateFilter) => data ? filterTransacciones(data.transacciones, filter) : [], [data]);
  const getFilteredSummary = useCallback((filter: DateFilter): Summary => {
    const txs = getFilteredData(filter); const entradas = txs.reduce((sum, tx) => sum + tx.entradas, 0); const gastos = txs.reduce((sum, tx) => sum + tx.gastos, 0); const balance = txs.reduce((sum, tx) => sum + tx.balance, 0);
    return { total: txs.length, entradas, gastos, balance, entradasStr: formatCurrency(entradas), gastosStr: formatCurrency(gastos), balanceStr: formatCurrency(balance) };
  }, [getFilteredData]);
  // Show notifications when data updates
  const prevDataRef = useRef<string>("");
  useEffect(() => {
    if (!data || !data.transacciones.length) return;
    const key = `${data.ultimaActualizacion}-${data.transacciones.length}`;
    if (key === prevDataRef.current) return;
    prevDataRef.current = key;

    const comparaciones = generarNotificaciones(
      data.transacciones,
      data.resumen.semanal,
      data.resumen.mensual
    );
    for (const comp of comparaciones) {
      const storageKey = `notif-${comp.tipo}-${comp.balanceActual}`;
      if (localStorage.getItem(storageKey) === "1") continue;
      localStorage.setItem(storageKey, "1");
      setTimeout(() => void mostrarNotificacion(comp), 2000);
    }
  }, [data]);

  return <DataContext.Provider value={{ data, loading, error, configError, lastUpdate, isLive, isRefreshing, refresh, getFilteredData, getFilteredSummary }}>{children}</DataContext.Provider>;
}

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw.split("").map((c) => c.charCodeAt(0)));
}

export function useDashboardData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useData debe usarse dentro de DataProvider");
  return value;
}
