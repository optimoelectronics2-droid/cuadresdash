import { EventEmitter } from "node:events";

export interface DashboardUpdateEvent { revision: string; updatedAt: string; }
const emitter = new EventEmitter();
emitter.setMaxListeners(0);
export function publishDashboardUpdate(event: DashboardUpdateEvent) { emitter.emit("dashboard-update", event); }
export function subscribeToDashboardUpdates(listener: (event: DashboardUpdateEvent) => void) {
  emitter.on("dashboard-update", listener);
  return () => emitter.off("dashboard-update", listener);
}
