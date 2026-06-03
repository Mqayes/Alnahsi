import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import { Timeline } from "@/components/home/Timeline";
import patriarch from "@/assets/patriarch.jpg";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: "Our Story — The House of Al Bukhuf Alnahsi" },
      {
        name: "description",
        content:
          "The long-form story of the Al Bukhuf Alnahsi family — from a single household in old Riyadh to four generations across continents.",
      },
      { property: "og:title", content: "Our Story — The House of Al Bukhuf Alnahsi" },
      { property: "og:description", content: "How a single household became a name." },
    ],
  }),
  component: StoryPage,
});

function StoryPage() {
  const { lang } = useLang();
  const c = translations.story;
  return (
    <>
      <section className="relative bg-navy pt-44 pb-24 text-cream md:pt-52 md:pb-32">
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,#D4AF37_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="eyebrow">{lang === "en" ? "A Family Record" : "سجلٌ عائلي"}</div>
          <h1 className="mt-6 text-cream text-5xl md:text-7xl">{t(c.title, lang)}</h1>
          <Ornament className="mt-8" />
          <p className="mt-6 text-lg italic text-cream/80">{t(c.sub, lang)}</p>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="relative lg:sticky lg:top-32">
            <div className="absolute -inset-2 border border-gold/40" />
            <img
              src={patriarch}
              alt=""
              loading="lazy"
              width={1000}
              height={1300}
              className="heritage-image relative h-auto w-full"
            />
            <div className="mt-4 text-center font-serif-display text-xs uppercase tracking-[0.22em] text-gold">
              {lang === "en" ? "The Patriarch · c. 1925" : "الجدّ الأكبر · نحو ١٩٢٥"}
            </div>
          </div>

          <div className="space-y-16">
            {c.sections.map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <article>
                  <h2 className="text-3xl md:text-4xl">{t(s.h, lang)}</h2>
                  <Ornament className="my-6 justify-start rtl:justify-end" />
                  <p className="text-lg leading-relaxed text-foreground/85">{t(s.p, lang)}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Timeline />
    </>
  );
}