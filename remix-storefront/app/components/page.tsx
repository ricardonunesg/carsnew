// app/components/page.tsx
import * as React from 'react';
// Importa a função de renderização centralizada (que está no outro ficheiro)
import { StoryblokBody } from './storyblok-components'; 

const Page = ({ blok }) => {
  if (!blok) return null;

  // O bloco 'Page' tem o array de blocos internos no campo 'body'.
  return (
    <main>
      <StoryblokBody body={blok.body} />
    </main>
  );
};

export default Page;
