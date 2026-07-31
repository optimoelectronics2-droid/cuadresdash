import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/push";
import { loadSubscriptions } from "@/lib/push-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  try {
    const subs = await loadSubscriptions();
    if (subs.length === 0) {
      return NextResponse.json(
        { success: false, error: "No hay suscripciones activas. Abre la app, acepta el permiso de notificaciones y recarga." },
        { status: 404 }
      );
    }
    const result = await sendPushNotification(
      "Prueba de notificación",
      "Si estás viendo esto, las notificaciones push funcionan correctamente en tu teléfono.",
      `test-${Date.now()}`,
      { tipo: "test", url: "/" }
    );
    if (result.success === 0) {
      return NextResponse.json(
        { success: false, error: `No se pudo entregar la notificación (${result.failed} dispositivo(s) con error)`, sent: 0, failed: result.failed },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, sent: result.success, failed: result.failed });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Error al enviar prueba" },
      { status: 500 }
    );
  }
}
