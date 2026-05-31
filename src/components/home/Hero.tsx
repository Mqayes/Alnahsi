import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import hero from "@/assets/hero-heritage.jpg";

export function Hero() {
  const { lang } = useLang();
  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src={hero}
          alt=""
          width={1920}
          height={1280}
          className="aged-photo h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/30 to-parchment" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,25,47,0.6)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 pt-32 pb-20 text-center">
        <div className="animate-fade-in delay-200 eyebrow text-gold/90">
          {t(translations.hero.eyebrow, lang)}
        </div>

        <h1 className="mt-8 animate-fade-up delay-400">
          <span className="block font-arabic text-7xl leading-none text-gold drop-shadow-[0_4px_20px_rgba(212,175,55,0.3)] md:text-9xl">
            {t(translations.hero.nameAr, lang)}
          </span>
          <span className="mt-6 block font-serif-display text-3xl font-light italic tracking-wide text-cream md:text-5xl">
            {t(translations.hero.eyebrow, lang)}
          </span>
        </h1>

        <div className="ornament mx-auto mt-10 max-w-xs animate-fade-in delay-600 text-gold/70">
          <span className="text-sm">✦</span>
        </div>

        <p className="mx-auto mt-6 max-w-2xl animate-fade-up delay-600 font-serif-display text-xl italic text-cream/90 md:text-2xl">
          {t(translations.hero.tagline, lang)}
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

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gold/60 animate-shimmer">
        <svg width="20" height="32" viewBox="0 0 20 32" fill="none">
          <path d="M10 2v24M4 22l6 6 6-6" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </section>
  );
}