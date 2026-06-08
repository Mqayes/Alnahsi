import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { useSiteContent } from "@/lib/site-content";

const navItems = [
  { to: "/", key: "home" as const },
  { to: "/our-story", key: "story" as const },
  { to: "/businesses", key: "businesses" as const },
  { to: "/gallery", key: "gallery" as const },
  { to: "/news", key: "news" as const },
  { to: "/contact", key: "contact" as const },
];

export function Header() {
  const { lang, toggle } = useLang();
  const location = useLocation();
  const sc = useSiteContent();
  const nameAr = sc["site_name_ar"] || t(translations.hero.nameAr, lang);
  const nameEn = sc["site_name_en"] || t(translations.hero.nameEn, "en");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isHomePage = location.pathname === "/";
  const headerScrolled = isHomePage ? scrolled : true;
  const textOnDark = headerScrolled ? "text-navy" : "text-cream";
  const textSecondaryOnDark = headerScrolled ? "text-navy" : "text-gold";
  const menuBarColor = headerScrolled ? "bg-navy" : "bg-cream";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        headerScrolled
          ? "bg-parchment/92 backdrop-blur-sm border-b border-gold/20"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:py-5">
        <Link to="/" className="group flex items-center gap-3">
          <span className="font-arabic text-2xl text-gold transition-colors group-hover:text-navy">
            {nameAr}
          </span>
          <span className="hidden h-6 w-px bg-gold/40 md:block" />
          <span className={`hidden font-cinzel text-sm uppercase tracking-[0.28em] ${textOnDark} md:block`}>
            {nameEn}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => {
            const isActive =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative font-cinzel text-[13px] uppercase tracking-[0.22em] transition-colors ${
                  isActive
                    ? "text-gold"
                    : `${textOnDark} hover:text-gold`
                }`}
              >
                {t(translations.nav[item.key], lang)}
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 h-px w-6 -translate-x-1/2 bg-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toggle()}
            aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
            className={`rounded-sm border border-gold/40 px-3 py-1.5 font-cinzel text-xs uppercase tracking-[0.2em] transition-all ${
              headerScrolled
                ? "text-navy hover:bg-gold hover:text-navy"
                : "text-cream bg-navy/10 hover:bg-navy hover:text-cream"
            }`}
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>
          <Link
            to="/portal"
            className="hidden rounded-sm border border-navy/80 bg-navy px-4 py-1.5 font-cinzel text-xs uppercase tracking-[0.2em] text-cream transition-all hover:bg-gold hover:text-navy md:inline-block"
          >
            {t(translations.nav.portal, lang)}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="lg:hidden"
          >
            <div className="flex flex-col gap-1.5">
              <span className={`h-px w-6 ${menuBarColor}`} />
              <span className={`h-px w-6 ${menuBarColor}`} />
              <span className="h-px w-4 bg-gold" />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gold/20 bg-parchment/98 lg:hidden">
          <nav className="flex flex-col px-6 py-6">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="border-b border-border/60 py-3 font-cinzel text-sm uppercase tracking-[0.22em] text-navy"
              >
                {t(translations.nav[item.key], lang)}
              </Link>
            ))}
            <Link
              to="/portal"
              className="mt-4 inline-block rounded-sm bg-navy px-4 py-3 text-center font-cinzel text-xs uppercase tracking-[0.22em] text-cream"
            >
              {t(translations.nav.portal, lang)}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}