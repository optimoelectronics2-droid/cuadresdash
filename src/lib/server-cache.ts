import type { DashboardData } from "./types";

interface CacheEntry {
  data: DashboardData;
  timestamp: number;
  files: { name: string; modified: string }[];
}

let cache: CacheEntry | null = null;
let fetchInProgress: Promise<DashboardData> | null = null;

export function getCachedData(): CacheEntry | null {
  return cache;
}

export function setCachedData(
  data: DashboardData,
  files: { name: string; modified: string }[]
) {
  cache = { data, timestamp: Date.now(), files };
}

export function getFetchPromise(): Promise<DashboardData> | null {
  return fetchInProgress;
}

export function setFetchPromise(p: Promise<DashboardData> | null) {
  fetchInProgress = p;
}

export function isCacheStale(
  currentFiles: { name: string; modified: string }[]
): boolean {
  if (!cache) return true;
  if (cache.files.length !== currentFiles.length) return true;
  for (const f of currentFiles) {
    const cached = cache.files.find((cf) => cf.name === f.name);
    if (!cached || cached.modified !== f.modified) return true;
  }
  return false;
}

export function invalidateCache() {
  cache = null;
}
