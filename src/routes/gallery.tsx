import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/site/Reveal";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Ornament } from "@/components/site/Ornament";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSiteContent } from "@/lib/site-content";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import h from "@/assets/hero-heritage.jpg";
import album from "@/assets/story-album.jpg";
import b3 from "@/assets/business-3.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "The Archive — Al Bukhuf Alnahsi Family Heritage" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "The Archive — Al Bukhuf Alnahsi" },
    ],
  }),
  component: GalleryPage,
});

const staticImages = [g1, g2, g3, g4, h, album, b3];

function GalleryPage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const sc = useSiteContent();
  const c = translations.gallery;
  const [authReady, setAuthReady] = useState(false);
  const [dynamicUrls, setDynamicUrls] = useState<string[]>([]);

  // Auth gate — members and admins only
  useEffect(() => {
    if (!isSupabaseConfigured()) { void navigate({ to: "/portal" }); return; }
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (!session) { void navigate({ to: "/portal" }); return; }
      setAuthReady(true);
    });
  }, [navigate]);

  // Load images only after auth confirmed
  useEffect(() => {
    if (!authReady) return;
    getSupabase()
      .storage.from("gallery-images")
      .list("gallery", { sortBy: { column: "created_at", order: "desc" } })
      .then(({ data }) => {
        if (!data) return;
        const urls = data
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map((f) => getSupabase().storage.from("gallery-images").getPublicUrl(`gallery/${f.name}`).data.publicUrl);
        setDynamicUrls(urls);
      });
  }, [authReady]);

  const eyebrow = lang === "en" ? (sc["gallery_eyebrow_en"] || t(c.eyebrow, "en")) : (sc["gallery_eyebrow_ar"] || t(c.eyebrow, "ar"));
  const title   = lang === "en" ? (sc["gallery_title_en"]   || t(c.title,   "en")) : (sc["gallery_title_ar"]   || t(c.title,   "ar"));
  const intro   = lang === "en" ? (sc["gallery_intro_en"]   || t(c.intro,   "en")) : (sc["gallery_intro_ar"]   || t(c.intro,   "ar"));
  const bottom  = lang === "en"
    ? (sc["gallery_bottom_en"] || "The full archive — private albums, family portraits, and decades of memory — lives behind the family door.")
    : (sc["gallery_bottom_ar"] || "الأرشيف الكامل — الألبومات الخاصة، صور العائلة، وعقودٌ من الذاكرة — محفوظٌ خلف باب العائلة.");
  const viewBtn = lang === "en" ? (sc["gallery_view_en"] || t(c.view, "en")) : (sc["gallery_view_ar"] || t(c.view, "ar"));

  const allImages: Array<{ src: string }> =
    dynamicUrls.length > 0
      ? dynamicUrls.map((src) => ({ src }))
      : staticImages.map((src) => ({ src }));

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <p className="font-serif-display text-lg text-navy/50">
          {lang === "en" ? "Loading..." : "جاري التحميل..."}
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="bg-cream pt-44 pb-20 text-navy md:pt-52 md:pb-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="mt-6 text-navy text-5xl md:text-7xl">{title}</h1>
          <Ornament className="mt-8" />
          <p className="mt-6 italic text-navy/70">{intro}</p>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
            {allImages.map(({ src }, i) => (
              <Reveal
                key={i}
                delay={i * 80}
                direction={i % 3 === 0 ? "left" : i % 3 === 1 ? "up" : "right"}
                className="break-inside-avoid"
              >
                <figure className="overflow-hidden">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="heritage-image w-full transition-transform duration-[1200ms] hover:scale-[1.03]"
                  />
                </figure>
              </Reveal>
            ))}
          </div>

          <div className="mt-16 border-t border-gold/30 pt-12 text-center">
            <p className="mx-auto max-w-xl italic text-foreground/75">{bottom}</p>
            <Link to="/portal" className="btn-gold mt-8 inline-flex">
              {viewBtn}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
