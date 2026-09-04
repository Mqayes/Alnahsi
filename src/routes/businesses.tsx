import { createFileRoute } from "@tanstack/react-router";
import { Businesses } from "@/components/home/Businesses";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Ornament } from "@/components/site/Ornament";

export const Route = createFileRoute("/businesses")({
  head: () => ({
    meta: [
      { title: "The Legacy We Built — Al Bukhuf Alnahsi" },
      {
        name: "description",
        content:
          "The houses our family built across a century — trade, hospitality, logistics, property, and the family foundation.",
      },
      { property: "og:title", content: "The Legacy We Built — Al Bukhuf Alnahsi" },
      { property: "og:description", content: "Six houses, one name." },
    ],
  }),
  component: BusinessesPage,
});

function BusinessesPage() {
  const { lang } = useLang();
  return (
    <>
      <section className="bg-cream pt-44 pb-24 text-navy md:pt-52 md:pb-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="eyebrow">{lang === "en" ? "The Legacy" : "الإرث"}</div>
          <h1 className="mt-6 text-navy text-5xl md:text-7xl">
            {lang === "en" ? "Houses we built." : "بيوتٌ بنيناها."}
          </h1>
          <Ornament className="mt-8" />
          <p className="mx-auto mt-6 max-w-2xl text-lg italic text-navy/70">
            {lang === "en"
              ? "Each enterprise carries a name, a year, and a story. The fuller details live behind the family door."
              : "كلُّ مؤسسةٍ تحمل اسماً وسنةً وقصة. التفاصيل الكاملة تبقى خلف باب العائلة."}
          </p>
        </div>
      </section>
      <Businesses />
    </>
  );
}
