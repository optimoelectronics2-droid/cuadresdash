"use client";

import { useEffect, useState } from "react";

export default function ResetPage() {
  const [status, setStatus] = useState("Limpiando...");

  useEffect(() => {
    (async () => {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
        setStatus(regs.length > 0 ? "Service Worker eliminado. Redirigiendo..." : "No había Service Worker. Redirigiendo...");
      } else {
        setStatus("Redirigiendo...");
      }
      setTimeout(() => { window.location.href = "/"; }, 1500);
    })();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-600">{status}</p>
    </div>
  );
}
