import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import album from "@/assets/story-album.jpg";

export function Origin() {
  const { lang } = useLang();
  const c = translations.origin;
  return (
    <section className="relative py-28 md:py-40">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <Reveal direction="left">
          <div className="relative">
            <div className="absolute -inset-3 border border-gold/40" />
            <img
              src={album}
              alt=""
              loading="lazy"
              width={1600}
              height={1100}
              className="aged-photo relative h-auto w-full object-cover"
            />
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="max-w-xl">
            <div className="eyebrow">{t(c.eyebrow, lang)}</div>
            <h2 className="mt-4 text-4xl leading-tight md:text-5xl">
              {t(c.title, lang)}
            </h2>
            <Ornament className="my-8 justify-start rtl:justify-end" />
            <p className="text-lg leading-relaxed text-foreground/85">
              {t(c.p1, lang)}
            </p>
            <p className="mt-5 text-lg leading-relaxed text-foreground/85">
              {t(c.p2, lang)}
            </p>

            <blockquote className="mt-10 border-l-2 border-gold pl-6 rtl:border-l-0 rtl:border-r-2 rtl:pl-0 rtl:pr-6">
              <p className="font-serif-display text-2xl italic leading-snug text-navy">
                {t(c.pull, lang)}
              </p>
              <footer className="mt-3 text-sm uppercase tracking-[0.22em] text-gold">
                {t(c.pullAuthor, lang)}
              </footer>
            </blockquote>
          </div>
        </Reveal>
      </div>
    </section>
  );
}