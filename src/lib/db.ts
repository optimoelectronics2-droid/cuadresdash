import { openDB, type IDBPDatabase } from "idb";
import type { DashboardData } from "./types";

const DB_NAME = "control-tienda-cache";
const DB_VERSION = 1;
const STORE_NAME = "dashboard";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheDashboardData(data: DashboardData): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORE_NAME, {
      id: "latest",
      data,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn("Error caching data:", err);
  }
}

export async function getCachedDashboardData(): Promise<{
  data: DashboardData;
  timestamp: number;
} | null> {
  try {
    const db = await getDb();
    const result = await db.get(STORE_NAME, "latest");
    return result || null;
  } catch {
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const db = await getDb();
    await db.clear(STORE_NAME);
  } catch (err) {
    console.warn("Error clearing cache:", err);
  }
}

export async function getCacheTimestamp(): Promise<number | null> {
  try {
    const db = await getDb();
    const result = await db.get(STORE_NAME, "latest");
    return result?.timestamp || null;
  } catch {
    return null;
  }
}
