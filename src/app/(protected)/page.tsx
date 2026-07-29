import Link from "next/link";
import { AUTH_REQUIRED } from "@/lib/authFlags";

const types = [
  {
    href: "/criar/multi",
    title: "Múltiplos Pokémon",
    desc: "Lista no estilo Pokelist com vários Pokémon, IV, raridade e preço.",
  },
  {
    href: "/criar/individual",
    title: "Anúncio individual",
    desc: "Destaque um único Pokémon ou item com foto grande e preço.",
  },
  {
    href: "/criar/misto",
    title: "Anúncio misto",
    desc: "Misture Pokémon e itens com layout em grid ou cards.",
  },
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <h1>Gerador de anúncios Pokémon</h1>
        <p>
          Monte anúncios prontos para WhatsApp, personalize loja e título, salve
          para baixar depois ou compartilhe direto pelo app.
        </p>
        <div className="hero-actions">
          <Link href="/criar/multi" className="btn success">
            Criar anúncio
          </Link>
          <Link href="/anuncios" className="btn ghost">
            Meus anúncios
          </Link>
          {AUTH_REQUIRED ? (
            <Link href="/login" className="btn primary">
              Entrar com Google
            </Link>
          ) : null}
        </div>
      </section>

      <section className="type-grid">
        {types.map((t) => (
          <Link key={t.href} href={t.href} className="type-card">
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
            <span className="btn primary">Abrir</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
