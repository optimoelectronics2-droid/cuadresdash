import { refreshDashboardData } from "@/lib/dashboard-service";
import { publishDashboardUpdate } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Google Drive push notifications only invalidate; this endpoint rebuilds a complete snapshot before notifying clients. */
export async function POST(request: Request) {
  const expectedToken = process.env.DRIVE_WEBHOOK_TOKEN;
  const token = request.headers.get("x-goog-channel-token");
  if (!expectedToken || token !== expectedToken) return new Response("Unauthorized", { status: 401 });
  const state = request.headers.get("x-goog-resource-state");
  if (state === "sync") return new Response(null, { status: 204 });
  try {
    const data = await refreshDashboardData();
    publishDashboardUpdate({ revision: data.ultimaActualizacion, updatedAt: data.ultimaActualizacion });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Drive webhook refresh failed", error);
    return new Response("Refresh failed", { status: 503 });
  }
}
