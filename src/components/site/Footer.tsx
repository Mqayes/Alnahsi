import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { useSiteContent } from "@/lib/site-content";

export function Footer() {
  const { lang } = useLang();
  const sc = useSiteContent();
  const nameAr = sc["site_name_ar"] || t(translations.hero.nameAr, lang);
  const line1 =
    lang === "en"
      ? sc["footer_line1_en"] || t(translations.footer.line1, "en")
      : sc["footer_line1_ar"] || t(translations.footer.line1, "ar");
  const line2 =
    lang === "en"
      ? sc["footer_line2_en"] || t(translations.footer.line2, "en")
      : sc["footer_line2_ar"] || t(translations.footer.line2, "ar");
  const quote =
    lang === "en"
      ? sc["footer_quote_en"] || "“A family is the first country a child knows.”"
      : sc["footer_quote_ar"] || "«العائلة هي أول وطنٍ يعرفه الطفل.»";
  const rights =
    lang === "en"
      ? sc["footer_rights_en"] || t(translations.footer.rights, "en")
      : sc["footer_rights_ar"] || t(translations.footer.rights, "ar");
  return (
    <footer className="border-t border-gold/25 bg-cream text-navy">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
        <div>
          <div className="font-arabic text-3xl text-gold">{nameAr}</div>
          <div className="mt-2 font-serif-display text-sm uppercase tracking-[0.28em] text-navy/70">
            {line1}
          </div>
          <p className="mt-4 italic text-navy/55">{line2}</p>
        </div>
        <div className="md:text-center">
          <div className="ornament mb-4" />
          <p className="font-serif-display italic text-navy/60">{quote}</p>
        </div>
        <div className="md:text-right rtl:md:text-left">
          <div className="space-y-2 font-serif-display text-sm uppercase tracking-[0.22em] text-navy/70">
            <Link to="/our-story" className="block hover:text-gold">
              {t(translations.nav.story, lang)}
            </Link>
            <Link to="/businesses" className="block hover:text-gold">
              {t(translations.nav.businesses, lang)}
            </Link>
            <Link to="/gallery" className="block hover:text-gold">
              {t(translations.nav.gallery, lang)}
            </Link>
            <Link to="/news" className="block hover:text-gold">
              {t(translations.nav.news, lang)}
            </Link>
            <Link to="/contact" className="block hover:text-gold">
              {t(translations.nav.contact, lang)}
            </Link>
            <a href="/app" className="block transition-colors hover:text-gold">
              📲 {lang === "en" ? "Get the app" : "حمّل التطبيق"}
            </a>
            <Link to="/portal" className="block text-gold hover:text-navy">
              {t(translations.nav.portal, lang)}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-gold/15 px-6 py-6 text-center font-serif-display text-xs uppercase tracking-[0.28em] text-navy/45">
        © {new Date().getFullYear()} · {rights}
      </div>
    </footer>
  );
}
