import type { SearchQuery } from '~/generated/graphql';

type SearchResult = SearchQuery['search'];

export interface FacetOption {
  id: string;
  name: string;
  selected: boolean;
}

export interface FacetWithValues {
  id: string;
  name: string;
  values: FacetOption[];
}

/**
 * Junta os facetValues devolvidos pelo search em grupos por facet
 * (ex.: "Categoria Principal", "Marca", "Subcategoria", etc.)
 * e marca quais estão selecionados.
 */
export class FacetFilterTracker {
  private _facetsWithValues: FacetWithValues[] = [];

  get facetsWithValues(): FacetWithValues[] {
    return this._facetsWithValues;
  }

  /**
   * withoutFilters = resultado do search SEM facetValueIds aplicados
   * current       = resultado do search COM os filtros atuais
   */
  update(
    withoutFilters: SearchResult,
    current: SearchResult | null,
  ): void {
    this._facetsWithValues = this.groupFacetValues(withoutFilters, current);
  }

  private groupFacetValues(
    withoutFilters: SearchResult,
    current: SearchResult | null,
  ): FacetWithValues[] {
    const facetMap = new Map<string, FacetWithValues>();

    // ids dos facetValues atualmente selecionados
    const selectedIds = new Set(
      (current?.facetValues ?? []).map((fv) => fv.facetValue.id),
    );

    for (const { facetValue } of withoutFilters.facetValues) {
      const { id, name, facet } = facetValue;
      const selected = selectedIds.has(id);

      const existing = facetMap.get(facet.id);
      if (existing) {
        existing.values.push({ id, name, selected });
      } else {
        facetMap.set(facet.id, {
          id: facet.id,
          name: facet.name,
          values: [{ id, name, selected }],
        });
      }
    }

    // podes ordenar aqui se quiseres, mas não é obrigatório
    return Array.from(facetMap.values());
  }
}
