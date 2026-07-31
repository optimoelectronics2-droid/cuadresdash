import { NextResponse } from "next/server";
import { removeSubscription } from "@/lib/push";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.endpoint) {
      return NextResponse.json({ error: "Falta endpoint" }, { status: 400 });
    }
    await removeSubscription(body.endpoint);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al desuscribir" }, { status: 500 });
  }
}
