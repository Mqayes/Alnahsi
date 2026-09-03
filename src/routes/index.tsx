import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/home/Hero";
import { Origin } from "@/components/home/Origin";
import { Timeline } from "@/components/home/Timeline";
import { Businesses } from "@/components/home/Businesses";
import { Values } from "@/components/home/Values";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { PortalCta } from "@/components/home/PortalCta";
import { Platform } from "@/components/home/Platform";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The House of Al Bukhuf Alnahsi — A name built over generations" },
      {
        name: "description",
        content:
          "The living heritage of the Al Bukhuf Alnahsi family — origin, generations, values, and the businesses we built. A digital home for our story.",
      },
      { property: "og:title", content: "The House of Al Bukhuf Alnahsi" },
      {
        property: "og:description",
        content: "A name built over generations.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <Origin />
      <Platform />
      <Timeline />
      <Businesses />
      <Values />
      <GalleryPreview />
      <PortalCta />
    </>
  );
}
