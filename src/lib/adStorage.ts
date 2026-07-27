import type { AdDocument } from "./types";

const DB_NAME = "geradoranuncios";
const STORE = "ads";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const objectStore = db.createObjectStore(STORE, { keyPath: "id" });
        objectStore.createIndex("userId", "userId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB indisponível"));
  });
}

export async function idbListAds(userId: string): Promise<AdDocument[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const index = store.index("userId");
    const req = index.getAll(userId);
    req.onsuccess = () => {
      const rows = (req.result as AdDocument[]) || [];
      resolve(rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetAd(adId: string): Promise<AdDocument | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(adId);
    req.onsuccess = () => resolve((req.result as AdDocument) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSaveAd(ad: AdDocument): Promise<AdDocument> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(ad);
    tx.oncomplete = () => resolve(ad);
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbDeleteAd(adId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(adId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
