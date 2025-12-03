// app/lib/storyblok.ts

import { storyblokInit, apiPlugin, StoryblokClient } from "@storyblok/js";

// ⚠️ Para já, usamos o token diretamente aqui.
// Depois, se quiseres, voltamos a tirar isto para o .env.
const PREVIEW_TOKEN = "BD65MHfvYoffFPCLNPHviwtt";

const { storyblokApi } = storyblokInit({
  accessToken: PREVIEW_TOKEN,
  use: [apiPlugin],
});

export const storyblok = storyblokApi as StoryblokClient;
