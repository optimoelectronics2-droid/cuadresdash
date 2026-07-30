import { createDriveChangesWatch } from "@/lib/google-drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Invoke from a protected scheduler to create/renew the Drive push channel. */
export async function POST(request: Request) {
  const secret = process.env.SYNC_ADMIN_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  const token = process.env.DRIVE_WEBHOOK_TOKEN;
  if (!appUrl || !token) return Response.json({ error: "APP_URL y DRIVE_WEBHOOK_TOKEN son obligatorios" }, { status: 500 });
  try {
    const watch = await createDriveChangesWatch(`${appUrl}/api/webhooks/drive`, token);
    return Response.json({ success: true, ...watch });
  } catch (error: any) {
    console.error("No se pudo registrar changes.watch", error);
    return Response.json({ success: false, error: error?.message || "Error registrando Drive watch" }, { status: 500 });
  }
}
