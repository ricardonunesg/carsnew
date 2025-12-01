import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { vendure } from "~/lib/vendure-client.server";
import { GET_PRODUCTS } from "~/lib/queries";
import { storyblok } from "~/lib/storyblok.server";

type Product = {
  id: string;
  slug: string;
  name: string;
};

type LoaderData = {
  products: Product[];
  heroTitle: string;
  heroSubtitle: string;
};

export async function loader(_args: LoaderFunctionArgs) {
  // 1) Produtos do Vendure
  const data = await vendure.request(GET_PRODUCTS);
  const products: Product[] = data.products.items;

  // 2) Conteúdo da home no Storyblok (com fallback)
  let heroTitle = "Cars & Vibes";
  let heroSubtitle = "Performance, estilo e segurança em pista.";

  if (storyblok) {
    try {
      const res = await storyblok.get("cdn/stories/home", {
        version: "draft",
      });

      const content: any = res.data.story?.content;

      if (content?.body && Array.isArray(content.body)) {
        const teaser = content.body.find(
          (block: any) => block.component === "teaser"
        );

        if (teaser?.headline) {
          heroTitle = teaser.headline;
        }
      }
    } catch (e) {
      console.warn("[Storyblok] Erro ao obter 'home':", e);
    }
  }

  return { products, heroTitle, heroSubtitle };
}

export default function Home() {
  const { products, heroTitle, heroSubtitle } = useLoaderData() as LoaderData;

  return (
    <main style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <section
        style={{
          padding: "3rem 2rem",
          borderRadius: "1.5rem",
          marginBottom: "2rem",
          border: "1px solid #222",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          {heroTitle}
        </h1>
        <p style={{ fontSize: "1.1rem", opacity: 0.8 }}>{heroSubtitle}</p>
      </section>

      <section>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
          Produtos em destaque
        </h2>
        {products.length === 0 ? (
          <p>Sem produtos por enquanto.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {products.map((p) => (
              <article
                key={p.id}
                style={{
                  border: "1px solid #222",
                  borderRadius: "1rem",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "120px",
                }}
              >
                <h3
                  style={{
                    fontSize: "1rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  {p.name}
                </h3>
                <a
                  href={`/product/${p.slug}`}
                  style={{
                    marginTop: "auto",
                    fontSize: "0.9rem",
                    textDecoration: "underline",
                  }}
                >
                  Ver detalhes
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
