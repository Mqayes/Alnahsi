import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Lang } from "./translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "alnahsi.lang";
const LEGACY_STORAGE_KEY = "alajlan.lang";
const LANG_CHANGE_EVENT = "alnahsi:lang-change";

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "ar";

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ar") return stored;
  } catch {
    /* noop */
  }

  return "ar";
}

function subscribeToLang(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const onChange = () => callback();
  window.addEventListener(LANG_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(LANG_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeLang(next: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(LANG_CHANGE_EVENT));
  } catch {
    /* noop */
  }
}

function HtmlLangAttributes() {
  const { lang, dir } = useLang();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.body.classList.toggle("lang-ar", lang === "ar");
    document.body.classList.toggle("lang-en", lang === "en");
  }, [lang, dir]);

  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(
    subscribeToLang,
    readStoredLang,
    () => "ar" as Lang,
  );

  const setLang = useCallback((next: Lang) => {
    writeLang(next);
  }, []);

  const toggle = useCallback(() => {
    const next = readStoredLang() === "en" ? "ar" : "en";
    writeLang(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggle,
      dir: lang === "ar" ? "rtl" : "ltr",
    }),
    [lang, setLang, toggle],
  );

  return (
    <LanguageContext.Provider value={value}>
      <HtmlLangAttributes />
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
