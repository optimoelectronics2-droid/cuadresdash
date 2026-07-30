import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BCryJ9GA9DXF6tmuWWIhJNEMv7rP93jCeFXYV5lCtjjI_EMLc6LMHYfEuUTlIWO1OMmD1LzeQsJOF17RsAAmnp0";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "vv4_GTbOCgqdAPu8eQV9JmMrRe7k6beHdzWKYxDVK_Y";
const VAPID_SUBJECT = "mailto:cuadre@pruebas-api-490718.iam.gserviceaccount.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

let subscriptions: PushSubscriptionJSON[] = [];

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export function addSubscription(sub: PushSubscriptionJSON): void {
  const exists = subscriptions.some((s) => s.endpoint === sub.endpoint);
  if (!exists) subscriptions.push(sub);
}

export function removeSubscription(endpoint: string): void {
  subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
}

export async function sendPushNotification(
  title: string,
  body: string,
  tag?: string,
  data?: Record<string, unknown>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  const payload = JSON.stringify({ title, body, tag: tag || "report", data: data || {}, url: "/" });
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub as any, payload);
      success++;
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        removeSubscription(sub.endpoint!);
      }
      failed++;
    }
  }
  return { success, failed };
}

export async function sendWeeklyReport(
  semanaActual: number,
  balanceSemana: number,
  entradasSemana: number,
  gastosSemana: number,
  semanaAnterior?: number,
  balanceAnterior?: number
): Promise<void> {
  if (semanaAnterior !== undefined && balanceAnterior !== undefined) {
    const diff = balanceSemana - balanceAnterior;
    const mejor = diff >= 0;
    await sendPushNotification(
      `Semana ${semanaActual} vs Semana ${semanaAnterior}`,
      mejor
        ? `Mejor por $${Math.abs(diff).toLocaleString("en-US")}`
        : `Peor por $${Math.abs(diff).toLocaleString("en-US")}`,
      `week-${semanaActual}`,
      { tipo: "semanal", semana: semanaActual, balance: balanceSemana }
    );
  } else {
    await sendPushNotification(
      `Semana ${semanaActual}`,
      `Balance: $${balanceSemana.toLocaleString("en-US")} | Entradas: $${entradasSemana.toLocaleString("en-US")} | Gastos: $${gastosSemana.toLocaleString("en-US")}`,
      `week-${semanaActual}`,
      { tipo: "semanal", semana: semanaActual, balance: balanceSemana }
    );
  }
}

export async function sendMonthlyReport(
  mesNombre: string,
  balanceMes: number,
  entradasMes: number,
  gastosMes: number,
  mesAnterior?: string,
  balanceAnterior?: number
): Promise<void> {
  if (mesAnterior !== undefined && balanceAnterior !== undefined) {
    const diff = balanceMes - balanceAnterior;
    const mejor = diff >= 0;
    await sendPushNotification(
      `${mesNombre} vs ${mesAnterior}`,
      mejor
        ? `Mejor por $${Math.abs(diff).toLocaleString("en-US")}`
        : `Peor por $${Math.abs(diff).toLocaleString("en-US")}`,
      `month-${mesNombre}`,
      { tipo: "mensual", mes: mesNombre, balance: balanceMes }
    );
  } else {
    await sendPushNotification(
      mesNombre,
      `Balance: $${balanceMes.toLocaleString("en-US")} | Entradas: $${entradasMes.toLocaleString("en-US")} | Gastos: $${gastosMes.toLocaleString("en-US")}`,
      `month-${mesNombre}`,
      { tipo: "mensual", mes: mesNombre, balance: balanceMes }
    );
  }
}
