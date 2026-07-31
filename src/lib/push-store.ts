import { readPersistent, writePersistent } from "./persistent-store.ts";

const KEY = "push-subscriptions";

let memorySubscriptions: PushSubscriptionJSON[] | null = null;

function mergeUnique(lists: PushSubscriptionJSON[][]): PushSubscriptionJSON[] {
  const seen = new Map<string, PushSubscriptionJSON>();
  for (const list of lists) {
    for (const sub of list) {
      if (sub?.endpoint && !seen.has(sub.endpoint)) seen.set(sub.endpoint, sub);
    }
  }
  return [...seen.values()];
}

export async function loadSubscriptions(): Promise<PushSubscriptionJSON[]> {
  if (memorySubscriptions) return memorySubscriptions;
  const stored = await readPersistent<PushSubscriptionJSON[]>(KEY);
  memorySubscriptions = mergeUnique([stored ?? []]);
  return memorySubscriptions;
}

export async function saveSubscriptions(subs: PushSubscriptionJSON[]): Promise<void> {
  memorySubscriptions = subs;
  await writePersistent(KEY, subs);
}

export async function addSubscription(sub: PushSubscriptionJSON): Promise<void> {
  const subs = await loadSubscriptions();
  if (!subs.some((s) => s.endpoint === sub.endpoint)) {
    subs.push(sub);
    await saveSubscriptions(subs);
  }
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const subs = await loadSubscriptions();
  const filtered = subs.filter((s) => s.endpoint !== endpoint);
  if (filtered.length !== subs.length) {
    await saveSubscriptions(filtered);
  }
}
