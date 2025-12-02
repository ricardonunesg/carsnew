// app/routes/search.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { searchProducts } from "~/utils/vendure.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";

  const results = await searchProducts(q);

  return json({ q, results });
}

export default function SearchPage() {
  const { q, results } = useLoaderData<typeof loader>();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8 text-slate-50">
      <h1 className="mb-4 text-2xl font-semibold">Pesquisar produtos</h1>

      {/* Barra de pesquisa */}
      <Form method="get" action="/search" className="mb-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Procurar por produto..."
          className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
        />
        <button
          type="submit"
          className="rounded-md border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
        >
          Search
        </button>
      </Form>

      {/* Resultados */}
      {q && (
        <p className="mb-2 text-sm text-slate-400">
          Encontrados {results.totalItems} resultado(s) para <strong>{q}</strong>
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {results.items.map((item) => (
          <article
            key={item.sku}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <h2 className="text-sm font-semibold">{item.productName}</h2>
            {item.description && (
              <p className="mt-1 line-clamp-3 text-xs text-slate-400">
                {item.description}
              </p>
            )}
            {item.price?.value && (
              <p className="mt-2 text-sm font-semibold">
                {(item.price.value / 100).toFixed(2)} {item.currencyCode}
              </p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
