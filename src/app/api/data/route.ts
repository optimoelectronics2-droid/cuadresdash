import { NextResponse } from "next/server";
import { refreshDashboardData } from "@/lib/dashboard-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await refreshDashboardData();
    const response = NextResponse.json({ success: true, data, timestamp: data.ultimaActualizacion });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Surrogate-Control", "no-store");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch (error: any) {
    const message = error?.message || "Error desconocido";
    const configError = /credenciales|invalid|permission|not found|JSON/i.test(message);
    return NextResponse.json({ success: false, error: configError ? "No se puede acceder a Google Drive. Revisa las credenciales y permisos." : message, configError }, { status: 500 });
  }
}
