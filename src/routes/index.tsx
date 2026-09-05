import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/home/Hero";
import { Origin } from "@/components/home/Origin";
import { Timeline } from "@/components/home/Timeline";
import { Businesses } from "@/components/home/Businesses";
import { Values } from "@/components/home/Values";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { PortalCta } from "@/components/home/PortalCta";
import { Platform } from "@/components/home/Platform";
import { useSiteContent } from "@/lib/site-content";

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
  const sc = useSiteContent();
  const on = (k: string) => sc[k] !== "false";
  return (
    <>
      <Hero />
      {on("sec_origin") && <Origin />}
      {on("sec_platform") && <Platform />}
      {on("sec_timeline") && <Timeline />}
      {on("sec_businesses") && <Businesses />}
      {on("sec_values") && <Values />}
      {on("sec_gallery") && <GalleryPreview />}
      {on("sec_portal") && <PortalCta />}
    </>
  );
}
