"use client";

import { forwardRef } from "react";
import { formatPrice, getType } from "@/lib/constants";
import {
  DEFAULT_AD_BACKGROUND,
  type AdEntry,
  type ContactInfo,
  type MixedLayout,
  type StoreBrand,
  type TitleStyle,
} from "@/lib/types";

type Props = {
  title: TitleStyle;
  store: StoreBrand;
  contact: ContactInfo;
  entries: AdEntry[];
  backgroundColor?: string;
  layout?: "list" | MixedLayout;
  variant?: "multi" | "individual" | "mixed";
};

function TypeIcons({ type1, type2 }: { type1?: string; type2?: string }) {
  return (
    <div className="types">
      {[type1, type2].filter(Boolean).map((id) => {
        const t = getType(id || "");
        if (!t.id) return null;
        return (
          <span
            key={id}
            className="type-icon"
            style={{ background: t.color }}
            title={t.label}
          >
            {t.short}
          </span>
        );
      })}
    </div>
  );
}

function SoldRibbon() {
  return (
    <div className="sold-ribbon" aria-label="Vendido">
      <span>Vendido</span>
    </div>
  );
}

function ListRow({ entry }: { entry: AdEntry }) {
  if (entry.kind === "pokemon") {
    return (
      <div className={`ad-row ${entry.sold ? "is-sold" : ""}`}>
        {entry.sold ? <SoldRibbon /> : null}
        <img src={entry.photo} alt={entry.name} />
        <div>
          <div className="ad-name" style={{ color: entry.color }}>
            {entry.name}
          </div>
          <div className="ad-level">Lv.{entry.level}</div>
        </div>
        <TypeIcons type1={entry.type1} type2={entry.type2} />
        <div className="vsep" />
        <div className="size-block">
          <div className="size">{entry.multiplier}</div>
          <div className="rarity">{entry.rarity}</div>
        </div>
        <div className="vsep" />
        <div className="iv-block">
          IV {entry.iv}/{entry.ivMax}
        </div>
        <div className="vsep" />
        <div className="price-block">
          <div className="label">PREÇO</div>
          <div className="value">{formatPrice(entry.price)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-row ad-row-item ${entry.sold ? "is-sold" : ""}`}>
      {entry.sold ? <SoldRibbon /> : null}
      <img src={entry.photo} alt={entry.name} />
      <div>
        <div className="ad-name" style={{ color: entry.color }}>
          {entry.name}
        </div>
        <div className="ad-level">{entry.notes || "Item"}</div>
      </div>
      <div className="types" />
      <div className="vsep" />
      <div className="size-block">
        <div className="size">ITEM</div>
        <div className="rarity">{entry.rarity || "—"}</div>
      </div>
      <div className="vsep" />
      <div className="iv-block">—</div>
      <div className="vsep" />
      <div className="price-block">
        <div className="label">PREÇO</div>
        <div className="value">{formatPrice(entry.price)}</div>
      </div>
    </div>
  );
}

export const AdCanvas = forwardRef<HTMLDivElement, Props>(function AdCanvas(
  {
    title,
    store,
    contact,
    entries,
    backgroundColor = DEFAULT_AD_BACKGROUND,
    layout = "list",
    variant = "multi",
  },
  ref
) {
  const showImage = store.mode === "image" && store.imageDataUrl;
  const bg = backgroundColor || DEFAULT_AD_BACKGROUND;

  return (
    <div ref={ref} className="ad-canvas" style={{ background: bg }}>
      <header className="ad-header">
        <div className="store-brand">
          {showImage ? (
            <img className="store-image" src={store.imageDataUrl} alt="Logo" />
          ) : (
            <span
              className="store-text"
              style={{
                color: store.color,
                fontSize: store.size,
                fontFamily: store.font,
              }}
            >
              {store.name || "Loja"}
            </span>
          )}
        </div>
        <h1
          className="ad-title"
          style={{
            color: title.color,
            fontSize: title.size,
            fontFamily: title.font,
            textShadow: `0 0 10px ${title.color}88`,
          }}
        >
          {title.text}
        </h1>
        <div className="coin">$</div>
      </header>

      {variant === "individual" && entries[0] ? (
        <div className={`ad-individual ${entries[0].sold ? "is-sold" : ""}`}>
          {entries[0].sold ? <SoldRibbon /> : null}
          <img src={entries[0].photo} alt={entries[0].name} />
          <div className="ad-name big" style={{ color: entries[0].color }}>
            {entries[0].name}
          </div>
          {entries[0].kind === "pokemon" ? (
            <>
              <div className="ad-level">Lv.{entries[0].level}</div>
              <TypeIcons type1={entries[0].type1} type2={entries[0].type2} />
              <div className="individual-stats">
                <span>
                  {entries[0].multiplier} · {entries[0].rarity}
                </span>
                <span>
                  IV {entries[0].iv}/{entries[0].ivMax}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="ad-level">{entries[0].notes || "Item"}</div>
              <div className="individual-stats">
                <span>{entries[0].rarity || "Item"}</span>
              </div>
            </>
          )}
          <div className="individual-price">{formatPrice(entries[0].price)}</div>
        </div>
      ) : layout === "grid" || layout === "cards" ? (
        <div className={`ad-mixed ${layout}`}>
          {entries.length === 0 ? (
            <div className="ad-empty">Adicione Pokémon ou itens</div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className={`mixed-card ${layout} ${entry.sold ? "is-sold" : ""}`}
              >
                {entry.sold ? <SoldRibbon /> : null}
                <img src={entry.photo} alt={entry.name} />
                <div className="mixed-card-body">
                  <div className="ad-name" style={{ color: entry.color }}>
                    {entry.name}
                  </div>
                  {entry.kind === "pokemon" ? (
                    <>
                      <div className="ad-level">
                        Lv.{entry.level} · {entry.rarity}
                      </div>
                      <div className="mixed-attrs">
                        <span>x{entry.multiplier || "—"}</span>
                        <span>
                          IV {entry.iv || "—"}/{entry.ivMax || "192"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="ad-level">
                      {entry.notes ? `${entry.notes} · ` : ""}
                      {entry.rarity || "Item"}
                    </div>
                  )}
                  <div className="price-block">
                    <div className="value">{formatPrice(entry.price)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="ad-rows">
          {entries.length === 0 ? (
            <div className="ad-empty">Adicione Pokémon para montar o anúncio</div>
          ) : (
            entries.map((entry) => <ListRow key={entry.id} entry={entry} />)
          )}
        </div>
      )}

      <footer className="ad-footer">
        <div className="footer-left">
          <div className="social">
            <div className="contact-line">
              <span className="icon discord">D</span>
              <span
                className="contact-text"
                style={{ opacity: contact.discord ? 1 : 0.45 }}
              >
                {contact.discord || "informe o discord"}
              </span>
            </div>
            <div className="contact-line">
              <span className="icon whatsapp">W</span>
              <span
                className="contact-text"
                style={{ opacity: contact.whatsapp ? 1 : 0.45 }}
              >
                {contact.whatsapp || "informe o número"}
              </span>
            </div>
          </div>
          {contact.showPix && <div className="pix-badge">aceitamos pix</div>}
        </div>
        <div className="footer-center">
          <div className="cta green">
            <span className="wa-dot" />
            ENTRE EM CONTATO
          </div>
          <div className="cta blue">CONTACT US</div>
        </div>
        <div className="footer-right">
          <div className="badge secure">
            <span className="shield">✓</span>
            <span>COMPRA SEGURA</span>
          </div>
          <div className="badge quality">
            <span className="seal">★</span>
            <span>QUALIDADE GARANTIDA</span>
          </div>
        </div>
      </footer>
    </div>
  );
});
