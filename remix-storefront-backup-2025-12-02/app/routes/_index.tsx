// app/routes/_index.tsx

import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useStoryblokState, StoryblokComponent } from "@storyblok/react";

import { storyblok } from "../lib/storyblok";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const isDraft = url.searchParams.has("_storyblok");

  const slug = "home"; // ajusta se o slug no Storyblok for outro

  const { data } = await storyblok.get(`cdn/stories/${slug}`, {
    version: isDraft ? "draft" : "published",
  });

  return {
    story: data.story,
    isDraft,
  };
}

export default function HomePage() {
  const { story, isDraft } = useLoaderData() as {
    story: any;
    isDraft: boolean;
  };

  const liveStory = useStoryblokState(story, {
    version: isDraft ? "draft" : "published",
  });

  if (!liveStory) {
    return <div>Carregando conteúdo...</div>;
  }

  return <StoryblokComponent blok={liveStory.content} />;
}
