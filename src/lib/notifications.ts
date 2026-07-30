"use client";

export type { Comparacion } from "./comparisons";
export { compararSemanas, compararMeses, obtenerSemanaAnterior, obtenerMesAnterior, generarComparaciones as generarNotificaciones } from "./comparisons";

export async function mostrarNotificacion(comp: import("./comparisons").Comparacion): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "denied") return;
  if (Notification.permission === "default") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(comp.titulo, {
      body: comp.mensaje,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: `comparacion-${comp.tipo}-${Date.now()}`,
      data: { tipo: comp.tipo, url: "/" },
    });
  } catch {
    new Notification(comp.titulo, { body: comp.mensaje, icon: "/icons/icon-192.png" });
  }
}
