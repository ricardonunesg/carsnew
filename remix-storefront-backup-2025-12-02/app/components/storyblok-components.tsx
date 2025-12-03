import type { CSSProperties } from "react";

type Blok = {
  _uid: string;
  component: string;
  [key: string]: any;
};

export function StoryblokComponent({ blok }: { blok: Blok }) {
  switch (blok.component) {
    /**************************************
     * 👉 BACKGROUND BLOCK
     **************************************/
    case "page_background": {
      const style: CSSProperties = {
        backgroundImage: blok.background_image?.filename
          ? `url(${blok.background_image.filename})`
          : undefined,
        backgroundColor: blok.background_color || undefined,
        backgroundSize: blok.background_size || "cover",
        backgroundPosition: blok.background_position || "center",
        backgroundRepeat: "no-repeat",
        width: "100%",
        minHeight: "100vh",
      };

      return (
        <section style={style}>
          {Array.isArray(blok.body) &&
            blok.body.map((nestedBlok: Blok) => (
              <StoryblokComponent key={nestedBlok._uid} blok={nestedBlok} />
            ))}
        </section>
      );
    }

    /**************************************
     * 👉 IMAGE BLOCK
     **************************************/
    case "image_block": {
      const imgStyle: CSSProperties = {
        width: "100%",
        maxHeight: "520px", // ajusta aqui se quiseres menor/maior
        objectFit: "cover",
        display: "block",
      };

      return (
        <div className="w-full overflow-hidden">
          {blok.image?.filename && (
            <img src={blok.image.filename} alt={blok.alt || ""} style={imgStyle} />
          )}
        </div>
      );
    }

    /**************************************
     * 👉 TEASER
     **************************************/
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

    /**************************************
     * 👉 GRID
     **************************************/
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

    /**************************************
     * 👉 FEATURE
     **************************************/
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

    /**************************************
     * 👉 DEFAULT
     **************************************/
    default:
      return null;
  }
}

/**************************************
 * 👉 BODY WRAPPER
 **************************************/
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

/**************************************
 * 👉 EXPORTA O COMPONENTE PAGE
 **************************************/
export { default as Page } from "./page";
