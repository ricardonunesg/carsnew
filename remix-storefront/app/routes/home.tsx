import { useLoaderData } from "react-router";
import { vendure } from "~/lib/vendure-client.server";
import { GET_PRODUCTS } from "~/lib/queries";

type Product = {
  id: string;
  slug: string;
  name: string;
};

type LoaderData = {
  products: Product[];
};

export async function loader() {
  const data = await vendure.request(GET_PRODUCTS);
  const products: Product[] = data.products.items;
  return { products };
}

export default function Home() {
  const { products } = useLoaderData() as LoaderData;

  return (
    <main style={{ padding: "2rem", maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Cars & Vibes – Produtos
      </h1>

      {products.length === 0 ? (
        <p>Sem produtos por enquanto.</p>
      ) : (
        <ul>
          {products.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
