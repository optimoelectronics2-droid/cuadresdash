import { subscribeToDashboardUpdates } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();
const sse = (event: string, data: unknown) => encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

export async function GET(request: Request) {
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const cleanup = () => { unsubscribe?.(); if (heartbeat) clearInterval(heartbeat); };
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sse("connected", { at: new Date().toISOString() }));
      unsubscribe = subscribeToDashboardUpdates((update) => controller.enqueue(sse("data-updated", update)));
      heartbeat = setInterval(() => controller.enqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`)), 25_000);
      request.signal.addEventListener("abort", () => { cleanup(); controller.close(); }, { once: true });
    },
    cancel() { cleanup(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" } });
}
