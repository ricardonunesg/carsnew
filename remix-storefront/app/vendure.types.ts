// app/utils/vendure.types.ts
export type SearchResult = {
  productId: string;
  productName: string;
  sku: string;
  slug: string;
  description?: string | null;
  price?: {
    value?: number | null;
  } | null;
  currencyCode?: string | null;
};
