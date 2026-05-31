import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Ornament } from "@/components/site/Ornament";
import { Reveal } from "@/components/site/Reveal";
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
      { title: "The Archive — Alnahsi Family Heritage" },
      {
        name: "description",
        content:
          "A curated public selection from the Alnahsi family archive. The full albums are reserved for family members.",
      },
      { property: "og:title", content: "The Archive — Alnahsi" },
      { property: "og:description", content: "Fragments of a long memory." },
    ],
  }),
  component: GalleryPage,
});

const images = [g1, g2, g3, g4, h, album, b3, g1, g3];

function GalleryPage() {
  const { lang } = useLang();
  const c = translations.gallery;
  return (
    <>
      <section className="bg-navy pt-44 pb-20 text-cream md:pt-52 md:pb-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="eyebrow">{t(c.eyebrow, lang)}</div>
          <h1 className="mt-6 text-cream text-5xl md:text-7xl">{t(c.title, lang)}</h1>
          <Ornament className="mt-8" />
          <p className="mt-6 italic text-cream/80">{t(c.intro, lang)}</p>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
            {images.map((src, i) => (
              <Reveal key={i} delay={(i % 3) * 80}>
                <figure className="break-inside-avoid overflow-hidden">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="aged-photo w-full transition-transform duration-[1200ms] hover:scale-[1.02]"
                  />
                </figure>
              </Reveal>
            ))}
          </div>

          <div className="mt-16 border-t border-gold/30 pt-12 text-center">
            <p className="mx-auto max-w-xl italic text-foreground/75">
              {lang === "en"
                ? "The full archive — private albums, family portraits, and decades of memory — lives behind the family door."
                : "الأرشيف الكامل — الألبومات الخاصة، صور العائلة، وعقودٌ من الذاكرة — محفوظٌ خلف باب العائلة."}
            </p>
            <Link to="/portal" className="btn-gold mt-8 inline-flex">
              {t(c.view, lang)}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}