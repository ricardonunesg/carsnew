// app/root.tsx

import { Outlet, Scripts, Link, Form } from "react-router";
import { storyblokInit, apiPlugin } from "@storyblok/react";
import Page from "./components/page";

const PREVIEW_TOKEN = "BD65MHfvYoffFPCLNPHviwtt";

storyblokInit({
  accessToken: PREVIEW_TOKEN,
  use: [apiPlugin],
  components: {
    page: Page,
  },
});

export default function Root() {
  return (
    <html lang="pt">
      <head>
        <meta charSet="utf-8" />
        <title>Cars & Vibes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body className="bg-black text-slate-100">

        {/* ---------- GLOBAL HEADER (para todas as páginas) ---------- */}
        <header className="w-full border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">

            {/* LOGO / HOME */}
            <Link to="/" className="text-lg font-semibold text-emerald-400">
              Cars & Vibes
            </Link>

            {/* SEARCH BAR */}
            <Form method="get" action="/search" className="flex gap-2">
              <input
                type="text"
                name="q"
                placeholder="Pesquisar produtos…"
                className="w-56 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100 outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                className="rounded-md border border-emerald-500 bg-emerald-500 px-4 py-1 text-sm font-semibold text-black hover:bg-emerald-400"
              >
                Search
              </button>
            </Form>

          </div>
        </header>
        {/* ---------- FIM DO HEADER ---------- */}


        {/* Aqui aparecem todas as páginas */}
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
