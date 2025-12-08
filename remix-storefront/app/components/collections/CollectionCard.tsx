import { Link } from '@remix-run/react';
import type { Collection } from '~/generated/graphql';

type CollectionCardProps = {
  collection: Pick<Collection, 'id' | 'name' | 'slug'> & {
    featuredAsset?: { preview?: string | null } | null;
  };
};

/**
 * Cartão de coleção sem dependência de imagem.
 * Usa o mesmo “estilo pill” das categorias da home: fundo escuro, borda vermelha, seta →.
 */
export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link
      to={`/collections/${collection.slug}`}
      className="
        inline-flex w-full items-center justify-between
        rounded-lg border border-red-600
        bg-black text-white
        px-4 py-2 text-sm sm:text-base
        hover:bg-red-600 hover:border-red-600
        transition-colors duration-150
      "
    >
      <span className="truncate">{collection.name}</span>
      <span
        aria-hidden="true"
        className="ml-3 text-base sm:text-lg leading-none"
      >
        →
      </span>
    </Link>
  );
}
