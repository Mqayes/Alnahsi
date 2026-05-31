import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";

export function GalleryPreview() {
  const { lang } = useLang();
  const c = translations.gallery;
  return (
    <section className="py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">{t(c.eyebrow, lang)}</div>
            <h2 className="mt-4 text-4xl md:text-5xl">{t(c.title, lang)}</h2>
            <Ornament className="mt-6" />
            <p className="mt-6 italic text-foreground/75">{t(c.intro, lang)}</p>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-12 gap-4 md:gap-6">
          <Reveal direction="left" delay={80} className="col-span-12 md:col-span-7 row-span-2">
            <img
              src={g1}
              alt=""
              loading="lazy"
              width={1200}
              height={800}
              className="aged-photo h-full w-full object-cover"
            />
          </Reveal>
          <Reveal direction="right" delay={120} className="col-span-6 md:col-span-5">
            <img
              src={g2}
              alt=""
              loading="lazy"
              width={900}
              height={1200}
              className="aged-photo h-72 w-full object-cover md:h-[18rem]"
            />
          </Reveal>
          <Reveal direction="left" delay={160} className="col-span-6 md:col-span-5">
            <img
              src={g4}
              alt=""
              loading="lazy"
              width={900}
              height={1100}
              className="aged-photo h-72 w-full object-cover md:h-[18rem]"
            />
          </Reveal>
          <Reveal direction="right" delay={200} className="col-span-12">
            <img
              src={g3}
              alt=""
              loading="lazy"
              width={1200}
              height={900}
              className="aged-photo h-72 w-full object-cover md:h-[26rem]"
            />
          </Reveal>
        </div>

        <div className="mt-12 text-center">
          <Link to="/gallery" className="btn-ghost-gold">
            {t(c.view, lang)}
          </Link>
        </div>
      </div>
    </section>
  );
}