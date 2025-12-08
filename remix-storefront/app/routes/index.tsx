import { Link, useLoaderData } from '@remix-run/react';
import { getCollections } from '~/providers/collections/collections';
import type { LoaderArgs } from '@remix-run/server-runtime';
import { useTranslation } from 'react-i18next';

// 🌍 idiomas suportados
type Locale = 'pt' | 'fr' | 'en' | 'es';

// Mapa: nome atual da collection (como vem do Vendure, em FR)
//  -> labels por idioma
const COLLECTION_LABELS: Record<
  string,
  Partial<Record<Locale, string>>
> = {
  // Équipement Mécanique
  Pitline: {
    pt: 'Pitline',
    es: 'Pitline',
    en: 'Pitline',
  },
  Fluids: {
    pt: 'Fluidos',
    es: 'Fluidos',
    en: 'Fluids',
  },
  'Équipement Pilote FIA': {
    pt: 'Equipamento Piloto FIA',
    es: 'Equipamiento Piloto FIA',
    en: 'FIA Driver Equipment',
  },
  Accessoires: {
    pt: 'Acessórios',
    es: 'Accesorios',
    en: 'Accessories',
  },
  'Bottines FIA': {
    pt: 'Botas FIA',
    es: 'Botas FIA',
    en: 'FIA Boots',
  },
  'Équipement Mécanique': {
    pt: 'Equipamento Mecânico',
    es: 'Equipamiento Mecánico',
    en: 'Mechanical Equipment',
  },

  // Casques de Karting
  'Soin et Protection': {
    pt: 'Cuidado e Proteção',
    es: 'Cuidado y Protección',
    en: 'Care & Protection',
  },
  Lifestyle: {
    pt: 'Lifestyle',
    es: 'Lifestyle',
    en: 'Lifestyle',
  },
  Lubrifiants: {
    pt: 'Lubrificantes',
    es: 'Lubricantes',
    en: 'Lubricants',
  },
  'Casques de Karting': {
    pt: 'Capacetes de Karting',
    es: 'Cascos de Karting',
    en: 'Karting Helmets',
  },
  'Gants FIA': {
    pt: 'Luvas FIA',
    es: 'Guantes FIA',
    en: 'FIA Gloves',
  },
  'Sacs & Bagagerie': {
    pt: 'Sacos & Bagagem',
    es: 'Bolsas y Equipaje',
    en: 'Bags & Luggage',
  },
  Additifs: {
    pt: 'Aditivos',
    es: 'Aditivos',
    en: 'Additives',
  },

  // Pilote
  'Combinaisons FIA': {
    pt: 'Fatos FIA',
    es: 'Monos FIA',
    en: 'FIA Suits',
  },
  Pilote: {
    pt: 'Piloto',
    es: 'Piloto',
    en: 'Driver',
  },
  Opportunités: {
    pt: 'Oportunidades',
    es: 'Oportunidades',
    en: 'Deals',
  },
  'Sièges': {
    pt: 'Bancos',
    es: 'Asientos',
    en: 'Seats',
  },
  'Casques de Pilote': {
    pt: 'Capacetes de Piloto',
    es: 'Cascos de Piloto',
    en: 'Driver Helmets',
  },
  Volants: {
    pt: 'Volantes',
    es: 'Volantes',
    en: 'Steering Wheels',
  },
  Merchandising: {
    pt: 'Merchandising',
    es: 'Merchandising',
    en: 'Merchandising',
  },
};

export async function loader({ request }: LoaderArgs) {
  const collections = await getCollections(request, { take: 20 });
  return {
    collections,
  };
}

export default function Index() {
  const { collections } = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation();

  // idioma atual (ex.: "pt-PT" -> "pt")
  const rawLang = i18n.language || 'pt';
  const lang = (rawLang.split('-')[0] as Locale) ?? 'pt';

  return (
    <>
      {/* HERO CARS & VIBES */}
      <section className="relative w-full h-[500px] sm:h-[560px] overflow-hidden">
        <img
          src="/carsandvibes-hero.jpg"
          alt="Cars & Vibes"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />

        {/* Overlay escuro por cima da imagem */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Conteúdo do hero */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white drop-shadow-lg">
            Cars &amp; Vibes
          </h1>
          <p className="mt-4 text-lg sm:text-2xl text-gray-200 max-w-2xl drop-shadow">
            Performance, estilo e qualidade — a tua loja de peças e acessórios
            automóvel.
          </p>
          <a
            href="/collections/pilote"
            className="mt-8 inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-primary-700"
          >
            Explorar produtos
          </a>
        </div>
      </section>

      {/* LISTA DE CATEGORIAS – estilo “chips” vermelhos */}
      <section
        aria-labelledby="category-heading"
        className="py-16 bg-white"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2
            id="category-heading"
            className="text-2xl font-semibold tracking-tight text-gray-900 mb-6"
          >
            {t('common.shopByCategory')}
          </h2>

          <div className="flex flex-wrap gap-3">
            {collections.map((collection) => {
              const labelsForCollection = COLLECTION_LABELS[collection.name];
              const label =
                labelsForCollection?.[lang] ?? collection.name; // fallback: nome original

              return (
                <Link
                  key={collection.id}
                  to={`/collections/${collection.slug}`}
                  prefetch="intent"
                  className="
                    inline-flex items-center justify-between
                    rounded-lg border border-red-600
                    bg-black text-white
                    px-4 py-3 text-sm font-medium
                    shadow-sm
                    hover:bg-red-600 hover:border-red-600
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white
                    transition
                  "
                >
                  <span className="truncate max-w-[12rem]">
                    {label}
                  </span>
                  <span className="ml-3 text-lg" aria-hidden="true">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
