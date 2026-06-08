import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import { useSiteContent } from "@/lib/site-content";
import album from "@/assets/story-album.jpg";

export function Origin() {
  const { lang } = useLang();
  const sc = useSiteContent();
  const c = translations.origin;
  const imgSrc = sc["origin_image_url"] || album;
  const title = lang === "en" ? (sc["origin_title_en"] || t(c.title, "en")) : (sc["origin_title_ar"] || t(c.title, "ar"));
  const p1 = lang === "en" ? (sc["origin_p1_en"] || t(c.p1, "en")) : (sc["origin_p1_ar"] || t(c.p1, "ar"));
  const p2 = lang === "en" ? (sc["origin_p2_en"] || t(c.p2, "en")) : (sc["origin_p2_ar"] || t(c.p2, "ar"));
  const pull = lang === "en" ? (sc["origin_pull_en"] || t(c.pull, "en")) : (sc["origin_pull_ar"] || t(c.pull, "ar"));
  const pullAuthor = lang === "en" ? (sc["origin_pull_author_en"] || t(c.pullAuthor, "en")) : (sc["origin_pull_author_ar"] || t(c.pullAuthor, "ar"));
  return (
    <section className="relative py-28 md:py-40">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="relative">
          <div className="absolute -inset-3 border border-gold/40" />
          <img
            src={imgSrc}
            alt=""
            loading="lazy"
            width={1600}
            height={1100}
            className="heritage-image relative h-auto w-full object-cover"
          />
        </div>

        <Reveal delay={150}>
          <div className="max-w-xl">
            <div className="eyebrow">{t(c.eyebrow, lang)}</div>
            <h2 className="mt-4 text-4xl leading-tight md:text-5xl">
              {title}
            </h2>
            <Ornament className="my-8 justify-start rtl:justify-end" />
            <p className="text-lg leading-relaxed text-foreground/85">{p1}</p>
            <p className="mt-5 text-lg leading-relaxed text-foreground/85">{p2}</p>

            <blockquote className="mt-10 border-l-2 border-gold pl-6 rtl:border-l-0 rtl:border-r-2 rtl:pl-0 rtl:pr-6">
              <p className="font-serif-display text-2xl italic leading-snug text-navy">
                {pull}
              </p>
              <footer className="mt-3 text-sm uppercase tracking-[0.22em] text-gold">
                {pullAuthor}
              </footer>
            </blockquote>
          </div>
        </Reveal>
      </div>
    </section>
  );
}