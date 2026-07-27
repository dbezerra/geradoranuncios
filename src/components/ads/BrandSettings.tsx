"use client";

import {
  DEFAULT_AD_BACKGROUND,
  FONT_OPTIONS,
  type ContactInfo,
  type StoreBrand,
  type TitleStyle,
} from "@/lib/types";

type Props = {
  title: TitleStyle;
  store: StoreBrand;
  contact: ContactInfo;
  backgroundColor: string;
  onTitleChange: (next: TitleStyle) => void;
  onStoreChange: (next: StoreBrand) => void;
  onContactChange: (next: ContactInfo) => void;
  onBackgroundColorChange: (next: string) => void;
};

export function BrandSettings({
  title,
  store,
  contact,
  backgroundColor,
  onTitleChange,
  onStoreChange,
  onContactChange,
  onBackgroundColorChange,
}: Props) {
  return (
    <>
      <section className="card">
        <h2>Cabeçalho</h2>
        <label>
          Título do anúncio
          <input
            type="text"
            value={title.text}
            onChange={(e) =>
              onTitleChange({ ...title, text: e.target.value })
            }
          />
        </label>
        <div className="grid-2">
          <label>
            Cor do título
            <input
              type="color"
              value={title.color}
              onChange={(e) => onTitleChange({ ...title, color: e.target.value })}
            />
          </label>
          <label>
            Tamanho
            <input
              type="number"
              min={16}
              max={72}
              value={title.size}
              onChange={(e) =>
                onTitleChange({ ...title, size: Number(e.target.value) || 34 })
              }
            />
          </label>
        </div>
        <label>
          Fonte do título
          <select
            value={title.font}
            onChange={(e) => onTitleChange({ ...title, font: e.target.value })}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cor de fundo do anúncio
          <input
            type="color"
            value={backgroundColor || DEFAULT_AD_BACKGROUND}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
          />
        </label>
      </section>

      <section className="card">
        <h2>Nome da loja</h2>
        <div className="radio-row">
          <label className="check">
            <input
              type="radio"
              checked={store.mode === "text"}
              onChange={() => onStoreChange({ ...store, mode: "text" })}
            />
            Texto
          </label>
          <label className="check">
            <input
              type="radio"
              checked={store.mode === "image"}
              onChange={() => onStoreChange({ ...store, mode: "image" })}
            />
            Imagem
          </label>
        </div>

        {store.mode === "text" ? (
          <>
            <label>
              Nome da loja
              <input
                type="text"
                value={store.name}
                onChange={(e) => onStoreChange({ ...store, name: e.target.value })}
              />
            </label>
            <div className="grid-2">
              <label>
                Cor
                <input
                  type="color"
                  value={store.color}
                  onChange={(e) =>
                    onStoreChange({ ...store, color: e.target.value })
                  }
                />
              </label>
              <label>
                Tamanho
                <input
                  type="number"
                  min={12}
                  max={48}
                  value={store.size}
                  onChange={(e) =>
                    onStoreChange({
                      ...store,
                      size: Number(e.target.value) || 28,
                    })
                  }
                />
              </label>
            </div>
            <label>
              Fonte
              <select
                value={store.font}
                onChange={(e) => onStoreChange({ ...store, font: e.target.value })}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <label className="photo-upload">
              <span>Logo da loja</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () =>
                    onStoreChange({
                      ...store,
                      mode: "image",
                      imageDataUrl: String(reader.result || ""),
                    });
                  reader.readAsDataURL(file);
                }}
              />
              <div
                className={`photo-preview store-logo-preview ${store.imageDataUrl ? "" : "empty"}`}
                style={
                  store.imageDataUrl
                    ? { backgroundImage: `url("${store.imageDataUrl}")` }
                    : undefined
                }
              >
                {store.imageDataUrl ? "" : "Clique para enviar o logo"}
              </div>
            </label>
            <button
              type="button"
              className="btn ghost"
              disabled={!store.imageDataUrl}
              onClick={() => onStoreChange({ ...store, imageDataUrl: "" })}
            >
              Remover logo
            </button>
          </>
        )}
      </section>

      <section className="card">
        <h2>Contato / Rodapé</h2>
        <label>
          WhatsApp
          <input
            type="text"
            placeholder="5511999999999"
            value={contact.whatsapp}
            onChange={(e) =>
              onContactChange({ ...contact, whatsapp: e.target.value })
            }
          />
        </label>
        <label>
          Discord
          <input
            type="text"
            placeholder="seuusuario"
            value={contact.discord}
            onChange={(e) =>
              onContactChange({ ...contact, discord: e.target.value })
            }
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={contact.showPix}
            onChange={(e) =>
              onContactChange({ ...contact, showPix: e.target.checked })
            }
          />
          Mostrar PIX
        </label>
      </section>
    </>
  );
}
