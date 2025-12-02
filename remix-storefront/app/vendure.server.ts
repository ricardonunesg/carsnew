// app/utils/vendure.server.ts
import type { SearchResult } from "./vendure.types"; // já vamos criar este tipo

const VENDURE_API_URL =
  process.env.VENDURE_API_URL ?? "http://localhost:3000/shop-api";

export async function searchProducts(term: string) {
  const q = term.trim();

  if (!q) {
    return { totalItems: 0, items: [] as SearchResult[] };
  }

  const query = `
    query Search($term: String!) {
      search(input: { term: $term, take: 20 }) {
        totalItems
        items {
          productId
          productName
          sku
          slug
          description
          price {
            ... on SinglePrice {
              value
            }
          }
          currencyCode
        }
      }
    }
  `;

  const res = await fetch(VENDURE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { term: q },
    }),
  });

  if (!res.ok) {
    console.error("Vendure search error:", await res.text());
    return { totalItems: 0, items: [] as SearchResult[] };
  }

  const json = await res.json();
  return json.data.search as { totalItems: number; items: SearchResult[] };
}
