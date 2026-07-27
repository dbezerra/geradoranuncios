"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdCanvas } from "@/components/ads/AdCanvas";
import { BrandSettings } from "@/components/ads/BrandSettings";
import { ExportActions } from "@/components/ads/ExportActions";
import { PokemonPicker } from "@/components/ads/PokemonPicker";
import { TYPES } from "@/lib/constants";
import { getAd } from "@/lib/ads";
import {
  DEFAULT_AD_BACKGROUND,
  DEFAULT_CONTACT,
  DEFAULT_STORE,
  DEFAULT_TITLE_STYLE,
  NAME_COLORS,
  RARITIES,
  type ContactInfo,
  type PokemonEntry,
  type PokemonTypeId,
  type StoreBrand,
  type TitleStyle,
} from "@/lib/types";

type Draft = {
  name: string;
  color: string;
  level: string;
  multiplier: string;
  type1: PokemonTypeId;
  type2: PokemonTypeId;
  rarity: string;
  price: string;
  iv: string;
  ivMax: string;
  photo: string;
  sold: boolean;
};

const emptyDraft = (index = 0): Draft => ({
  name: "",
  color: NAME_COLORS[index % NAME_COLORS.length],
  level: "",
  multiplier: "",
  type1: "",
  type2: "",
  rarity: "",
  price: "",
  iv: "",
  ivMax: "192",
  photo: "",
  sold: false,
});

export default function MultiCreatePage() {
  const params = useSearchParams();
  const adId = params.get("id") || undefined;
  const canvasRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState<TitleStyle>(DEFAULT_TITLE_STYLE);
  const [store, setStore] = useState<StoreBrand>(DEFAULT_STORE);
  const [contact, setContact] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_AD_BACKGROUND);
  const [entries, setEntries] = useState<PokemonEntry[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!adId) return;
    void getAd(adId).then((ad) => {
      if (!ad || ad.type !== "multi") return;
      setTitle(ad.title);
      setStore(ad.store);
      setContact(ad.contact);
      setBackgroundColor(ad.backgroundColor || DEFAULT_AD_BACKGROUND);
      setEntries(ad.entries.filter((e): e is PokemonEntry => e.kind === "pokemon"));
    });
  }, [adId]);

  const listCount = useMemo(() => entries.length, [entries]);

  function validate(d: Draft) {
    if (!d.photo) return "Escolha um Pokémon (foto) ou envie uma imagem.";
    if (!d.name) return "Informe o nome do Pokémon.";
    if (!d.level) return "Informe o level.";
    if (!d.multiplier) return "Informe o multiplicador.";
    if (!d.type1) return "Selecione pelo menos o Tipo 1.";
    if (!d.rarity) return "Selecione a raridade.";
    if (!d.price) return "Informe o preço.";
    if (!d.iv) return "Informe o IV.";
    return "";
  }

  function addOrUpdate() {
    const error = validate(draft);
    if (error) {
      alert(error);
      return;
    }
    const entry: PokemonEntry = {
      kind: "pokemon",
      id: editingId || crypto.randomUUID(),
      name: draft.name.trim(),
      color: draft.color,
      level: draft.level.trim(),
      multiplier: draft.multiplier.trim(),
      type1: draft.type1,
      type2: draft.type2,
      rarity: draft.rarity,
      price: draft.price.trim(),
      iv: draft.iv.trim(),
      ivMax: draft.ivMax.trim() || "192",
      photo: draft.photo,
      sold: draft.sold,
    };
    setEntries((prev) => {
      if (editingId) return prev.map((p) => (p.id === editingId ? entry : p));
      return [...prev, entry];
    });
    setEditingId(null);
    setDraft(emptyDraft(entries.length + 1));
  }

  return (
    <div className="editor-layout">
      <aside className="panel">
        <header className="panel-header">
          <h1>Múltiplos Pokémon</h1>
          <p>Monte a lista e exporte para o WhatsApp</p>
        </header>

        <BrandSettings
          title={title}
          store={store}
          contact={contact}
          backgroundColor={backgroundColor}
          onTitleChange={setTitle}
          onStoreChange={setStore}
          onContactChange={setContact}
          onBackgroundColorChange={setBackgroundColor}
        />

        <section className="card">
          <h2>{editingId ? "Editar Pokémon" : "Adicionar Pokémon"}</h2>
          <PokemonPicker
            name={draft.name}
            onNameChange={(name) => setDraft((d) => ({ ...d, name }))}
            onSelect={(payload) =>
              setDraft((d) => ({
                ...d,
                ...payload,
                photo: payload.photo || d.photo,
              }))
            }
          />

          <label className="photo-upload">
            <span>
              Foto do Pokémon <small>(automática — clique para trocar)</small>
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () =>
                  setDraft((d) => ({
                    ...d,
                    photo: String(reader.result || ""),
                  }));
                reader.readAsDataURL(file);
              }}
            />
            <div
              className={`photo-preview ${draft.photo ? "" : "empty"}`}
              style={
                draft.photo
                  ? { backgroundImage: `url("${draft.photo}")` }
                  : undefined
              }
            >
              {draft.photo ? "" : "Escolha um Pokémon ou envie uma foto"}
            </div>
          </label>

          <label>
            Cor do nome
            <input
              type="color"
              value={draft.color}
              onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
            />
          </label>

          <div className="grid-2">
            <label>
              Level
              <input
                type="number"
                min={1}
                max={100}
                value={draft.level}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, level: e.target.value }))
                }
              />
            </label>
            <label>
              Multiplicador
              <input
                type="text"
                placeholder="Ex: 1.95"
                value={draft.multiplier}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, multiplier: e.target.value }))
                }
              />
            </label>
          </div>

          <div className="grid-2">
            <label>
              Tipo 1
              <select
                value={draft.type1}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    type1: e.target.value as PokemonTypeId,
                  }))
                }
              >
                {TYPES.map((t) => (
                  <option key={t.id || "none"} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo 2
              <select
                value={draft.type2}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    type2: e.target.value as PokemonTypeId,
                  }))
                }
              >
                {TYPES.map((t) => (
                  <option key={`t2-${t.id || "none"}`} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid-2">
            <label>
              Raridade
              <select
                value={draft.rarity}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, rarity: e.target.value }))
                }
              >
                <option value="">Selecione</option>
                {RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preço (R$)
              <input
                type="text"
                value={draft.price}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, price: e.target.value }))
                }
              />
            </label>
          </div>

          <div className="grid-2">
            <label>
              IV
              <input
                type="number"
                min={0}
                value={draft.iv}
                onChange={(e) => setDraft((d) => ({ ...d, iv: e.target.value }))}
              />
            </label>
            <label>
              IV máximo
              <input
                type="number"
                min={0}
                value={draft.ivMax}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, ivMax: e.target.value }))
                }
              />
            </label>
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={draft.sold}
              onChange={(e) =>
                setDraft((d) => ({ ...d, sold: e.target.checked }))
              }
            />
            Item vendido
          </label>

          <div className="actions">
            <button type="button" className="btn primary" onClick={addOrUpdate}>
              {editingId ? "Salvar alterações" : "Adicionar à lista"}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setEditingId(null);
                setDraft(emptyDraft(entries.length));
              }}
            >
              Limpar
            </button>
          </div>
        </section>

        <section className="card">
          <h2>Lista ({listCount})</h2>
          <ul className="pokemon-list">
            {entries.map((p, index) => (
              <li key={p.id}>
                <img src={p.photo} alt={p.name} />
                <div className="meta">
                  <strong style={{ color: p.color }}>
                    {p.name}
                    {p.sold ? (
                      <small className="muted"> · Vendido</small>
                    ) : null}
                  </strong>
                  <span>
                    Lv.{p.level} · {p.multiplier} · R$ {p.price} · IV {p.iv}/
                    {p.ivMax}
                  </span>
                </div>
                <div className="row-actions">
                  <label className="check sold-check" title="Vendido">
                    <input
                      type="checkbox"
                      checked={Boolean(p.sold)}
                      onChange={(e) => {
                        const sold = e.target.checked;
                        setEntries((prev) =>
                          prev.map((x) => (x.id === p.id ? { ...x, sold } : x))
                        );
                        if (editingId === p.id) {
                          setDraft((d) => ({ ...d, sold }));
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() =>
                      setEntries((prev) => {
                        const next = [...prev];
                        [next[index - 1], next[index]] = [
                          next[index],
                          next[index - 1],
                        ];
                        return next;
                      })
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === entries.length - 1}
                    onClick={() =>
                      setEntries((prev) => {
                        const next = [...prev];
                        [next[index + 1], next[index]] = [
                          next[index],
                          next[index + 1],
                        ];
                        return next;
                      })
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(p.id);
                      setDraft({
                        name: p.name,
                        color: p.color,
                        level: p.level,
                        multiplier: p.multiplier,
                        type1: p.type1,
                        type2: p.type2,
                        rarity: p.rarity,
                        price: p.price,
                        iv: p.iv,
                        ivMax: p.ivMax,
                        photo: p.photo,
                        sold: Boolean(p.sold),
                      });
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEntries((prev) => prev.filter((x) => x.id !== p.id))
                    }
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn danger"
            disabled={!entries.length}
            onClick={() => {
              if (confirm("Remover todos?")) setEntries([]);
            }}
          >
            Limpar lista
          </button>
        </section>

        <ExportActions
          canvasRef={canvasRef}
          type="multi"
          title={title}
          store={store}
          contact={contact}
          backgroundColor={backgroundColor}
          layout="list"
          entries={entries}
          adId={adId}
        />
      </aside>

      <main className="preview-wrap">
        <div className="preview-toolbar">
          <h2>Prévia do anúncio</h2>
          <span className="hint">Arquivo compacto para WhatsApp</span>
        </div>
        <div className="preview-stage">
          <AdCanvas
            ref={canvasRef}
            title={title}
            store={store}
            contact={contact}
            backgroundColor={backgroundColor}
            entries={entries}
            layout="list"
            variant="multi"
          />
        </div>
      </main>
    </div>
  );
}
