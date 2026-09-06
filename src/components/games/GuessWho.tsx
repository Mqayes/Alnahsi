import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchTreeRows } from "@/lib/tree-source";
import { relationBetween, type LineageRow } from "@/lib/lineage";
import type { PersonRow } from "@/components/tree/PersonCard";

type Q = { text: string; options: string[]; answer: number; hint?: string };

export function GuessWho({ ar }: { ar: boolean }) {
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [q, setQ] = useState<Q | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    void fetchTreeRows<PersonRow>().then(({ rows: r }) => setRows(r));
    try {
      setBest(Number(localStorage.getItem("alnahsi_guess_best") ?? 0));
    } catch {
      /* ignore */
    }
  }, []);

  const byId = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.id, r])) as Record<string, LineageRow>,
    [rows],
  );
  const named = useMemo(() => rows.filter((r) => r.full_name_ar || r.full_name_en), [rows]);
  const nm = (r?: PersonRow) => (r ? r.full_name_ar || r.full_name_en || "" : "");

  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  const distinct = (correct: string, pool: string[]) => {
    const opts = new Set([correct]);
    let guard = 0;
    while (opts.size < 4 && guard++ < 60) {
      const c = pick(pool);
      if (c && c !== correct) opts.add(c);
    }
    return [...opts].sort(() => Math.random() - 0.5);
  };

  const makeQ = useCallback((): Q | null => {
    if (named.length < 4) return null;
    const names = named.map(nm);
    const kinds = ["father", "relation", "city", "gen"] as const;
    for (let tries = 0; tries < 25; tries++) {
      const kind = pick([...kinds]);
      const p = pick(named);
      if (kind === "father" && p.parent_id && byId[p.parent_id]) {
        const correct = nm(byId[p.parent_id] as PersonRow);
        const opts = distinct(correct, names);
        return {
          text: ar ? `من هو والد «${nm(p)}»؟` : `Who is ${nm(p)}'s father?`,
          options: opts,
          answer: opts.indexOf(correct),
        };
      }
      if (kind === "relation") {
        const a = pick(named),
          b = pick(named);
        if (a.id === b.id) continue;
        const rel = relationBetween(a.id, b.id, byId);
        if (!rel) continue;
        const pool = ["أخوه", "ابن عمّه", "عمّه", "جدّه", "ابنه", "حفيده", "أبوه", "من ذريته"];
        const opts = distinct(rel.ar, pool);
        return {
          text: ar ? `ما صلة «${nm(b)}» بـ«${nm(a)}»؟` : `Relation of ${nm(b)} to ${nm(a)}?`,
          options: opts,
          answer: opts.indexOf(rel.ar),
        };
      }
      if (kind === "city" && p.city) {
        const cities = rows.map((r) => r.city).filter(Boolean) as string[];
        if (cities.length < 3) continue;
        const opts = distinct(p.city, cities);
        return {
          text: ar ? `أين يقيم «${nm(p)}»؟` : `Where does ${nm(p)} live?`,
          options: opts,
          answer: opts.indexOf(p.city),
        };
      }
      if (kind === "gen" && p.generation) {
        const correct = String(p.generation);
        const opts = distinct(correct, ["1", "2", "3", "4", "5", "6"]);
        return {
          text: ar ? `في أي جيل «${nm(p)}»؟` : `Which generation is ${nm(p)}?`,
          options: opts,
          answer: opts.indexOf(correct),
        };
      }
    }
    return null;
  }, [named, byId, rows, ar]);

  const next = useCallback(() => {
    setPicked(null);
    setQ(makeQ());
    setRound((r) => r + 1);
  }, [makeQ]);
  useEffect(() => {
    if (rows.length && !q) next();
  }, [rows, q, next]);

  const choose = (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    if (i === q.answer) {
      const s = score + 1;
      setScore(s);
      if (s > best) {
        setBest(s);
        try {
          localStorage.setItem("alnahsi_guess_best", String(s));
        } catch {
          /* ignore */
        }
      }
    } else setScore(0);
  };

  if (rows.length && named.length < 4)
    return (
      <div className="premium-card p-6 text-center text-navy/60">
        {ar ? "أضف ٤ أفراد على الأقل للشجرة لتبدأ اللعبة." : "Add at least 4 members."}
      </div>
    );
  if (!q) return <div className="premium-card p-6 text-center text-navy/50">…</div>;

  return (
    <div dir={ar ? "rtl" : "ltr"} className="space-y-4">
      <div className="premium-card flex items-center justify-between p-4 text-sm">
        <span className="text-navy/70">{ar ? `الجولة ${round}` : `Round ${round}`}</span>
        <span className="font-arabic text-lg text-gold">🔥 {score}</span>
        <span className="text-navy/50">{ar ? `الأفضل: ${best}` : `Best: ${best}`}</span>
      </div>

      <div className="premium-card p-6 text-center">
        <p className="font-arabic text-xl text-navy md:text-2xl">{q.text}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {q.options.map((o, i) => {
            const right = picked !== null && i === q.answer;
            const wrong = picked === i && i !== q.answer;
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={picked !== null}
                className={`rounded-xl border p-3 font-arabic text-base transition ${
                  right
                    ? "border-green-500 bg-green-50 text-green-800"
                    : wrong
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-gold/30 bg-white text-navy hover:border-gold hover:bg-parchment"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="mt-5">
            <p
              className={`font-arabic text-lg ${picked === q.answer ? "text-green-700" : "text-red-600"}`}
            >
              {picked === q.answer
                ? ar
                  ? "أحسنتِ! إجابة صحيحة 🌸"
                  : "Correct!"
                : ar
                  ? `الإجابة: ${q.options[q.answer]}`
                  : `Answer: ${q.options[q.answer]}`}
            </p>
            <button onClick={next} className="btn-gold mt-4">
              {ar ? "السؤال التالي ←" : "Next →"}
            </button>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-navy/45">
        {ar ? "لعبة تعارف بأسماء العائلة — كل إجابة تقرّبك من أهلك 🤍" : "Learn your family names"}
      </p>
    </div>
  );
}
