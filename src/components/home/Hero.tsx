import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { useSiteContent } from "@/lib/site-content";
import hero from "@/assets/hero-heritage.webp";

export function Hero() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const sc = useSiteContent();
  const heroSrc = sc["hero_image_url"] || hero;
  const nameAr = sc["site_name_ar"] || t(translations.hero.nameAr, lang);
  const nameEn = sc["site_name_en"] || t(translations.hero.nameEn, "en");

  return (
    <section className="relative isolate flex min-h-[100svh] items-end justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroSrc}
          alt=""
          width={1920}
          height={1280}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-center saturate-[1.08] contrast-[1.08]"
        />
        <div className="hero-scrim absolute inset-0" />
        <div className="hero-glow" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-12 pt-36 text-center md:pb-20">
        <div className="hero-nasab animate-fade-in delay-200">
          <b>{ar ? "خثعم" : "Khath'am"}</b>
          <i>◆</i>
          <b>{ar ? "ناهس شهران" : "Nahas Shahran"}</b>
          <i>◆</i>
          <b>{ar ? "المزارقة" : "Al-Mazarigah"}</b>
          <i>◆</i>
          <b>{ar ? "آل بوخف" : "Al Bukhuf"}</b>
        </div>

        <h1 className="mt-7 animate-fade-up delay-400">
          <span className="hero-kufi hero-shine block text-[3.4rem] sm:text-7xl md:text-[6.5rem]">
            {ar ? nameAr : nameEn}
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl animate-fade-up delay-600 font-arabic text-xl leading-relaxed text-[#FFF8E6] drop-shadow-[0_2px_12px_rgba(0,0,0,.6)] md:text-2xl">
          {ar
            ? "بيتٌ بُني عبر الأجيال — من الحفائر وبلاد ناهس إلى الرياض"
            : "A house built across generations — from Al-Hafayer to Riyadh"}
        </p>

        <div className="mt-40 flex flex-col items-stretch sm:mt-28 justify-center gap-3 animate-fade-up delay-800 sm:flex-row sm:items-center">
          <Link to="/tree" className="btn-gold">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="5" r="2" />
              <circle cx="6" cy="19" r="2" />
              <circle cx="18" cy="19" r="2" />
              <path d="M12 7v4M12 11H6v6M12 11h6v6" />
            </svg>
            {ar ? "استكشف شجرة العائلة" : "Explore the Family Tree"}
          </Link>
          <Link to="/portal" className="btn-ghost-gold">
            {ar ? "بوابة العائلة" : "Family Portal"}
          </Link>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="scroll-cue" />
        </div>
      </div>
    </section>
  );
}
