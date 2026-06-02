import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import door from "@/assets/gallery-2.jpg";

export function PortalCta() {
  const { lang } = useLang();
  const c = translations.portalCta;
  return (
    <section className="relative isolate overflow-hidden bg-navy py-32 text-cream md:py-44">
      <img
        src={door}
        alt=""
        loading="lazy"
        className="absolute inset-0 z-0 h-full w-full object-cover opacity-30"
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-navy/85 via-navy/90 to-navy" />
      <Reveal>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <div className="eyebrow">{t(c.eyebrow, lang)}</div>
          <h2 className="mt-6 text-cream text-4xl md:text-6xl">{t(c.title, lang)}</h2>
          <Ornament className="mt-8" />
          <p className="mx-auto mt-8 max-w-2xl text-lg italic leading-relaxed text-cream/80">
            {t(c.body, lang)}
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link to="/portal" className="btn-gold">
              {t(c.login, lang)}
            </Link>
            <Link to="/portal" className="btn-ghost-gold">
              {t(c.request, lang)}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}