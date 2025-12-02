// app/root.tsx

import { Outlet, Scripts } from "react-router";
import { storyblokInit, apiPlugin } from "@storyblok/react";

// Importa os componentes Storyblok que existem
import Page from "./components/page";

// Token de Preview do Storyblok (para o Visual Editor)
const PREVIEW_TOKEN = "BD65MHfvYoffFPCLNPHviwtt";

// Inicializa o Storyblok Bridge no lado do cliente
storyblokInit({
  accessToken: PREVIEW_TOKEN,
  use: [apiPlugin],
  components: {
    page: Page, // mapeia o bloco "page" do Storyblok para o componente Page
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
      <body>
        {/* As rotas são renderizadas aqui */}
        <Outlet />
        {/* Scripts de hidratação do React Router */}
        <Scripts />
      </body>
    </html>
  );
}
