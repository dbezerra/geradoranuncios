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
  type PokemonEntry,
  type PokemonTypeId,
  type StoreBrand,
  type TitleStyle,
} from "@/lib/types";

export default function IndividualCreatePage() {
  const params = useSearchParams();
  const adId = params.get("id") || undefined;
  const canvasRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState<TitleStyle>({
    ...DEFAULT_TITLE_STYLE,
    text: "À VENDA !!!",
  });
  const [store, setStore] = useState<StoreBrand>(DEFAULT_STORE);
  const [contact, setContact] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_AD_BACKGROUND);
  const [kind, setKind] = useState<"pokemon" | "item">("pokemon");
  const [entry, setEntry] = useState<AdEntry | null>(null);

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
      if (!ad || ad.type !== "individual") return;
      setTitle(ad.title);
      setStore(ad.store);
      setContact(ad.contact);
      setBackgroundColor(ad.backgroundColor || DEFAULT_AD_BACKGROUND);
      const first = ad.entries[0];
      if (!first) return;
      setEntry(first);
      setKind(first.kind);
      if (first.kind === "pokemon") {
        setPokeName(first.name);
        setPokeColor(first.color);
        setLevel(first.level);
        setMultiplier(first.multiplier);
        setType1(first.type1);
        setType2(first.type2);
        setRarity(first.rarity);
        setPrice(first.price);
        setIv(first.iv);
        setIvMax(first.ivMax);
        setPhoto(first.photo);
        setPokeSold(Boolean(first.sold));
      } else {
        setItemDraft({
          name: first.name,
          color: first.color,
          price: first.price,
          rarity: first.rarity,
          notes: first.notes,
          photo: first.photo,
          sold: Boolean(first.sold),
        });
      }
    });
  }, [adId]);

  function applyPokemon() {
    if (!photo || !pokeName || !level || !multiplier || !type1 || !rarity || !price || !iv) {
      alert("Preencha todos os campos do Pokémon.");
      return;
    }
    const next: PokemonEntry = {
      kind: "pokemon",
      id: entry?.id || crypto.randomUUID(),
      name: pokeName.trim(),
      color: pokeColor,
      level: level.trim(),
      multiplier: multiplier.trim(),
      type1,
      type2,
      rarity,
      price: price.trim(),
      iv: iv.trim(),
      ivMax: ivMax.trim() || "192",
      photo,
      sold: pokeSold,
    };
    setEntry(next);
  }

  function applyItem() {
    if (!itemDraft.photo || !itemDraft.name || !itemDraft.price) {
      alert("Preencha nome, foto e preço do item.");
      return;
    }
    const next: ItemEntry = {
      kind: "item",
      id: entry?.id || crypto.randomUUID(),
      name: itemDraft.name.trim(),
      color: itemDraft.color,
      price: itemDraft.price.trim(),
      rarity: itemDraft.rarity,
      notes: itemDraft.notes.trim(),
      photo: itemDraft.photo,
      sold: itemDraft.sold,
    };
    setEntry(next);
  }

  return (
    <div className="editor-layout">
      <aside className="panel">
        <header className="panel-header">
          <h1>Anúncio individual</h1>
          <p>Um Pokémon ou um item em destaque</p>
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
          <h2>Tipo</h2>
          <div className="radio-row">
            <label className="check">
              <input
                type="radio"
                checked={kind === "pokemon"}
                onChange={() => setKind("pokemon")}
              />
              Pokémon
            </label>
            <label className="check">
              <input
                type="radio"
                checked={kind === "item"}
                onChange={() => setKind("item")}
              />
              Item
            </label>
          </div>
        </section>

        <section className="card">
          <h2>Conteúdo</h2>
          {kind === "pokemon" ? (
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
                <span>Foto (clique para trocar)</span>
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
                  {photo ? "" : "Escolha um Pokémon ou envie uma foto"}
                </div>
              </label>
              <label>
                Cor do nome
                <input
                  type="color"
                  value={pokeColor}
                  onChange={(e) => setPokeColor(e.target.value)}
                />
              </label>
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
                    onChange={(e) =>
                      setType1(e.target.value as PokemonTypeId)
                    }
                  >
                    {TYPES.map((t) => (
                      <option key={t.id || "x"} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tipo 2
                  <select
                    value={type2}
                    onChange={(e) =>
                      setType2(e.target.value as PokemonTypeId)
                    }
                  >
                    {TYPES.map((t) => (
                      <option key={`2-${t.id || "x"}`} value={t.id}>
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
                  IV
                  <input
                    type="number"
                    value={iv}
                    onChange={(e) => setIv(e.target.value)}
                  />
                </label>
                <label>
                  IV máximo
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
              <button type="button" className="btn primary" onClick={applyPokemon}>
                Atualizar prévia
              </button>
            </div>
          ) : (
            <div className="stack">
              <ItemForm draft={itemDraft} onChange={setItemDraft} />
              <button type="button" className="btn primary" onClick={applyItem}>
                Atualizar prévia
              </button>
            </div>
          )}
        </section>

        <ExportActions
          canvasRef={canvasRef}
          type="individual"
          title={title}
          store={store}
          contact={contact}
          backgroundColor={backgroundColor}
          layout="list"
          entries={entry ? [entry] : []}
          adId={adId}
        />
      </aside>

      <main className="preview-wrap">
        <div className="preview-toolbar">
          <h2>Prévia do anúncio</h2>
        </div>
        <div className="preview-stage">
          <AdCanvas
            ref={canvasRef}
            title={title}
            store={store}
            contact={contact}
            backgroundColor={backgroundColor}
            entries={entry ? [entry] : []}
            variant="individual"
          />
        </div>
      </main>
    </div>
  );
}
