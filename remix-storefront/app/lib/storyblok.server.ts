import { storyblokInit, apiPlugin, StoryblokClient } from "@storyblok/js";

const STORYBLOK_TOKEN =
  process.env.STORYBLOK_TOKEN ?? "YOUR_STORYBLOK_PREVIEW_TOKEN";

if (!STORYBLOK_TOKEN || STORYBLOK_TOKEN === "YOUR_STORYBLOK_PREVIEW_TOKEN") {
  console.warn(
    "[Storyblok] WARNING: STORYBLOK_TOKEN não definido. Define em produção!"
  );
}

const { storyblokApi } = storyblokInit({
  accessToken: STORYBLOK_TOKEN,
  use: [apiPlugin],
});

export const storyblok: StoryblokClient | null = storyblokApi;
