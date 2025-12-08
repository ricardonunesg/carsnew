import { Link, useLoaderData } from '@remix-run/react';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { SearchBar } from '~/components/header/SearchBar';
import { useRootLoader } from '~/utils/use-root-loader';
import { UserIcon } from '@heroicons/react/24/solid';
import { useScrollingUp } from '~/utils/use-scrolling-up';
import { classNames } from '~/utils/class-names';
import { useTranslation } from 'react-i18next';

export function Header({
  onCartIconClick,
  cartQuantity,
}: {
  onCartIconClick: () => void;
  cartQuantity: number;
}) {
  const data = useRootLoader();
  const isSignedIn = !!data.activeCustomer.activeCustomer?.id;
  const isScrollingUp = useScrollingUp();
  const { t } = useTranslation();

// app/components/header/Header.tsx

  return (
    <header
      className={classNames(
        // header fica sempre sticky e com z-index alto
        'sticky top-0 z-50 bg-gradient-to-r from-zinc-700 to-gray-900 shadow-lg transform shadow-xl',
        isScrollingUp ? 'animate-dropIn' : '',
      )}
    >
      <div className="max-w-6xl mx-auto p-4 flex items-center space-x-4">
        <h1 className="text-white w-10">
          <Link to="/">
<img
  src="/logocars.png"
  width={50}
  height={50}
  className="object-contain"
  alt="Cars and Vibes Logo"
/>
          </Link>
        </h1>
        <div className="flex space-x-4 hidden sm:block">
          {data.collections.map((collection) => (
            <Link
              className="text-sm md:text-base text-gray-200 hover:text-white"
              to={'/collections/' + collection.slug}
              prefetch="intent"
              key={collection.id}
            >
              {collection.name}
            </Link>
          ))}
        </div>
        <div className="flex-1 md:pr-8">
          <SearchBar></SearchBar>
        </div>
        <div className="">
          <button
            className="relative w-9 h-9 bg-white bg-opacity-20 rounded text-white p-1"
            onClick={onCartIconClick}
            aria-label="Open cart tray"
          >
            <ShoppingBagIcon></ShoppingBagIcon>
            {cartQuantity ? (
              <div className="absolute rounded-full -top-2 -right-2 bg-primary-600 min-w-6 min-h-6 flex items-center justify-center text-xs p-1">
                {cartQuantity}
              </div>
            ) : (
              ''
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
