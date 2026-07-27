"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdCanvas } from "@/components/ads/AdCanvas";
import { BrandSettings } from "@/components/ads/BrandSettings";
import { ExportActions } from "@/components/ads/ExportActions";
import { ItemForm, emptyItemDraft } from "@/components/ads/ItemForm";
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
  type AdEntry,
  type ContactInfo,
  type ItemEntry,
  type MixedLayout,
  type PokemonEntry,
  type PokemonTypeId,
  type StoreBrand,
  type TitleStyle,
} from "@/lib/types";

export default function MixedCreatePage() {
  const params = useSearchParams();
  const adId = params.get("id") || undefined;
  const canvasRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState<TitleStyle>({
    ...DEFAULT_TITLE_STYLE,
    text: "LOJA MISTA A VENDA !!!",
  });
  const [store, setStore] = useState<StoreBrand>(DEFAULT_STORE);
  const [contact, setContact] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_AD_BACKGROUND);
  const [layout, setLayout] = useState<MixedLayout>("grid");
  const [entries, setEntries] = useState<AdEntry[]>([]);
  const [addKind, setAddKind] = useState<"pokemon" | "item">("pokemon");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [pokeName, setPokeName] = useState("");
  const [pokeColor, setPokeColor] = useState(NAME_COLORS[0]);
  const [level, setLevel] = useState("");
  const [multiplier, setMultiplier] = useState("");
  const [type1, setType1] = useState<PokemonTypeId>("");
  const [type2, setType2] = useState<PokemonTypeId>("");
  const [rarity, setRarity] = useState("");
  const [price, setPrice] = useState("");
  const [iv, setIv] = useState("");
  const [ivMax, setIvMax] = useState("192");
  const [photo, setPhoto] = useState("");
  const [pokeSold, setPokeSold] = useState(false);
  const [itemDraft, setItemDraft] = useState(emptyItemDraft());

  useEffect(() => {
    if (!adId) return;
    void getAd(adId).then((ad) => {
      if (!ad || ad.type !== "mixed") return;
      setTitle(ad.title);
      setStore(ad.store);
      setContact(ad.contact);
      setBackgroundColor(ad.backgroundColor || DEFAULT_AD_BACKGROUND);
      setLayout(ad.layout === "cards" ? "cards" : "grid");
      setEntries(ad.entries);
    });
  }, [adId]);

  function clearPokemonForm(nextColorIndex = entries.length) {
    setPokeName("");
    setPhoto("");
    setPrice("");
    setLevel("");
    setMultiplier("");
    setIv("");
    setIvMax("192");
    setRarity("");
    setType1("");
    setType2("");
    setPokeSold(false);
    setPokeColor(NAME_COLORS[nextColorIndex % NAME_COLORS.length]);
  }

  function startEdit(entry: AdEntry) {
    setEditingId(entry.id);
    setAddKind(entry.kind);
    if (entry.kind === "pokemon") {
      setPokeName(entry.name);
      setPokeColor(entry.color);
      setLevel(entry.level);
      setMultiplier(entry.multiplier);
      setType1(entry.type1);
      setType2(entry.type2);
      setRarity(entry.rarity);
      setPrice(entry.price);
      setIv(entry.iv);
      setIvMax(entry.ivMax);
      setPhoto(entry.photo);
      setPokeSold(Boolean(entry.sold));
    } else {
      setItemDraft({
        name: entry.name,
        color: entry.color,
        price: entry.price,
        rarity: entry.rarity,
        notes: entry.notes,
        photo: entry.photo,
        sold: Boolean(entry.sold),
      });
    }
  }

  function cancelEdit() {
    setEditingId(null);
    clearPokemonForm(entries.length);
    setItemDraft(emptyItemDraft(entries.length));
  }

  function savePokemon() {
    if (!photo || !pokeName || !price) {
      alert("Informe pelo menos nome, foto e preço.");
      return;
    }
    const entry: PokemonEntry = {
      kind: "pokemon",
      id: editingId || crypto.randomUUID(),
      name: pokeName.trim(),
      color: pokeColor,
      level: level.trim() || "100",
      multiplier: multiplier.trim() || "1.00",
      type1: type1 || "normal",
      type2,
      rarity: rarity || "Comum",
      price: price.trim(),
      iv: iv.trim() || "0",
      ivMax: ivMax.trim() || "192",
      photo,
      sold: pokeSold,
    };
    setEntries((prev) => {
      if (editingId) return prev.map((x) => (x.id === editingId ? entry : x));
      return [...prev, entry];
    });
    setEditingId(null);
    clearPokemonForm(entries.length + (editingId ? 0 : 1));
  }

  function saveItem() {
    if (!itemDraft.photo || !itemDraft.name || !itemDraft.price) {
      alert("Preencha nome, foto e preço do item.");
      return;
    }
    const entry: ItemEntry = {
      kind: "item",
      id: editingId || crypto.randomUUID(),
      name: itemDraft.name.trim(),
      color: itemDraft.color,
      price: itemDraft.price.trim(),
      rarity: itemDraft.rarity,
      notes: itemDraft.notes.trim(),
      photo: itemDraft.photo,
      sold: itemDraft.sold,
    };
    setEntries((prev) => {
      if (editingId) return prev.map((x) => (x.id === editingId ? entry : x));
      return [...prev, entry];
    });
    setEditingId(null);
    setItemDraft(emptyItemDraft(entries.length + (editingId ? 0 : 1)));
  }

  function toggleSold(id: string, sold: boolean) {
    setEntries((prev) =>
      prev.map((x) => (x.id === id ? { ...x, sold } : x))
    );
    if (editingId === id) {
      setPokeSold(sold);
      setItemDraft((d) => ({ ...d, sold }));
    }
  }

  return (
    <div className="editor-layout">
      <aside className="panel">
        <header className="panel-header">
          <h1>Anúncio misto</h1>
          <p>Pokémon + itens, layout grid ou cards</p>
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
          <h2>Layout</h2>
          <div className="radio-row">
            <label className="check">
              <input
                type="radio"
                checked={layout === "grid"}
                onChange={() => setLayout("grid")}
              />
              Grid
            </label>
            <label className="check">
              <input
                type="radio"
                checked={layout === "cards"}
                onChange={() => setLayout("cards")}
              />
              Cards
            </label>
          </div>
        </section>

        <section className="card">
          <h2>
            {editingId
              ? addKind === "pokemon"
                ? "Editar Pokémon"
                : "Editar item"
              : "Adicionar"}
          </h2>
          <div className="radio-row">
            <label className="check">
              <input
                type="radio"
                checked={addKind === "pokemon"}
                disabled={Boolean(editingId)}
                onChange={() => setAddKind("pokemon")}
              />
              Pokémon
            </label>
            <label className="check">
              <input
                type="radio"
                checked={addKind === "item"}
                disabled={Boolean(editingId)}
                onChange={() => setAddKind("item")}
              />
              Item
            </label>
          </div>

          {addKind === "pokemon" ? (
            <div className="stack">
              <PokemonPicker
                name={pokeName}
                onNameChange={setPokeName}
                onSelect={(payload) => {
                  setPokeName(payload.name);
                  setPhoto(payload.photo);
                  setType1(payload.type1);
                  setType2(payload.type2);
                }}
              />
              <label className="photo-upload">
                <span>Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setPhoto(String(reader.result || ""));
                    reader.readAsDataURL(file);
                  }}
                />
                <div
                  className={`photo-preview ${photo ? "" : "empty"}`}
                  style={
                    photo ? { backgroundImage: `url("${photo}")` } : undefined
                  }
                >
                  {photo ? "" : "Foto"}
                </div>
              </label>
              <div className="grid-2">
                <label>
                  Cor
                  <input
                    type="color"
                    value={pokeColor}
                    onChange={(e) => setPokeColor(e.target.value)}
                  />
                </label>
                <label>
                  Preço
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </label>
              </div>
              <div className="grid-2">
                <label>
                  Level
                  <input
                    type="number"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  />
                </label>
                <label>
                  Multiplicador
                  <input
                    type="text"
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                  />
                </label>
              </div>
              <div className="grid-2">
                <label>
                  Tipo 1
                  <select
                    value={type1}
                    onChange={(e) => setType1(e.target.value as PokemonTypeId)}
                  >
                    {TYPES.map((t) => (
                      <option key={t.id || "n"} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Raridade
                  <select
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {RARITIES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid-2">
                <label>
                  IV
                  <input
                    type="number"
                    value={iv}
                    onChange={(e) => setIv(e.target.value)}
                  />
                </label>
                <label>
                  IV máx
                  <input
                    type="number"
                    value={ivMax}
                    onChange={(e) => setIvMax(e.target.value)}
                  />
                </label>
              </div>
              <label className="check">
                <input
                  type="checkbox"
                  checked={pokeSold}
                  onChange={(e) => setPokeSold(e.target.checked)}
                />
                Item vendido
              </label>
              <div className="actions">
                <button type="button" className="btn primary" onClick={savePokemon}>
                  {editingId ? "Salvar alterações" : "Adicionar Pokémon"}
                </button>
                {editingId ? (
                  <button type="button" className="btn ghost" onClick={cancelEdit}>
                    Cancelar
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="stack">
              <ItemForm draft={itemDraft} onChange={setItemDraft} />
              <div className="actions">
                <button type="button" className="btn primary" onClick={saveItem}>
                  {editingId ? "Salvar alterações" : "Adicionar item"}
                </button>
                {editingId ? (
                  <button type="button" className="btn ghost" onClick={cancelEdit}>
                    Cancelar
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <h2>Lista ({entries.length})</h2>
          <ul className="pokemon-list">
            {entries.map((e) => (
              <li key={e.id} className={e.sold ? "list-sold" : undefined}>
                <img src={e.photo} alt={e.name} />
                <div className="meta">
                  <strong style={{ color: e.color }}>
                    {e.name}{" "}
                    <small className="muted">
                      ({e.kind === "pokemon" ? "Pokémon" : "Item"})
                      {e.sold ? " · Vendido" : ""}
                    </small>
                  </strong>
                  <span>
                    {e.kind === "pokemon"
                      ? `Lv.${e.level} · x${e.multiplier} · IV ${e.iv}/${e.ivMax} · R$ ${e.price}`
                      : `${e.notes ? `${e.notes} · ` : ""}${e.rarity || "Item"} · R$ ${e.price}`}
                  </span>
                </div>
                <div className="row-actions">
                  <label className="check sold-check" title="Vendido">
                    <input
                      type="checkbox"
                      checked={Boolean(e.sold)}
                      onChange={(ev) => toggleSold(e.id, ev.target.checked)}
                    />
                  </label>
                  <button type="button" title="Editar" onClick={() => startEdit(e)}>
                    ✎
                  </button>
                  <button
                    type="button"
                    title="Excluir"
                    onClick={() => {
                      setEntries((prev) => prev.filter((x) => x.id !== e.id));
                      if (editingId === e.id) cancelEdit();
                    }}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <ExportActions
          canvasRef={canvasRef}
          type="mixed"
          title={title}
          store={store}
          contact={contact}
          backgroundColor={backgroundColor}
          layout={layout}
          entries={entries}
          adId={adId}
        />
      </aside>

      <main className="preview-wrap">
        <div className="preview-toolbar">
          <h2>Prévia ({layout})</h2>
        </div>
        <div className="preview-stage">
          <AdCanvas
            ref={canvasRef}
            title={title}
            store={store}
            contact={contact}
            backgroundColor={backgroundColor}
            entries={entries}
            layout={layout}
            variant="mixed"
          />
        </div>
      </main>
    </div>
  );
}
