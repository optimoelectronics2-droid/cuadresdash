import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { getStore } from "@netlify/blobs";

const BLOB_STORE = "control-tienda-state";

let blobStore: any = null;

function getBlobStore(): any {
  if (blobStore) return blobStore;
  try {
    // Solo disponible en runtime Netlify (produccion); fuera de el lanza y caemos al fallback local
    blobStore = getStore({ name: BLOB_STORE });
    return blobStore;
  } catch {
    blobStore = null;
    return null;
  }
}

function localPath(key: string): string {
  return resolve("data", `${key}.json`);
}

function readLocal<T>(key: string): T | null {
  try {
    const p = localPath(key);
    if (!existsSync(p)) return null;
    return JSON.parse(readFileSync(p, "utf-8")) as T;
  } catch {
    return null;
  }
}

function writeLocal(key: string, data: unknown): void {
  try {
    const p = localPath(key);
    const dir = dirname(p);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(p, JSON.stringify(data), "utf-8");
  } catch {
    // filesystem de solo lectura (serverless): Netlify Blobs cubre el caso
  }
}

export async function readPersistent<T>(key: string): Promise<T | null> {
  const store = getBlobStore();
  if (store) {
    try {
      const raw = await store.get(key, { type: "text" });
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      // fallback a local
    }
  }
  return readLocal<T>(key);
}

export async function writePersistent(key: string, data: unknown): Promise<void> {
  const store = getBlobStore();
  if (store) {
    try {
      await store.set(key, JSON.stringify(data));
      return;
    } catch {
      // fallback a local
    }
  }
  writeLocal(key, data);
}

export async function deletePersistent(key: string): Promise<void> {
  const store = getBlobStore();
  if (store) {
    try {
      await store.delete(key);
    } catch {
      // ignorar
    }
  }
  try {
    const p = localPath(key);
    if (existsSync(p)) unlinkSync(p);
  } catch {
    // ignorar
  }
}
