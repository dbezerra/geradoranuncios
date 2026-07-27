"use client";

import { useEffect, useMemo, useState } from "react";
import pokedexData from "@/data/pokemon.json";
import { CDN_ART, loadImageAsDataUrl, normalize } from "@/lib/constants";
import type { PokedexEntry, PokemonTypeId } from "@/lib/types";

type Props = {
  name: string;
  onNameChange: (name: string) => void;
  onSelect: (payload: {
    name: string;
    photo: string;
    type1: PokemonTypeId;
    type2: PokemonTypeId;
  }) => void;
};

const pokedex = pokedexData as PokedexEntry[];

export function PokemonPicker({ name, onNameChange, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = normalize(name);
    if (!q) return [];
    return pokedex
      .filter(
        (p) =>
          normalize(p.name).includes(q) ||
          normalize(p.namePt).includes(q) ||
          normalize(p.slug).includes(q) ||
          String(p.id) === q
      )
      .slice(0, 12);
  }, [name]);

  useEffect(() => {
    setActive(0);
  }, [name]);

  async function choose(entry: PokedexEntry) {
    setOpen(false);
    onNameChange(entry.name);
    const urls = [
      entry.image?.startsWith("pokemon/")
        ? `/${entry.image}`
        : entry.image,
      `/pokemon/images/${entry.id}.webp`,
      `${CDN_ART}/${entry.id}.png`,
    ];
    let photo = "";
    for (const url of urls) {
      try {
        photo = await loadImageAsDataUrl(url);
        if (photo) break;
      } catch {
        // try next
      }
    }
    onSelect({
      name: entry.name,
      photo,
      type1: (entry.types[0] || "") as PokemonTypeId,
      type2: (entry.types[1] || "") as PokemonTypeId,
    });
  }

  return (
    <label className="name-field">
      Nome do Pokémon
      <input
        type="text"
        placeholder="Digite para buscar..."
        autoComplete="off"
        spellCheck={false}
        value={name}
        onChange={(e) => {
          onNameChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!matches.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((v) => (v + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((v) => (v - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            void choose(matches[active] || matches[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && matches.length > 0 && (
        <ul className="name-suggestions">
          {matches.map((p, index) => (
            <li
              key={p.id}
              className={index === active ? "active" : ""}
              onMouseDown={(e) => {
                e.preventDefault();
                void choose(p);
              }}
            >
              <img
                src={`/pokemon/images/${p.id}.webp`}
                alt=""
                loading="lazy"
              />
              <span className="poke-name">
                {p.name}
                {p.namePt && p.namePt !== p.name ? (
                  <small> ({p.namePt})</small>
                ) : null}
              </span>
              <span className="poke-id">#{String(p.id).padStart(3, "0")}</span>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
