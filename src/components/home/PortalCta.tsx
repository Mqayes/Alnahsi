import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import { useSiteContent } from "@/lib/site-content";
import door from "@/assets/gallery-2.jpg";

export function PortalCta() {
  const { lang } = useLang();
  const sc = useSiteContent();
  const c = translations.portalCta;
  const eyebrow = lang === "en" ? (sc["portal_eyebrow_en"] || t(c.eyebrow, "en")) : (sc["portal_eyebrow_ar"] || t(c.eyebrow, "ar"));
  const title   = lang === "en" ? (sc["portal_title_en"]   || t(c.title,   "en")) : (sc["portal_title_ar"]   || t(c.title,   "ar"));
  const body    = lang === "en" ? (sc["portal_body_en"]    || t(c.body,    "en")) : (sc["portal_body_ar"]    || t(c.body,    "ar"));
  const login   = lang === "en" ? (sc["portal_login_en"]   || t(c.login,   "en")) : (sc["portal_login_ar"]   || t(c.login,   "ar"));
  const request = lang === "en" ? (sc["portal_request_en"] || t(c.request, "en")) : (sc["portal_request_ar"] || t(c.request, "ar"));
  return (
    <section className="relative isolate overflow-hidden bg-parchment py-32 text-navy md:py-44">
      <img
        src={door}
        alt=""
        loading="lazy"
        className="absolute inset-0 z-0 h-full w-full object-cover opacity-[0.12]"
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-parchment/90 via-parchment/95 to-parchment" />
      <Reveal>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="mt-6 text-navy text-4xl md:text-6xl">{title}</h2>
          <Ornament className="mt-8" />
          <p className="mx-auto mt-8 max-w-2xl text-lg italic leading-relaxed text-navy/70">
            {body}
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link to="/portal" className="btn-gold">
              {login}
            </Link>
            <Link to="/portal" className="btn-ghost-gold">
              {request}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
