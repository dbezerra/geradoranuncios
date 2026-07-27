"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { saveAd } from "@/lib/ads";
import { canvasToJpeg, downloadDataUrl, shareWhatsApp } from "@/lib/export";
import {
  DEFAULT_AD_BACKGROUND,
  type AdEntry,
  type AdType,
  type ContactInfo,
  type MixedLayout,
  type StoreBrand,
  type TitleStyle,
} from "@/lib/types";

type Props = {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  type: AdType;
  title: TitleStyle;
  store: StoreBrand;
  contact: ContactInfo;
  backgroundColor?: string;
  layout: "list" | MixedLayout;
  entries: AdEntry[];
  adId?: string;
  disabled?: boolean;
};

export function ExportActions({
  canvasRef,
  type,
  title,
  store,
  contact,
  backgroundColor = DEFAULT_AD_BACKGROUND,
  layout,
  entries,
  adId,
  disabled,
}: Props) {
  const { effectiveUserId, configured, user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [alsoSave, setAlsoSave] = useState(true);

  function requireUserId() {
    const uid = user?.uid || effectiveUserId;
    if (uid) return uid;
    if (configured) {
      alert("Entre com Google antes de salvar.");
      router.push("/login");
      return null;
    }
    alert("Não foi possível identificar o usuário.");
    return null;
  }

  async function persistFast(dataUrl: string) {
    const uid = requireUserId();
    if (!uid) return null;
    // Salva local na hora; sync nuvem roda em background dentro de saveAd
    return saveAd(
      uid,
      {
        id: adId,
        type,
        title,
        store,
        contact,
        backgroundColor: backgroundColor || DEFAULT_AD_BACKGROUND,
        layout,
        entries,
      },
      dataUrl,
      setStatus
    );
  }

  const exportBg = backgroundColor || DEFAULT_AD_BACKGROUND;

  async function run(task: () => Promise<void>) {
    if (!canvasRef.current || !entries.length) {
      alert("Adicione pelo menos 1 item antes de salvar.");
      return;
    }
    setBusy(true);
    setStatus("Gerando imagem...");
    try {
      await task();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Falha ao exportar/salvar.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  return (
    <div className="card">
      <h2>Exportar</h2>
      {configured && !user && (
        <p className="muted small">
          Faça login para salvar.{" "}
          <button
            type="button"
            className="btn ghost"
            onClick={() => router.push("/login")}
          >
            Entrar com Google
          </button>
        </p>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={alsoSave}
          onChange={(e) => setAlsoSave(e.target.checked)}
        />
        Salvar anúncio para baixar depois
      </label>
      {status && <p className="muted small">{status}</p>}
      <div className="actions">
        <button
          type="button"
          className="btn success"
          disabled={disabled || busy || !entries.length}
          onClick={() =>
            run(async () => {
              const dataUrl = await canvasToJpeg(
                canvasRef.current!,
                720,
                0.82,
                exportBg
              );
              downloadDataUrl(dataUrl, `anuncio-${type}-${Date.now()}.jpg`);
              if (alsoSave) {
                const saved = await persistFast(dataUrl);
                if (saved) router.push(`/anuncios?highlight=${saved.id}`);
              }
            })
          }
        >
          {busy ? status || "Processando..." : "Baixar anúncio (JPG)"}
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={disabled || busy || !entries.length}
          onClick={() =>
            run(async () => {
              const dataUrl = await canvasToJpeg(
                canvasRef.current!,
                720,
                0.82,
                exportBg
              );
              const text = `${title.text}\n${entries
                .map((e) => `${e.name} — R$ ${e.price}`)
                .join("\n")}\nWhatsApp: ${contact.whatsapp || ""}`;
              await shareWhatsApp(dataUrl, text);
              if (alsoSave) await persistFast(dataUrl);
            })
          }
        >
          Compartilhar WhatsApp
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={disabled || busy || !entries.length}
          onClick={() =>
            run(async () => {
              const dataUrl = await canvasToJpeg(
                canvasRef.current!,
                720,
                0.82,
                exportBg
              );
              const saved = await persistFast(dataUrl);
              if (saved) {
                router.push(`/anuncios?highlight=${saved.id}`);
              }
            })
          }
        >
          {busy ? status || "Salvando..." : "Só salvar"}
        </button>
      </div>
    </div>
  );
}
