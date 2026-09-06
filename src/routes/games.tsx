import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Ornament } from "@/components/site/Ornament";
import { GuessWho } from "@/components/games/GuessWho";
import { BalootScore } from "@/components/games/BalootScore";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "مجلس العائلة — ألعاب آل بوخف الناهسي" },
      {
        name: "description",
        content: "لعبة «من هذا؟» لمعرفة أفراد العائلة، وحاسبة البلوت لمجالس الشباب.",
      },
    ],
  }),
  component: GamesPage,
});

function GamesPage() {
  const { lang } = useLang();
  const ar = lang !== "en";
  const [tab, setTab] = useState<"guess" | "baloot">("guess");

  return (
    <main dir={ar ? "rtl" : "ltr"} className="min-h-screen bg-parchment px-4 pb-20 pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow-pill">{ar ? "مجلس العائلة" : "Family majlis"}</span>
        <h1 className="mt-4 font-arabic text-4xl text-navy md:text-5xl">
          {ar ? "ألعاب العائلة" : "Family games"}
        </h1>
        <Ornament className="mt-4" />
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setTab("guess")}
            className={`rounded-full border px-5 py-2 text-sm ${tab === "guess" ? "border-gold bg-gold text-navy" : "border-gold/30 bg-white text-navy/70"}`}
          >
            🌸 {ar ? "من هذا؟" : "Who is this?"}
          </button>
          <button
            onClick={() => setTab("baloot")}
            className={`rounded-full border px-5 py-2 text-sm ${tab === "baloot" ? "border-gold bg-gold text-navy" : "border-gold/30 bg-white text-navy/70"}`}
          >
            🃏 {ar ? "حاسبة البلوت" : "Baloot score"}
          </button>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-3xl">
        {tab === "guess" ? <GuessWho ar={ar} /> : <BalootScore ar={ar} />}
      </div>
    </main>
  );
}
