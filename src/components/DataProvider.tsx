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
      // The API reads Drive at request time. data.json is only an offline/build fallback;
      // it cannot change after a Netlify deploy.
      const apiUrl = force ? `/api/data?t=${Date.now()}` : "/api/data";
      const response = await fetch(apiUrl, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload?.success || !payload?.data) {
        const error: Error & { configError?: boolean } = new Error(payload?.error || "La API no devolviÃ³ datos.");
        error.configError = Boolean(payload?.configError);
        throw error;
      }
      await applyData(payload.data, payload.timestamp || payload.data.ultimaActualizacion); setIsLive(true);
    } catch (cause: any) {
      if (cause?.name === "AbortError" || !mountedRef.current) return;
      setIsLive(false); setConfigError(Boolean(cause?.configError));
      // A Netlify deploy leaves behind a complete static snapshot. Use it only for
      // transient API/Drive outages; credential errors must remain visible.
      if (!cause?.configError) {
        try {
          const fallback = await fetch(`/data.json?t=${Date.now()}`, { cache: "no-store", signal: controller.signal });
          if (fallback.ok) {
            const snapshot = await fallback.json();
            if (snapshot?.transacciones) {
              await applyData(snapshot, snapshot.ultimaActualizacion);
              setError("Mostrando la última copia publicada; se actualizará automáticamente al reconectar.");
              return;
            }
          }
        } catch (fallbackCause: any) {
          if (fallbackCause?.name === "AbortError") return;
        }
      }
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
    // Netlify functions do not share an in-memory event bus between requests.
    // Polling the API below is therefore the reliable production synchronization.
    const pollTimer = setInterval(() => void refresh(false), 30000);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(false); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { mountedRef.current = false; controllerRef.current?.abort(); clearInterval(pollTimer); document.removeEventListener("visibilitychange", onVisible); channel?.removeEventListener("message", onMessage); channel?.close(); channelRef.current = null; };
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
