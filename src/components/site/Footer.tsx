import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";

export function Footer() {
  const { lang } = useLang();
  return (
    <footer className="border-t border-gold/20 bg-navy text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
        <div>
          <div className="font-arabic text-3xl text-gold">{t(translations.hero.nameAr, lang)}</div>
          <div className="mt-2 font-serif-display text-sm uppercase tracking-[0.28em] text-cream/80">
            {t(translations.footer.line1, lang)}
          </div>
          <p className="mt-4 italic text-cream/60">
            {t(translations.footer.line2, lang)}
          </p>
        </div>
        <div className="md:text-center">
          <div className="ornament mb-4" />
          <p className="font-serif-display italic text-cream/70">
            {lang === "en"
              ? "“A family is the first country a child knows.”"
              : "«العائلة هي أول وطنٍ يعرفه الطفل.»"}
          </p>
        </div>
        <div className="md:text-right rtl:md:text-left">
          <div className="space-y-2 font-serif-display text-sm uppercase tracking-[0.22em] text-cream/80">
            <Link to="/our-story" className="block hover:text-gold">
              {t(translations.nav.story, lang)}
            </Link>
            <Link to="/businesses" className="block hover:text-gold">
              {t(translations.nav.businesses, lang)}
            </Link>
            <Link to="/gallery" className="block hover:text-gold">
              {t(translations.nav.gallery, lang)}
            </Link>
            <Link to="/portal" className="block text-gold hover:text-cream">
              {t(translations.nav.portal, lang)}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-cream/10 px-6 py-6 text-center font-serif-display text-xs uppercase tracking-[0.28em] text-cream/50">
        © {new Date().getFullYear()} · {t(translations.footer.rights, lang)}
      </div>
    </footer>
  );
}