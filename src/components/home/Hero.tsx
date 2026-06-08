import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { useSiteContent } from "@/lib/site-content";
import hero from "@/assets/hero-heritage.jpg";

export function Hero() {
  const { lang } = useLang();
  const sc = useSiteContent();
  const heroSrc = sc["hero_image_url"] || hero;
  const nameAr = sc["site_name_ar"] || t(translations.hero.nameAr, lang);
  const nameEn = sc["site_name_en"] || t(translations.hero.nameEn, "en");
  const eyebrow = lang === "en" ? (sc["hero_eyebrow_en"] || t(translations.hero.eyebrow, "en")) : (sc["hero_eyebrow_ar"] || t(translations.hero.eyebrow, "ar"));
  const tagline = lang === "en"
    ? (sc["hero_tagline_en"] || t(translations.hero.tagline, "en"))
    : (sc["hero_tagline_ar"] || t(translations.hero.tagline, "ar"));
  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroSrc}
          alt=""
          width={1920}
          height={1280}
          className="heritage-image h-full w-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/30 to-parchment" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,25,47,0.6)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-32 pb-20 text-center">
        <div className="animate-fade-in delay-200 eyebrow text-gold/90">
          {eyebrow}
        </div>

        <h1 className="mt-8 animate-fade-up delay-400">
          <span className="block font-arabic text-7xl leading-none text-gold drop-shadow-[0_4px_20px_rgba(212,175,55,0.3)] md:text-9xl">
            {nameAr}
          </span>
          {lang === "en" ? (
            <span className="mt-6 block font-serif-display text-3xl font-light italic tracking-wide text-cream md:text-5xl">
              {nameEn}
            </span>
          ) : (
            <span className="mt-6 block font-arabic text-3xl font-light text-cream md:text-5xl">
              {eyebrow}
            </span>
          )}
        </h1>

        <div className="ornament mx-auto mt-10 max-w-xs animate-fade-in delay-600 text-gold/70">
          <span className="text-sm">✦</span>
        </div>

        <p className="mx-auto mt-6 max-w-2xl animate-fade-up delay-600 font-serif-display text-xl italic text-cream/90 md:text-2xl">
          {tagline}
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 animate-fade-up delay-800">
          <Link to="/our-story" className="btn-gold">
            {t(translations.hero.cta, lang)}
          </Link>
          <Link to="/portal" className="btn-ghost-gold">
            {t(translations.hero.ctaPortal, lang)}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-gold/60 animate-shimmer">
        <svg width="20" height="32" viewBox="0 0 20 32" fill="none">
          <path d="M10 2v24M4 22l6 6 6-6" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </section>
  );
}