// app/components/header/SearchBar.tsx
import {
  Form,
  useFetcher,
  useLocation,
  useNavigate,
} from '@remix-run/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SearchQuery } from '~/generated/graphql';

type AutocompleteItem = SearchQuery['search']['items'][number];

type AutocompleteResponse = {
  items: AutocompleteItem[];
};

export function SearchBar() {
  const { t } = useTranslation();
  const fetcher = useFetcher<AutocompleteResponse>();
  const navigate = useNavigate();
  const location = useLocation();

  const initialQuery = useMemo(() => {
    const url = new URL(location.pathname + location.search, "http://dummy");
    return url.searchParams.get("q") ?? "";
  }, [location]);

  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const items = fetcher.data?.items ?? [];

  // Remove duplicados (baseado em slug ou productId)
  const uniqueItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key =
        item.slug ??
        (item.productId ? String(item.productId) : "") ??
        item.productName ??
        "";
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [items]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setIsOpen(false);
      setHighlightIndex(-1);
      return;
    }
    const handle = setTimeout(() => {
      fetcher.load(`/api/search?q=${encodeURIComponent(q)}`);
    }, 180);
    return () => clearTimeout(handle);
  }, [query, fetcher]);

  useEffect(() => {
    if (query.trim().length >= 2 && uniqueItems.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  }, [uniqueItems, query]);

  const handleSelect = (item: AutocompleteItem) => {
    if (!item.slug) return;
    setIsOpen(false);
    setQuery("");
    setHighlightIndex(-1);
    navigate(`/products/${item.slug}`);
  };

  const formatPrice = (item: AutocompleteItem): string => {
    const p = item.priceWithTax;
    if (!p || !item.currencyCode) return "";

    let raw: number | null = null;
    if (p.__typename === "SinglePrice") raw = p.value;
    if (p.__typename === "PriceRange") raw = p.min;

    if (raw == null) return "";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: item.currencyCode,
    }).format(raw / 100);
  };

  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;

    const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "ig");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!isOpen || uniqueItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < uniqueItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : uniqueItems.length - 1
      );
    } else if (e.key === "Enter") {
      if (highlightIndex >= 0) {
        e.preventDefault();
        handleSelect(uniqueItems[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  };

  const showDropdown =
    isOpen && query.trim().length >= 2 && uniqueItems.length > 0;

  return (
    <div className="relative z-50 w-full max-w-xl">
      <Form method="get" action="/search" autoComplete="off" className="relative">
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("common.search")}
          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md pl-4 pr-10 py-2"
        />

        <button
          type="submit"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        >
          🔍
        </button>
      </Form>

      {showDropdown && (
        <div className="absolute mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-96 overflow-y-auto text-sm">
          <ul className="divide-y divide-gray-100">
            {uniqueItems.map((item, index) => {
              const name =
                item.productName ||
                item.productVariantName ||
                (item as any).name ||
                "";
              if (!name) return null;

              const isActive = index === highlightIndex;
              const asset = item.productAsset ?? item.productVariantAsset;

              // Fallback final: no-image.png da public/
              const src = asset?.preview || "/no-image.png";

              const key =
                item.slug ??
                (item.productId ? String(item.productId) : String(index));

              return (
                <li key={key}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setHighlightIndex(index)}
                    className={`flex w-full items-center gap-3 px-3 py-2 ${
                      isActive ? "bg-gray-100" : "bg-white"
                    } hover:bg-gray-50`}
                  >
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <img
                        src={src}
                        alt={name}
                        className="h-full w-full object-cover"
                        onError={(e) => (e.currentTarget.src = "/no-image.png")}
                      />
                    </div>

                    <div className="flex flex-1 flex-col text-left">
                      <span className="text-sm font-medium text-gray-900 line-clamp-1">
                        {highlightText(name, query)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatPrice(item)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className="w-full px-3 py-2 text-left text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 border-t border-gray-200"
            onMouseDown={(e) => {
              e.preventDefault();
              navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              setIsOpen(false);
            }}
          >
            {t("common.search")}: <strong>"{query.trim()}"</strong> – ver todos os resultados
          </button>
        </div>
      )}
    </div>
  );
}
