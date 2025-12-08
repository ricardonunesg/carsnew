// app/routes/collections.$slug.tsx
import { MetaFunction, useLoaderData, useSubmit } from '@remix-run/react';
import { DataFunctionArgs } from '@remix-run/server-runtime';
import { withZod } from '@remix-validated-form/with-zod';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ValidatedForm } from 'remix-validated-form';

import { Breadcrumbs } from '~/components/Breadcrumbs';
import { CollectionCard } from '~/components/collections/CollectionCard';
import { FacetFilterTracker } from '~/components/facet-filter/facet-filter-tracker';
import { FiltersButton } from '~/components/FiltersButton';
import { FilterableProductGrid } from '~/components/products/FilterableProductGrid';
import { APP_META_TITLE } from '~/constants';
import { filteredSearchLoaderFromPagination } from '~/utils/filtered-search-loader';
import { sdk } from '../graphqlWrapper';

export const meta: MetaFunction = ({ data }) => {
  return [
    {
      title: data?.collection
        ? `${data.collection?.name} - ${APP_META_TITLE}`
        : APP_META_TITLE,
    },
  ];
};

const paginationLimitMinimumDefault = 25;
const allowedPaginationLimits = new Set<number>([
  paginationLimitMinimumDefault,
  50,
  100,
]);

const { validator, filteredSearchLoader } = filteredSearchLoaderFromPagination(
  allowedPaginationLimits,
  paginationLimitMinimumDefault,
);

export async function loader({ params, request, context }: DataFunctionArgs) {
  // 1) carregar a coleção pelo slug
  const { collection } = await sdk.collection({ slug: params.slug as string });

  if (!collection?.id || !collection?.name) {
    throw new Response('Not Found', { status: 404 });
  }

  // 2) fazer o search normal com o slug da coleção
  const {
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
    appliedPaginationLimit,
    appliedPaginationPage,
    term,
  } = await filteredSearchLoader({
    params,
    request,
    context,
  });

  return {
    term,
    collection,
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
    appliedPaginationLimit,
    appliedPaginationPage,
  };
}

export default function CollectionSlug() {
  const loaderData = useLoaderData<typeof loader>();
  const { collection, result, resultWithoutFacetValueFilters, facetValueIds } =
    loaderData;

  const hasChildren = !!collection.children && collection.children.length > 0;

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const facetValuesTracker = useRef(new FacetFilterTracker());
  facetValuesTracker.current.update(
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
  );

  const submit = useSubmit();
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-gray-900 my-8">
          {collection.name}
        </h2>

        {/* Só mostra o botão de filtros se estivermos numa coleção folha
            (subcategoria com produtos) */}
        {!hasChildren && (
          <FiltersButton
            filterCount={facetValueIds.length}
            onClick={() => setMobileFiltersOpen(true)}
          />
        )}
      </div>

      <Breadcrumbs items={collection.breadcrumbs} />

      {/* Se a coleção tiver filhos → mostrar só as subcategorias (botões/cartões) */}
      {hasChildren && (
        <div className="max-w-2xl mx-auto py-16 sm:py-16 lg:max-w-none">
          <h2 className="text-2xl font-light text-gray-900">
            {t('product.collections')}
          </h2>

          <div className="mt-6 grid max-w-xs sm:max-w-none mx-auto sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {collection.children!.map((child) => (
              <CollectionCard key={child.id} collection={child} />
            ))}
          </div>
        </div>
      )}

      {/* Se NÃO tiver filhos → é subcategoria. Aqui mostramos a grelha de produtos */}
      {!hasChildren && (
        <ValidatedForm
          validator={withZod(validator)}
          method="get"
          onChange={(e) =>
            submit(e.currentTarget, { preventScrollReset: true })
          }
        >
          <FilterableProductGrid
            allowedPaginationLimits={allowedPaginationLimits}
            mobileFiltersOpen={mobileFiltersOpen}
            setMobileFiltersOpen={setMobileFiltersOpen}
            {...loaderData}
          />
        </ValidatedForm>
      )}
    </div>
  );
}

export function CatchBoundary() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-gray-900 my-8">
        {t('product.collectionNotFound')}
      </h2>
      <div className="mt-6 grid sm:grid-cols-5 gap-x-4">
        <div className="space-y-6">
          <div className="h-2 bg-slate-200 rounded col-span-1"></div>
          <div className="h-2 bg-slate-200 rounded col-span-1"></div>
          <div className="h-2 bg-slate-200 rounded col-span-1"></div>
        </div>
        <div className="sm:col-span-5 lg:col-span-4">
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
