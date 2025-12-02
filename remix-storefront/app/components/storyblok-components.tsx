import type { ReactNode } from "react";
import { Link } from "react-router";

type Blok = {
  _uid: string;
  component: string;
  [key: string]: any;
};

export function StoryblokComponent({ blok }: { blok: Blok }) {
  switch (blok.component) {
    case "teaser":
      return (
        <section className="border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 md:px-6 lg:px-8">
            <span className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-300">
              Cars &amp; Vibes · Storefront
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl lg:text-6xl">
              {blok.headline || "Título da página"}
            </h1>
            {blok.subheadline && (
              <p className="max-w-xl text-base text-slate-300 md:text-lg">
                {blok.subheadline}
              </p>
            )}
          </div>
        </section>
      );

    case "grid":
      return (
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-50">
            {blok.headline || "Secção"}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {blok.columns?.map((col: Blok) => (
              <StoryblokComponent key={col._uid} blok={col} />
            ))}
          </div>
        </section>
      );

    case "feature":
      return (
        <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-slate-50">
            {blok.name || "Feature"}
          </h3>
          {blok.description && (
            <p className="mt-1 text-xs text-slate-400">{blok.description}</p>
          )}
        </article>
      );

    default:
      return null;
  }
}

export function StoryblokBody({ body }: { body: Blok[] }) {
  if (!body || !Array.isArray(body)) return null;
  return (
    <>
      {body.map((blok) => (
        <StoryblokComponent key={blok._uid} blok={blok} />
      ))}
    </>
  );
}
// Exporta os componentes individuais que não estão no switch case, como o Page.
export { default as Page } from './page';
