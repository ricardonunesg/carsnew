import { Link } from "@remix-run/react";
import type { SearchQuery } from "~/generated/graphql";
import { Price } from "./Price";

export type ProductCardProps = SearchQuery["search"]["items"][number];

export function ProductCard({
  productAsset,
  productVariantAsset,
  productName,
  slug,
  priceWithTax,
  currencyCode,
}: ProductCardProps) {
  const asset = productAsset ?? productVariantAsset;

  // ❗ Só limitamos a largura (w=600), sem forçar altura, para não cortar botas, fatos, etc.
  const src = asset?.preview
    ? `${asset.preview}?w=600`
    : "/no-image.png";

  return (
    <Link className="flex flex-col" prefetch="intent" to={`/products/${slug}`}>
      {/* wrapper da imagem: proporção fixa, fundo branco, imagem centrada */}
      <div className="w-full aspect-[4/5] rounded-xl bg-white flex items-center justify-center overflow-hidden">
        <img
          alt={productName}
          src={src}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            e.currentTarget.src = "/no-image.png";
          }}
        />
      </div>

      <div className="h-2" />

      <div className="text-sm text-gray-700 line-clamp-2 min-h-[2.5rem]">
        {productName}
      </div>

      <div className="text-sm font-medium text-gray-900">
        <Price priceWithTax={priceWithTax} currencyCode={currencyCode} />
      </div>
    </Link>
  );
}
