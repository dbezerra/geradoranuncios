"use client";

import { NAME_COLORS, RARITIES } from "@/lib/types";

export type ItemDraft = {
  name: string;
  color: string;
  price: string;
  rarity: string;
  notes: string;
  photo: string;
  sold: boolean;
};

type Props = {
  draft: ItemDraft;
  onChange: (next: ItemDraft) => void;
};

export function emptyItemDraft(index = 0): ItemDraft {
  return {
    name: "",
    color: NAME_COLORS[index % NAME_COLORS.length],
    price: "",
    rarity: "",
    notes: "",
    photo: "",
    sold: false,
  };
}

export function ItemForm({ draft, onChange }: Props) {
  return (
    <div className="stack">
      <label>
        Nome do item
        <input
          type="text"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="Ex: Master Ball"
        />
      </label>
      <label className="photo-upload">
        <span>Foto do item</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () =>
              onChange({ ...draft, photo: String(reader.result || "") });
            reader.readAsDataURL(file);
          }}
        />
        <div
          className={`photo-preview ${draft.photo ? "" : "empty"}`}
          style={
            draft.photo ? { backgroundImage: `url("${draft.photo}")` } : undefined
          }
        >
          {draft.photo ? "" : "Clique para enviar"}
        </div>
      </label>
      <div className="grid-2">
        <label>
          Cor do nome
          <input
            type="color"
            value={draft.color}
            onChange={(e) => onChange({ ...draft, color: e.target.value })}
          />
        </label>
        <label>
          Preço (R$)
          <input
            type="text"
            value={draft.price}
            onChange={(e) => onChange({ ...draft, price: e.target.value })}
          />
        </label>
      </div>
      <div className="grid-2">
        <label>
          Raridade
          <select
            value={draft.rarity}
            onChange={(e) => onChange({ ...draft, rarity: e.target.value })}
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
          Observações
          <input
            type="text"
            value={draft.notes}
            onChange={(e) => onChange({ ...draft, notes: e.target.value })}
            placeholder="Ex: x99"
          />
        </label>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.sold}
          onChange={(e) => onChange({ ...draft, sold: e.target.checked })}
        />
        Item vendido
      </label>
    </div>
  );
}
