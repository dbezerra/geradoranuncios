"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  adTypeLabel,
  deleteAd,
  listLocalAds,
  pullAdsFromCloud,
  pushPendingAds,
  syncBadge,
  testFirestoreWrite,
} from "@/lib/ads";
import type { AdDocument } from "@/lib/types";

export default function MyAdsPage() {
  const { effectiveUserId, loading, user } = useAuth();
  const [ads, setAds] = useState<AdDocument[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const params = useSearchParams();
  const highlight = params.get("highlight");

  const loadLocalFirst = useCallback(async () => {
    if (!effectiveUserId) {
      setAds([]);
      return;
    }
    setError("");
    const local = await listLocalAds(effectiveUserId);
    setAds(local);
  }, [effectiveUserId]);

  const pullCloud = useCallback(async () => {
    if (!effectiveUserId) return;
    try {
      const merged = await pullAdsFromCloud(effectiveUserId);
      setAds(merged);
    } catch (err) {
      console.error(err);
    }
  }, [effectiveUserId]);

  const syncAll = useCallback(async () => {
    if (!effectiveUserId) return;
    setRefreshing(true);
    setError("");
    try {
      const ping = await testFirestoreWrite(effectiveUserId);
      if (!ping.ok) {
        setError(ping.error || "Falha no Firestore");
        alert(ping.error || "Falha no Firestore");
        setAds(await listLocalAds(effectiveUserId));
        return;
      }

      await pullAdsFromCloud(effectiveUserId);
      const { ads: pushed, errors, okCount } = await pushPendingAds(
        effectiveUserId
      );
      setAds(pushed);

      if (errors.length) {
        setError(errors.join("\n"));
        alert(`Sincronização parcial.\n\n${errors[0]}`);
      } else if (okCount > 0) {
        alert(`${okCount} anúncio(s) sincronizado(s) com sucesso!`);
      } else {
        alert("Nada pendente para sincronizar (ou já estava sincronizado).");
        // força re-sync de todos os que ainda estão error/pending visualmente
        const stillBad = pushed.filter(
          (a) => a.syncStatus === "error" || a.syncStatus === "pending"
        );
        if (stillBad.length) {
          const again = await pushPendingAds(effectiveUserId);
          setAds(again.ads);
          if (again.errors.length) {
            setError(again.errors.join("\n"));
            alert(again.errors[0]);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao sincronizar.";
      setError(message);
      alert(message);
    } finally {
      setRefreshing(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    if (loading) return;
    void (async () => {
      await loadLocalFirst();
      await pullCloud();
    })();
  }, [loading, loadLocalFirst, pullCloud]);

  useEffect(() => {
    if (!effectiveUserId) return;
    const timer = window.setInterval(() => {
      void listLocalAds(effectiveUserId).then(setAds);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [effectiveUserId]);

  return (
    <main className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h1>Meus anúncios</h1>
          <p className="muted">
            Logado como {user?.email || "—"}. Salva local na hora; use
            Sincronizar se ficar pendente.
          </p>
        </div>
        <button
          type="button"
          className="btn primary"
          disabled={refreshing}
          onClick={() => void syncAll()}
        >
          {refreshing ? "Sincronizando..." : "Sincronizar agora"}
        </button>
      </div>

      {error && (
        <pre
          className="card"
          style={{
            whiteSpace: "pre-wrap",
            color: "#ffb4b4",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </pre>
      )}

      {ads.length === 0 ? (
        <div className="card">
          <p>Nenhum anúncio salvo ainda.</p>
          <Link href="/criar/multi" className="btn success">
            Criar agora
          </Link>
        </div>
      ) : (
        <div className="ads-list">
          {ads.map((ad) => {
            const badge = syncBadge(ad);
            return (
              <article
                key={ad.id}
                className={`ad-list-item ${highlight === ad.id ? "highlight" : ""}`}
              >
                {ad.previewUrl ? (
                  <img src={ad.previewUrl} alt={ad.title.text} />
                ) : (
                  <div
                    style={{
                      width: 96,
                      height: 72,
                      background: "#000",
                      borderRadius: 8,
                    }}
                  />
                )}
                <div>
                  <div className="ad-title-row">
                    <span className={badge.className}>{badge.label}</span>
                    <strong>{ad.title.text}</strong>
                  </div>
                  <div className="muted small">
                    {adTypeLabel(ad.type)} · {ad.entries.length} item(ns) ·{" "}
                    {new Date(ad.updatedAt).toLocaleString("pt-BR")}
                  </div>
                  {ad.lastSyncError ? (
                    <div className="muted small" style={{ color: "#ff8f8f" }}>
                      {ad.lastSyncError}
                    </div>
                  ) : null}
                </div>
                <div className="actions">
                  <Link
                    className="btn primary"
                    href={
                      ad.type === "multi"
                        ? `/criar/multi?id=${ad.id}`
                        : ad.type === "individual"
                          ? `/criar/individual?id=${ad.id}`
                          : `/criar/misto?id=${ad.id}`
                    }
                  >
                    Abrir
                  </Link>
                  {ad.previewUrl && (
                    <a className="btn success" href={ad.previewUrl} download>
                      Baixar
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn danger"
                    onClick={async () => {
                      if (!effectiveUserId) return;
                      if (!confirm("Excluir este anúncio?")) return;
                      await deleteAd(ad.id, effectiveUserId);
                      setAds((prev) => prev.filter((a) => a.id !== ad.id));
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
