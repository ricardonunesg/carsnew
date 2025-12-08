// app/routes/api.search.tsx
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { search } from '~/providers/products/products';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const term = (url.searchParams.get('q') ?? '').trim();

  // Se não há texto suficiente, não vale a pena bater na API
  if (term.length < 2) {
    return json({ items: [] });
  }

  const result = await search(
    {
      input: {
        term,
        groupByProduct: true,
        take: 8, // nº máximo de sugestões no dropdown
      },
    },
    { request } as any
  );

  return json({
    items: result.search.items,
  });
}
