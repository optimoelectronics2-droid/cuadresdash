import { NextResponse } from "next/server";
import { addSubscription, getVapidPublicKey } from "@/lib/push";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.subscription?.endpoint) {
      return NextResponse.json({ error: "Falta subscription" }, { status: 400 });
    }
    await addSubscription(body.subscription);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al suscribir" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}
