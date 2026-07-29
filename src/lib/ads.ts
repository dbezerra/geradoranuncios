import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import type { AdDocument, AdEntry, AdType, ItemEntry, PokemonEntry } from "./types";
import {
  explainFirestoreError,
  getFirebaseDb,
  isFirebaseConfigured,
  requireAuthUser,
} from "./firebase";
import { CLOUD_SYNC_ENABLED } from "./authFlags";
import {
  idbDeleteAd,
  idbGetAd,
  idbListAds,
  idbSaveAd,
} from "./adStorage";

const META_KEY = "pokelist-ads-meta";

type AdMeta = {
  id: string;
  userId: string;
  title: string;
  type: AdType;
  updatedAt: number;
  syncStatus: NonNullable<AdDocument["syncStatus"]>;
  syncedAt?: number;
};

function normalizeSyncStatus(
  status: AdDocument["syncStatus"]
): NonNullable<AdDocument["syncStatus"]> {
  if (status === "pending" || status === "error" || status === "synced") {
    return status;
  }
  return "synced";
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[key] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

function writeMetaForUser(userId: string, ads: AdDocument[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(META_KEY);
    const others = (raw ? (JSON.parse(raw) as AdMeta[]) : []).filter(
      (m) => m.userId !== userId
    );
    const mine: AdMeta[] = ads.map((ad) => ({
      id: ad.id,
      userId: ad.userId,
      title: ad.title.text,
      type: ad.type,
      updatedAt: ad.updatedAt,
      syncStatus: normalizeSyncStatus(ad.syncStatus),
      syncedAt: ad.syncedAt,
    }));
    localStorage.setItem(META_KEY, JSON.stringify([...others, ...mine]));
  } catch (err) {
    console.warn("Falha ao gravar meta no localStorage:", err);
  }
}

function upsertMeta(ad: AdDocument) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(META_KEY);
    const all = raw ? (JSON.parse(raw) as AdMeta[]) : [];
    const next = all.filter((m) => m.id !== ad.id);
    next.push({
      id: ad.id,
      userId: ad.userId,
      title: ad.title.text,
      type: ad.type,
      updatedAt: ad.updatedAt,
      syncStatus: normalizeSyncStatus(ad.syncStatus),
      syncedAt: ad.syncedAt,
    });
    localStorage.setItem(META_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn("Falha ao atualizar meta no localStorage:", err);
  }
}

function entryForCloud(entry: AdEntry) {
  if (entry.kind === "pokemon") {
    const e = entry as PokemonEntry;
    return {
      kind: "pokemon" as const,
      id: String(e.id),
      name: String(e.name || ""),
      color: String(e.color || "#ffffff"),
      level: String(e.level ?? ""),
      multiplier: String(e.multiplier ?? ""),
      type1: String(e.type1 || ""),
      type2: String(e.type2 || ""),
      rarity: String(e.rarity || ""),
      price: String(e.price ?? ""),
      iv: String(e.iv ?? ""),
      ivMax: String(e.ivMax ?? ""),
      photo: "",
      sold: Boolean(e.sold),
    };
  }
  const e = entry as ItemEntry;
  return {
    kind: "item" as const,
    id: String(e.id),
    name: String(e.name || ""),
    color: String(e.color || "#ffffff"),
    price: String(e.price ?? ""),
    rarity: String(e.rarity || ""),
    notes: String(e.notes || ""),
    photo: "",
    sold: Boolean(e.sold),
  };
}

/** Documento leve e seguro para o Firestore */
function cloudPayload(ad: AdDocument, authUid: string) {
  return stripUndefined({
    userId: authUid,
    type: ad.type,
    title: {
      text: String(ad.title?.text || ""),
      color: String(ad.title?.color || "#39ff14"),
      size: Number(ad.title?.size) || 34,
      font: String(ad.title?.font || "Arial, Helvetica, sans-serif"),
    },
    store: {
      mode: ad.store?.mode === "image" ? "image" : "text",
      name: String(ad.store?.name || ""),
      color: String(ad.store?.color || "#ffcb05"),
      size: Number(ad.store?.size) || 28,
      font: String(ad.store?.font || "Arial, Helvetica, sans-serif"),
      imageDataUrl: "",
    },
    contact: {
      whatsapp: String(ad.contact?.whatsapp || ""),
      discord: String(ad.contact?.discord || ""),
      showPix: Boolean(ad.contact?.showPix),
    },
    backgroundColor: String(ad.backgroundColor || "#000000"),
    layout: ad.layout || "list",
    entries: (ad.entries || []).map(entryForCloud),
    previewUrl: "",
    createdAt: Number(ad.createdAt) || Date.now(),
    updatedAt: Number(ad.updatedAt) || Date.now(),
    syncStatus: "synced",
    syncedAt: Date.now(),
  });
}

export async function testFirestoreWrite(userId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const user = await requireAuthUser();
    if (user.uid !== userId) {
      return { ok: false, error: "UID do login diferente do usuário da sessão." };
    }
    const db = getFirebaseDb();
    if (!db) return { ok: false, error: "Firestore não inicializado." };

    const ref = doc(db, "users", user.uid);
    await setDoc(
      ref,
      {
        ping: true,
        at: Date.now(),
        serverAt: serverTimestamp(),
        email: user.email || "",
      },
      { merge: true }
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: explainFirestoreError(err) };
  }
}

export async function syncAdToCloud(
  ad: AdDocument
): Promise<{ ok: boolean; error?: string }> {
  if (!isFirebaseConfigured()) {
    return { ok: false, error: "Firebase não configurado no .env.local" };
  }

  try {
    const user = await requireAuthUser();
    const db = getFirebaseDb();
    if (!db) return { ok: false, error: "Firestore não inicializado." };

    // Garante que o anúncio local fica sob o UID logado
    const uid = user.uid;
    const payload = {
      ...cloudPayload({ ...ad, userId: uid }, uid),
      serverUpdatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "ads", ad.id), payload, { merge: true });

    // Confirma leitura
    const snap = await getDoc(doc(db, "ads", ad.id));
    if (!snap.exists()) {
      throw new Error("Escrita não confirmada no Firestore.");
    }

    const synced: AdDocument = {
      ...ad,
      userId: uid,
      syncStatus: "synced",
      syncedAt: Date.now(),
      lastSyncError: "",
    };
    await idbSaveAd(synced);
    upsertMeta(synced);
    return { ok: true };
  } catch (err) {
    const message = explainFirestoreError(err);
    console.error("Firestore sync error:", err);
    const failed: AdDocument = {
      ...ad,
      syncStatus: "error",
      lastSyncError: message,
    };
    await idbSaveAd(failed);
    upsertMeta(failed);
    return { ok: false, error: message };
  }
}

export async function listLocalAds(userId: string): Promise<AdDocument[]> {
  const local = await idbListAds(userId);
  const normalized = local.map((ad) => ({
    ...ad,
    syncStatus: normalizeSyncStatus(ad.syncStatus),
  }));
  writeMetaForUser(userId, normalized);
  return normalized.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function pullAdsFromCloud(userId: string): Promise<AdDocument[]> {
  const map = new Map<string, AdDocument>();
  const local = await idbListAds(userId);
  local.forEach((ad) =>
    map.set(ad.id, { ...ad, syncStatus: normalizeSyncStatus(ad.syncStatus) })
  );

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await requireAuthUser();
      const q = query(collection(db, "ads"), where("userId", "==", userId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const data = d.data() as Omit<AdDocument, "id">;
        const cloud: AdDocument = {
          id: d.id,
          ...data,
          syncStatus: "synced",
          lastSyncError: "",
        };
        const existing = map.get(cloud.id);

        if (!existing) {
          map.set(cloud.id, cloud);
          await idbSaveAd(cloud);
          continue;
        }

        const localPending =
          existing.syncStatus === "pending" || existing.syncStatus === "error";
        if (!localPending && (cloud.updatedAt || 0) > (existing.updatedAt || 0)) {
          const merged: AdDocument = {
            ...cloud,
            entries: existing.entries?.length ? existing.entries : cloud.entries,
            store: existing.store,
            previewUrl: existing.previewUrl || cloud.previewUrl || "",
            syncStatus: "synced",
            syncedAt: Date.now(),
            lastSyncError: "",
          };
          map.set(cloud.id, merged);
          await idbSaveAd(merged);
        }
      }
    } catch (err) {
      console.warn("Falha ao puxar da nuvem:", err);
    }
  }

  const result = [...map.values()].sort(
    (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
  );
  writeMetaForUser(userId, result);
  return result;
}

export async function pushPendingAds(
  userId: string
): Promise<{ ads: AdDocument[]; errors: string[]; okCount: number }> {
  const local = await idbListAds(userId);
  const errors: string[] = [];
  let okCount = 0;

  // Ping primeiro — se falhar, nem tenta os anúncios
  const ping = await testFirestoreWrite(userId);
  if (!ping.ok) {
    return {
      ads: await listLocalAds(userId),
      errors: [ping.error || "Falha no teste do Firestore"],
      okCount: 0,
    };
  }

  for (const ad of local) {
    const status = normalizeSyncStatus(ad.syncStatus);
    if (status !== "pending" && status !== "error") continue;
    const result = await syncAdToCloud({ ...ad, userId });
    if (result.ok) okCount += 1;
    else errors.push(`${ad.title.text}: ${result.error || "erro"}`);
  }

  return { ads: await listLocalAds(userId), errors, okCount };
}

export async function refreshAdsFromCloud(userId: string): Promise<AdDocument[]> {
  await pullAdsFromCloud(userId);
  const { ads } = await pushPendingAds(userId);
  return ads;
}

export async function listAds(userId: string): Promise<AdDocument[]> {
  return pullAdsFromCloud(userId);
}

export async function getAd(adId: string): Promise<AdDocument | null> {
  const local = await idbGetAd(adId);
  if (local) {
    return { ...local, syncStatus: normalizeSyncStatus(local.syncStatus) };
  }

  const db = getFirebaseDb();
  if (!db || !isFirebaseConfigured()) return null;
  try {
    await requireAuthUser();
    const snap = await getDoc(doc(db, "ads", adId));
    if (!snap.exists()) return null;
    const ad: AdDocument = {
      id: snap.id,
      ...(snap.data() as Omit<AdDocument, "id">),
      syncStatus: "synced",
      lastSyncError: "",
    };
    await idbSaveAd(ad);
    upsertMeta(ad);
    return ad;
  } catch {
    return null;
  }
}

export async function saveAd(
  userId: string,
  payload: Omit<
    AdDocument,
    | "id"
    | "userId"
    | "createdAt"
    | "updatedAt"
    | "syncStatus"
    | "syncedAt"
    | "lastSyncError"
  > & {
    id?: string;
  },
  previewDataUrl?: string,
  onProgress?: (step: string) => void
): Promise<AdDocument> {
  const now = Date.now();
  const adId = payload.id || crypto.randomUUID();
  const existing = payload.id ? await idbGetAd(payload.id) : null;

  onProgress?.("Salvando no aparelho...");

  let authUid = userId;
  if (CLOUD_SYNC_ENABLED) {
    try {
      const user = await requireAuthUser();
      authUid = user.uid;
    } catch {
      // mantém userId recebido
    }
  }

  const localAd: AdDocument = {
    id: adId,
    userId: authUid,
    type: payload.type,
    title: payload.title,
    store: payload.store,
    contact: payload.contact,
    backgroundColor: payload.backgroundColor || "#000000",
    layout: payload.layout,
    entries: payload.entries,
    previewUrl: previewDataUrl || payload.previewUrl || "",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    syncStatus: "pending",
    lastSyncError: "",
  };

  await idbSaveAd(localAd);
  upsertMeta(localAd);

  if (CLOUD_SYNC_ENABLED && isFirebaseConfigured() && getFirebaseDb()) {
    onProgress?.("Enviando para a nuvem...");
    const result = await syncAdToCloud(localAd);
    if (result.ok) {
      onProgress?.("Sincronizado");
      const fresh = await idbGetAd(localAd.id);
      return fresh || { ...localAd, syncStatus: "synced", syncedAt: Date.now() };
    }
    onProgress?.("Salvo local (nuvem pendente)");
    const failed = await idbGetAd(localAd.id);
    return failed || { ...localAd, syncStatus: "error", lastSyncError: result.error };
  }

  const onlyLocal: AdDocument = {
    ...localAd,
    syncStatus: "synced",
    syncedAt: now,
  };
  await idbSaveAd(onlyLocal);
  upsertMeta(onlyLocal);
  onProgress?.("Salvo");
  return onlyLocal;
}

export async function deleteAd(adId: string, userId: string) {
  await idbDeleteAd(adId);
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(META_KEY);
      const all = raw ? (JSON.parse(raw) as AdMeta[]) : [];
      localStorage.setItem(
        META_KEY,
        JSON.stringify(all.filter((m) => m.id !== adId))
      );
    } catch {
      // ignore
    }
  }
  const db = getFirebaseDb();
  if (!db || !isFirebaseConfigured()) return;
  try {
    await requireAuthUser();
    const snap = await getDoc(doc(db, "ads", adId));
    if (snap.exists() && snap.data().userId === userId) {
      await deleteDoc(doc(db, "ads", adId));
    }
  } catch (err) {
    console.warn("Delete cloud falhou:", err);
  }
}

export function adTypeLabel(type: AdType) {
  if (type === "multi") return "Múltiplos Pokémon";
  if (type === "individual") return "Individual";
  return "Misto";
}

export function syncBadge(ad: AdDocument) {
  const status = normalizeSyncStatus(ad.syncStatus);
  if (status === "synced") {
    return { label: "Sincronizado", className: "sync-badge synced" };
  }
  if (status === "error") {
    return { label: "Pend. nuvem", className: "sync-badge error" };
  }
  return { label: "Local", className: "sync-badge pending" };
}
