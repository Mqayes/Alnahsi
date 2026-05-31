import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";

export function Values() {
  const { lang } = useLang();
  const c = translations.values;
  return (
    <section className="relative bg-cream py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">{t(c.eyebrow, lang)}</div>
            <h2 className="mt-4 text-4xl md:text-5xl">{t(c.title, lang)}</h2>
            <Ornament className="mt-6" />
          </div>
        </Reveal>

        <div className="mt-20 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-5">
          {c.items.map((item, i) => (
            <Reveal key={item.ar} delay={i * 100}>
              <div className="flex h-full flex-col items-center bg-cream p-10 text-center transition-colors hover:bg-parchment">
                <span className="font-arabic text-5xl text-gold md:text-6xl">{item.ar}</span>
                <h3 className="mt-6 font-serif-display text-lg uppercase tracking-[0.22em] text-navy">
                  {t(item.en, lang)}
                </h3>
                <p className="mt-4 text-sm italic leading-relaxed text-foreground/70">
                  {t(item.desc, lang)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}