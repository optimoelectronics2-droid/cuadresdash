import { readPersistent, writePersistent } from "./persistent-store.ts";

const KEY = "sync-state";

export interface SyncState {
  lastFileSignature: string;
  lastTxCount: number;
  lastNotifiedAt: string | null;
}

export async function getSyncState(): Promise<SyncState> {
  const stored = await readPersistent<SyncState>(KEY);
  return stored ?? { lastFileSignature: "", lastTxCount: 0, lastNotifiedAt: null };
}

export async function setSyncState(state: SyncState): Promise<void> {
  await writePersistent(KEY, state);
}
