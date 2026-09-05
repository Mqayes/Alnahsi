import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { useSiteContent } from "@/lib/site-content";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { NewsTicker } from "@/components/site/NewsTicker";

const NAV_ALL = [
  { to: "/", key: "home" as const },
  { to: "/our-story", key: "story" as const },
  { to: "/businesses", key: "businesses" as const },
  { to: "/gallery", key: "gallery" as const },
  { to: "/tree", key: "tree" as const },
  { to: "/news", key: "news" as const },
  { to: "/blog", key: "blog" as const },
  { to: "/occasions", key: "occasions" as const },
  { to: "/contact", key: "contact" as const },
];

export function Header() {
  const { lang, toggle } = useLang();
  const location = useLocation();
  const sc = useSiteContent();
  const PAGE_KEY: Record<string, string> = {
    story: "page_story",
    tree: "page_tree",
    businesses: "page_businesses",
    gallery: "page_gallery",
    news: "page_news",
    contact: "page_contact",
  };
  const navItems = NAV_ALL.filter((n) => sc[PAGE_KEY[n.key] ?? ""] !== "false");
  const nameAr = sc["site_name_ar"] || t(translations.hero.nameAr, lang);
  const nameEn = sc["site_name_en"] || t(translations.hero.nameEn, "en");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [menu, setMenu] = useState(false);

  const signOut = async () => {
    await getSupabase().auth.signOut();
    setMenu(false);
    window.location.href = "/";
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabase();
    const check = async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      setSignedIn(Boolean(session));
      if (!session) {
        setIsStaff(false);
        return;
      }
      const { data } = await sb
        .from("profiles")
        .select("role, full_name")
        .eq("id", session.user.id)
        .maybeSingle();
      setIsStaff(["owner", "admin", "moderator"].includes(data?.role ?? ""));
      setUserName(data?.full_name || (lang === "en" ? "Member" : "عضو"));
    };
    void check();
    const { data: sub } = sb.auth.onAuthStateChange(() => {
      void check();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

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
      <NewsTicker />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:py-5">
        <Link to="/" className="group flex items-center gap-3">
          <span className="hero-kufi text-[1.35rem] text-gold transition-colors group-hover:text-navy md:text-2xl">
            {nameAr}
          </span>
          <span className="hidden h-6 w-px bg-gold/40 md:block" />
          <span
            className={`hidden font-cinzel text-sm uppercase tracking-[0.28em] ${textOnDark} md:block`}
          >
            {nameEn}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => {
            const isActive =
              item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative font-cinzel text-[13px] uppercase tracking-[0.22em] transition-colors ${
                  isActive ? "text-gold" : `${textOnDark} hover:text-gold`
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
          {signedIn && (
            <Link
              to="/my-blog"
              className="hidden rounded-sm bg-gold px-3 py-1.5 text-xs font-semibold text-navy transition-all hover:bg-gold/85 lg:inline-block"
            >
              ⚙ {lang === "en" ? "My space" : "مساحتي"}
            </Link>
          )}
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
          {signedIn ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenu((m) => !m)}
                className="flex items-center gap-2 rounded-lg border border-gold/50 bg-white/10 px-3 py-1.5 text-xs font-bold text-gold backdrop-blur hover:bg-gold hover:text-navy"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[11px] text-navy">
                  {userName.slice(0, 1)}
                </span>
                <span className="max-w-[140px] truncate">{userName}</span>
                <span className="text-[10px]">▾</span>
              </button>
              {menu && (
                <div
                  className="absolute end-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gold/30 bg-white text-navy shadow-2xl"
                  dir={lang === "en" ? "ltr" : "rtl"}
                >
                  {isStaff && (
                    <Link
                      to="/admin"
                      onClick={() => setMenu(false)}
                      className="block px-4 py-2.5 text-sm hover:bg-parchment"
                    >
                      ⚙ {lang === "en" ? "Dashboard" : "لوحة التحكم"}
                    </Link>
                  )}
                  <Link
                    to="/family"
                    onClick={() => setMenu(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-parchment"
                  >
                    👤 {lang === "en" ? "My portal" : "لوحتي الخاصة"}
                  </Link>
                  <Link
                    to="/tree"
                    onClick={() => setMenu(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-parchment"
                  >
                    🌳 {lang === "en" ? "Family tree" : "شجرة العائلة"}
                  </Link>
                  <button
                    onClick={() => void signOut()}
                    className="block w-full px-4 py-2.5 text-start text-sm text-red-600 hover:bg-red-50"
                  >
                    ⎋ {lang === "en" ? "Sign out" : "تسجيل الخروج"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/portal"
                className="rounded-lg border border-gold/60 bg-white/10 px-3 py-1.5 text-xs font-bold text-gold backdrop-blur hover:bg-gold hover:text-navy"
              >
                {lang === "en" ? "Sign in" : "دخول"}
              </Link>
              <Link
                to="/tree"
                search={{ join: "1" }}
                className="rounded-lg bg-gradient-to-br from-[#E2BC4A] to-[#B8860B] px-4 py-2 text-xs font-bold text-navy shadow-[0_6px_18px_rgba(207,169,58,.4)] transition-all hover:brightness-105"
              >
                {lang === "en" ? "Join the family" : "انضم للعائلة"}
              </Link>
            </div>
          )}
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
                className="border-b border-gold/20 py-3.5 font-arabic-body text-base font-semibold text-navy"
              >
                {t(translations.nav[item.key], lang)}
              </Link>
            ))}
            {signedIn ? (
              <>
                <div className="mt-4 rounded-lg border border-gold/30 bg-white/60 px-3 py-2 text-sm text-navy">
                  👤 {userName}
                </div>
                {isStaff && (
                  <Link to="/admin" className="btn-gold mt-3">
                    {lang === "en" ? "Dashboard" : "لوحة التحكم"}
                  </Link>
                )}
                <Link to="/family" className="btn-outline-navy mt-2">
                  {lang === "en" ? "My portal" : "لوحتي الخاصة"}
                </Link>
                <button
                  onClick={() => void signOut()}
                  className="mt-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600"
                >
                  {lang === "en" ? "Sign out" : "تسجيل الخروج"}
                </button>
              </>
            ) : (
              <>
                <Link to="/portal" className="btn-gold mt-4">
                  {lang === "en" ? "Sign in" : "دخول"}
                </Link>
                <Link to="/tree" search={{ join: "1" }} className="btn-outline-navy mt-2">
                  {lang === "en" ? "Join the family" : "انضم للعائلة"}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
