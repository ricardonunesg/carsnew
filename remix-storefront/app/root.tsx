import { cssBundleHref } from '@remix-run/css-bundle';
import {
  isRouteErrorResponse,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  ShouldRevalidateFunction,
  useLoaderData,
  useRouteError,
  MetaFunction,
} from '@remix-run/react';
import stylesheet from './tailwind.css';
import { Header } from './components/header/Header';
import {
  DataFunctionArgs,
  json,
  LinksFunction,
} from '@remix-run/server-runtime';
import { getCollections } from '~/providers/collections/collections';
import { activeChannel } from '~/providers/channel/channel';
import { APP_META_DESCRIPTION, APP_META_TITLE } from '~/constants';
import { useEffect, useState } from 'react';
import { CartTray } from '~/components/cart/CartTray';
import { getActiveCustomer } from '~/providers/customer/customer';
import Footer from '~/components/footer/Footer';
import { useActiveOrder } from '~/utils/use-active-order';
import { useChangeLanguage } from 'remix-i18next';
import { useTranslation } from 'react-i18next';
import { getI18NextServer } from '~/i18next.server';

export const meta: MetaFunction = () => {
  return [{ title: APP_META_TITLE }, { description: APP_META_DESCRIPTION }];
};

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

const devMode =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export const shouldRevalidate: ShouldRevalidateFunction = ({
  nextUrl,
  currentUrl,
  formAction,
}) => {
  if (currentUrl.pathname === '/sign-in') return true;
  if (currentUrl.pathname === '/account' && nextUrl.pathname === '/') return true;
  if (formAction === '/checkout/payment') return true;
  return false;
};

export type RootLoaderData = {
  activeCustomer: Awaited<ReturnType<typeof getActiveCustomer>>;
  activeChannel: Awaited<ReturnType<typeof activeChannel>>;
  collections: Awaited<ReturnType<typeof getCollections>>;
  locale: string;
};

export async function loader({ request }: DataFunctionArgs) {
  const collections = await getCollections(request, { take: 20 });
  const topLevelCollections = collections.filter(
    (collection) => collection.parent?.name === '__root_collection__',
  );
  const activeCustomer = await getActiveCustomer({ request });

  // 🔥 FORÇAR PORTUGUÊS ENQUANTO DESENVOLVES
  const locale = 'pt';

  return json(
    {
      activeCustomer,
      activeChannel: await activeChannel({ request }),
      collections: topLevelCollections,
      locale,
    },
    { headers: activeCustomer._headers }
  );
}

export default function App() {
  const [open, setOpen] = useState(false);
  const loaderData = useLoaderData<RootLoaderData>();
  const { collections } = loaderData;
  const { locale } = loaderData;
  const { i18n } = useTranslation();
  const {
    activeOrderFetcher,
    activeOrder,
    adjustOrderLine,
    removeItem,
    refresh,
  } = useActiveOrder();

  useChangeLanguage(locale);

  useEffect(() => {
    refresh();
  }, [loaderData]);

  return (
    <html lang={locale} dir={i18n.dir()} id="app">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        {/* CORRIGIDO ✔ */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />

        <Meta />
        <Links />
      </head>
      <body>
        <Header
          onCartIconClick={() => setOpen(!open)}
          cartQuantity={activeOrder?.totalQuantity ?? 0}
        />
        <main>
          <Outlet
            context={{
              activeOrderFetcher,
              activeOrder,
              adjustOrderLine,
              removeItem,
            }}
          />
        </main>

        <CartTray
          open={open}
          onClose={setOpen}
          activeOrder={activeOrder}
          adjustOrderLine={adjustOrderLine}
          removeItem={removeItem}
        />

        <ScrollRestoration />
        <Scripts />
        <Footer collections={collections} />

        {devMode && <LiveReload />}
      </body>
    </html>
  );
}

function DefaultSparseErrorPage({ tagline, headline, description }) {
  return (
    <html lang="en" id="app">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <Meta />
        <Links />
      </head>
      <body>
        <main className="flex flex-col items-center px-4 py-16 sm:py-32 text-center">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {tagline}
          </span>
          <h1 className="mt-2 font-bold text-gray-900 tracking-tight text-4xl sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 text-base text-gray-500">{description}</p>
          <div className="mt-6">
            <Link
              to="/"
              className="text-base font-medium text-primary-600 hover:text-primary-500 inline-flex gap-2"
            >
              Go back home
            </Link>
          </div>
        </main>

        <ScrollRestoration />
        <Scripts />

        {devMode && <LiveReload />}
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  let tagline = 'Oopsy daisy';
  let headline = 'Unexpected error';
  let description = "We couldn't handle your request. Please try again later.";

  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    tagline = `${error.status} error`;
    headline = error.statusText;
    description = error.data;
  }

  return (
    <DefaultSparseErrorPage
      tagline={tagline}
      headline={headline}
      description={description}
    />
  );
}

export function CatchBoundary() {
  return ErrorBoundary();
}

