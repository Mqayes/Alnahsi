import { useEffect, useMemo, useState } from "react";

type Entry = { id: number; us: number; them: number; note?: string };
type Game = {
  target: number;
  teamA: string;
  teamB: string;
  entries: Entry[];
  wins: [number, number];
};

const KEY = "alnahsi_baloot_v1";
const load = (): Game => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Game;
  } catch {
    /* ignore */
  }
  return { target: 152, teamA: "لنا", teamB: "لهم", entries: [], wins: [0, 0] };
};

export function BalootScore({ ar }: { ar: boolean }) {
  const [g, setG] = useState<Game>(load);
  const [us, setUs] = useState("");
  const [them, setThem] = useState("");
  const [undone, setUndone] = useState<Entry[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(g));
    } catch {
      /* ignore */
    }
  }, [g]);

  const totals = useMemo(
    () =>
      g.entries.reduce((acc, e) => ({ us: acc.us + e.us, them: acc.them + e.them }), {
        us: 0,
        them: 0,
      }),
    [g.entries],
  );
  const winner =
    totals.us >= g.target && totals.us > totals.them
      ? "A"
      : totals.them >= g.target && totals.them > totals.us
        ? "B"
        : null;

  const add = (a: number, b: number, note?: string) => {
    if (!a && !b) return;
    setG((s) => ({ ...s, entries: [...s.entries, { id: Date.now(), us: a, them: b, note }] }));
    setUndone([]);
    setUs("");
    setThem("");
  };
  const undo = () =>
    setG((s) => {
      if (!s.entries.length) return s;
      const last = s.entries[s.entries.length - 1];
      setUndone((u) => [last, ...u]);
      return { ...s, entries: s.entries.slice(0, -1) };
    });
  const redo = () => {
    if (!undone.length) return;
    const [first, ...rest] = undone;
    setG((s) => ({ ...s, entries: [...s.entries, first] }));
    setUndone(rest);
  };
  const removeAt = (id: number) =>
    setG((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
  const newRound = () => {
    if (winner)
      setG((s) => ({
        ...s,
        wins: [s.wins[0] + (winner === "A" ? 1 : 0), s.wins[1] + (winner === "B" ? 1 : 0)] as [
          number,
          number,
        ],
        entries: [],
      }));
    else if (window.confirm(ar ? "إنهاء الجولة بلا فائز؟" : "End round?"))
      setG((s) => ({ ...s, entries: [] }));
    setUndone([]);
  };
  const resetAll = () => {
    if (window.confirm(ar ? "مسح كل شيء؟" : "Reset all?")) {
      setG({ target: g.target, teamA: g.teamA, teamB: g.teamB, entries: [], wins: [0, 0] });
      setUndone([]);
    }
  };

  const QUICK = [
    { l: ar ? "صن لنا" : "Sun us", a: 26, b: 0 },
    { l: ar ? "صن لهم" : "Sun them", a: 0, b: 26 },
    { l: ar ? "بلوت لنا" : "Baloot us", a: 2, b: 0 },
    { l: ar ? "بلوت لهم" : "Baloot them", a: 0, b: 2 },
    { l: ar ? "سرا لنا" : "Sira us", a: 20, b: 0 },
    { l: ar ? "سرا لهم" : "Sira them", a: 0, b: 20 },
    { l: ar ? "مية لنا" : "100 us", a: 10, b: 0 },
    { l: ar ? "مية لهم" : "100 them", a: 0, b: 10 },
  ];
  const I =
    "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-center text-lg text-navy outline-none focus:border-gold";

  return (
    <div dir={ar ? "rtl" : "ltr"} className="space-y-4">
      <div className="premium-card p-4">
        <div className="grid grid-cols-2 gap-3 text-center">
          {(
            [
              ["A", g.teamA, totals.us, g.wins[0]],
              ["B", g.teamB, totals.them, g.wins[1]],
            ] as const
          ).map(([k, nameT, tot, w]) => (
            <div
              key={k}
              className={`rounded-xl border-2 p-4 transition ${winner === k ? "border-gold bg-gold/15" : "border-gold/25 bg-white"}`}
            >
              <input
                value={nameT}
                onChange={(e) =>
                  setG((s) => ({ ...s, [k === "A" ? "teamA" : "teamB"]: e.target.value }))
                }
                className="w-full bg-transparent text-center font-arabic text-lg text-navy outline-none"
              />
              <div
                className={`hero-kufi mt-1 text-5xl ${tot >= g.target ? "text-gold" : "text-navy"}`}
              >
                {tot}
              </div>
              <div className="mt-1 text-xs text-navy/50">{ar ? `جولات: ${w}` : `Rounds: ${w}`}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-navy/60">
          <span>{ar ? "الهدف:" : "Target:"}</span>
          {[152, 101, 200].map((t) => (
            <button
              key={t}
              onClick={() => setG((s) => ({ ...s, target: t }))}
              className={`rounded-full border px-3 py-1 ${g.target === t ? "border-gold bg-gold text-navy" : "border-gold/30"}`}
            >
              {t}
            </button>
          ))}
        </div>
        {winner && (
          <div className="mt-3 rounded-lg bg-green-50 p-3 text-center font-arabic text-lg text-green-800">
            🏆 {ar ? `فاز ${winner === "A" ? g.teamA : g.teamB}` : "Winner"}
          </div>
        )}
      </div>

      <div className="premium-card space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-center text-xs text-navy/60">{g.teamA}</label>
            <input
              className={I}
              type="number"
              inputMode="numeric"
              value={us}
              onChange={(e) => setUs(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-center text-xs text-navy/60">{g.teamB}</label>
            <input
              className={I}
              type="number"
              inputMode="numeric"
              value={them}
              onChange={(e) => setThem(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <button onClick={() => add(Number(us) || 0, Number(them) || 0)} className="btn-gold w-full">
          ＋ {ar ? "إضافة النقاط" : "Add"}
        </button>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK.map((q) => (
            <button
              key={q.l}
              onClick={() => add(q.a, q.b, q.l)}
              className="rounded-lg border border-gold/30 bg-parchment px-2 py-2 text-xs text-navy hover:bg-gold hover:text-white"
            >
              {q.l}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <button
            onClick={undo}
            disabled={!g.entries.length}
            className="rounded-lg border border-gold/40 px-4 py-2 text-sm text-navy disabled:opacity-40"
          >
            ↶ {ar ? "تراجع" : "Undo"}
          </button>
          <button
            onClick={redo}
            disabled={!undone.length}
            className="rounded-lg border border-gold/40 px-4 py-2 text-sm text-navy disabled:opacity-40"
          >
            ↷ {ar ? "إعادة" : "Redo"}
          </button>
          <button
            onClick={newRound}
            className="rounded-lg border border-gold/40 px-4 py-2 text-sm text-navy"
          >
            {ar ? "جولة جديدة" : "New round"}
          </button>
          <button
            onClick={resetAll}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600"
          >
            {ar ? "مسح الكل" : "Reset"}
          </button>
        </div>
      </div>

      {g.entries.length > 0 && (
        <div className="premium-card p-4">
          <h4 className="font-arabic text-lg text-navy">{ar ? "سجل النقاط" : "History"}</h4>
          <table className="mt-2 w-full text-center text-sm">
            <thead className="text-navy/60">
              <tr>
                <th className="p-1">#</th>
                <th className="p-1">{g.teamA}</th>
                <th className="p-1">{g.teamB}</th>
                <th className="p-1"></th>
                <th className="p-1"></th>
              </tr>
            </thead>
            <tbody>
              {g.entries.map((e, i) => (
                <tr key={e.id} className="border-t border-gold/10">
                  <td className="p-1 text-navy/40">{i + 1}</td>
                  <td className="p-1 font-bold text-navy">{e.us || "—"}</td>
                  <td className="p-1 font-bold text-navy">{e.them || "—"}</td>
                  <td className="p-1 text-xs text-navy/45">{e.note ?? ""}</td>
                  <td className="p-1">
                    <button onClick={() => removeAt(e.id)} className="text-xs text-red-600">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-center text-xs text-navy/45">
        {ar
          ? "تُحفظ النتيجة على جوالك تلقائياً — أغلق الصفحة وارجع، تجدها كما هي."
          : "Saved locally."}
      </p>
    </div>
  );
}
