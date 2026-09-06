import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Ornament } from "@/components/site/Ornament";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { composeFullName, chainLabel, nextGeneration, type LineageRow } from "@/lib/lineage";
import { setGenerationBase, generationOf } from "@/lib/lineage";
import { PanZoom } from "@/components/tree/PanZoom";
import { AddToTreeModal } from "@/components/tree/AddToTreeModal";
import { PersonCard, type PersonRow } from "@/components/tree/PersonCard";
import { RelationFinder } from "@/components/tree/RelationFinder";
import { useSiteContent } from "@/lib/site-content";

export const Route = createFileRoute("/tree")({
  validateSearch: (s: Record<string, unknown>): { join?: string } =>
    typeof s.join === "string" ? { join: s.join } : {},
  head: () => ({
    meta: [
      { title: "شجرة العائلة التفاعلية — آل بوخف الناهسي" },
      {
        name: "description",
        content: "شجرة نسب آل بوخف الناهسي التفاعلية — ابحث، تصفّح الأجيال، وأضف اسمك.",
      },
    ],
  }),
  component: TreePage,
});

/* ─── Data model ─────────────────────────────────────────────── */
type Person = {
  id: string;
  ar: string;
  en: string;
  year?: string;
  place?: string;
  note?: { ar: string; en: string };
  children?: Person[];
};

const ROOT: Person = {
  id: "root",
  ar: "آل بوخف الناهسي",
  en: "Al Bukhuf Alnahsi",
  year: "571 م",
  place: "الحفائر · بلاد ناهس القاعة",
  note: {
    ar: "خثعم ← ناهس شهران ← المزارقة ← آل بوخف. نشأ الأجداد في الحفائر بخيلهم وأنعامهم متنقلين بين ضواحي بلاد ناهس القاعة.",
    en: "Khath'am → Nahas Shahran → Al-Mazarigah → Al Bukhuf. Our ancestors rose in Al-Hafayer with their horses and herds.",
  },
  children: [
    {
      id: "g2",
      ar: "سعود مفلح آل بوخف",
      en: "Saud Muflih Al Bukhuf",
      year: "1834 م",
      place: "تندحه · بلاد ناهس",
      note: {
        ar: "وسّع التجارة في الأنعام والزراعة في تندحه. صاحب مزارع وأبل وخيل، سخّر ماله وسمعته لأهله وجيرانه وعابر السبيل.",
        en: "Expanded livestock trade and farming in Tanduhah; devoted his wealth and name to his people and travelers.",
      },
      children: [
        {
          id: "g3",
          ar: "الشيخ سعود فهد آل بوخف",
          en: "Sheikh Saud Fahd Al Bukhuf",
          year: "1940 م",
          place: "تندحه · القصيم · تبوك · الرياض",
          note: {
            ar: "أسّس مزارع في القصيم وتبوك، ثم نواة أول استقرار للعائلة في الرياض — نقطة التحوّل في مسار آل بوخف.",
            en: "Founded farms in Qassim and Tabuk, then the family's first settlement in Riyadh — the turning point.",
          },
        },
      ],
    },
  ],
};

function findNode(p: Person, id: string): Person | null {
  if (p.id === id) return p;
  for (const c of p.children ?? []) {
    const r = findNode(c, id);
    if (r) return r;
  }
  return null;
}

function countAll(p: Person): number {
  return 1 + (p.children ?? []).reduce((s, c) => s + countAll(c), 0);
}
function depth(p: Person): number {
  return 1 + Math.max(0, ...(p.children ?? []).map(depth));
}
function collectIds(p: Person, acc: Set<string>) {
  acc.add(p.id);
  p.children?.forEach((c) => collectIds(c, acc));
}
function matches(p: Person, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return false;
  return p.ar.includes(s) || p.en.toLowerCase().includes(s);
}
function pathTo(p: Person, q: string, path: string[] = []): string[] | null {
  const here = [...path, p.id];
  if (matches(p, q)) return here;
  for (const c of p.children ?? []) {
    const r = pathTo(c, q, here);
    if (r) return r;
  }
  return null;
}

/* ─── Build tree from database ────────────────────────────── */
type Row = {
  id: string;
  full_name_ar: string | null;
  full_name_en: string;
  first_name?: string | null;
  gender?: "m" | "f" | null;
  parent_id: string | null;
  generation: number | null;
  city: string | null;
  birth_year: number | null;
  death_year: number | null;
  is_deceased: boolean | null;
  notes: string | null;
  relation: string | null;
};
function buildFromRows(rows: Row[]): Person | null {
  if (!rows.length) return null;
  const byIdL = Object.fromEntries(rows.map((r) => [r.id, r])) as unknown as Record<
    string,
    LineageRow
  >;
  const nodes: Record<string, Person> = {};
  rows.forEach((r) => {
    nodes[r.id] = {
      id: r.id,
      ar: r.full_name_ar || r.full_name_en || "خاص",
      en: r.full_name_en || r.full_name_ar || "Private",
      year: r.birth_year
        ? `${r.birth_year} م${r.death_year ? " — " + r.death_year + " م" : ""}`
        : undefined,
      place:
        [r.city, `الجيل ${generationOf(r.id, byIdL)}`, r.is_deceased ? "رحمه الله" : null]
          .filter(Boolean)
          .join(" · ") || undefined,
      note: r.notes
        ? { ar: r.notes, en: r.notes }
        : r.relation
          ? { ar: r.relation, en: r.relation }
          : undefined,
      children: [],
    };
  });
  const roots: Person[] = [];
  rows.forEach((r) => {
    const n = nodes[r.id];
    if (r.parent_id && nodes[r.parent_id]) nodes[r.parent_id].children!.push(n);
    else roots.push(n);
  });
  const sortRec = (p: Person) => {
    p.children?.sort(
      (a, b) =>
        (rows.find((x) => x.id === a.id)?.birth_year ?? 9999) -
        (rows.find((x) => x.id === b.id)?.birth_year ?? 9999),
    );
    p.children?.forEach(sortRec);
  };
  roots.forEach(sortRec);
  return {
    id: "root",
    ar: "آل بوخف الناهسي",
    en: "Al Bukhuf Alnahsi",
    year: "571 م",
    place: "الحفائر · بلاد ناهس القاعة",
    note: ROOT.note,
    children: roots,
  };
}

/* ─── Node ───────────────────────────────────────────────────── */
function TreeNode({
  p,
  level,
  open,
  toggle,
  select,
  selected,
  hit,
  ar,
}: {
  p: Person;
  level: number;
  open: Set<string>;
  toggle: (id: string) => void;
  select: (p: Person) => void;
  selected: string | null;
  hit: (p: Person) => boolean;
  ar: boolean;
}) {
  const kids = p.children ?? [];
  const isOpen = open.has(p.id);
  const isSel = selected === p.id;
  const isHit = hit(p);
  const size =
    level === 0
      ? "px-8 py-4 text-lg"
      : level === 1
        ? "px-6 py-3 text-base"
        : level === 2
          ? "px-5 py-2.5 text-sm"
          : "px-4 py-2 text-sm";
  const tone =
    level === 0
      ? "bg-gradient-to-br from-[#CFA93A] to-[#9A7A1E] text-white shadow-[0_12px_34px_rgba(207,169,58,0.4)]"
      : isSel
        ? "bg-gradient-to-br from-[#1F5C4F] to-[#143D34] text-[#F0CC60] shadow-lg border-transparent"
        : isHit
          ? "bg-[#FFF3C4] text-navy border-gold ring-2 ring-gold/40"
          : "bg-white text-navy border-gold/40 hover:border-gold hover:shadow-[0_8px_24px_rgba(201,162,39,0.18)]";

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => select(p)}
        className={`relative rounded-md border font-arabic font-semibold transition-all ${size} ${tone}`}
      >
        {ar ? p.ar : p.en}
        {kids.length > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              toggle(p.id);
            }}
            className={`absolute -bottom-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border text-xs ${
              isOpen ? "border-gold bg-white text-gold" : "border-gold bg-gold text-white"
            }`}
            title={isOpen ? "طي" : "توسيع"}
          >
            {isOpen ? "−" : kids.length}
          </span>
        )}
      </button>

      {kids.length > 0 && isOpen && (
        <div className="mt-8 flex flex-col items-center">
          <div className="h-6 w-px bg-gold/50" />
          <div className="relative flex items-start gap-6">
            {kids.length > 1 && (
              <div className="absolute left-[calc(12.5%)] right-[calc(12.5%)] top-0 h-px bg-gold/40" />
            )}
            {kids.map((c) => (
              <div key={c.id} className="flex flex-col items-center">
                <div className="h-6 w-px bg-gold/50" />
                <TreeNode
                  p={c}
                  level={level + 1}
                  open={open}
                  toggle={toggle}
                  select={select}
                  selected={selected}
                  hit={hit}
                  ar={ar}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
function TreePage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const sc = useSiteContent();
  const canAdd = sc["tree_allow_public_add"] !== "false";
  const [open, setOpen] = useState<Set<string>>(() => new Set(["root", "g2", "g3"]));
  const [selected, setSelected] = useState<Person>(ROOT);
  const [q, setQ] = useState("");
  const [zoom, setZoom] = useState(1);
  const [showAdd, setShowAdd] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("join") === "1",
  );
  const [data, setData] = useState<Person>(ROOT);
  const [fromDb, setFromDb] = useState(false);
  const [rowsById, setRowsById] = useState<Record<string, LineageRow>>({});
  const [dbRows, setDbRows] = useState<PersonRow[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    const sb = getSupabase();
    const load = async () => {
      await sb.auth.getSession(); // انتظر استعادة الجلسة قبل القراءة (RLS)
      const { data: gb } = await sb
        .from("site_content")
        .select("value")
        .eq("key", "generation_base")
        .maybeSingle();
      if (gb?.value) setGenerationBase(Number(gb.value));
      const { data: rows, error } = await sb.from("tree_public").select("*");
      if (cancelled || error) return;
      const built = buildFromRows((rows ?? []) as Row[]);
      setDbRows((rows ?? []) as PersonRow[]);
      setRowsById(
        Object.fromEntries(((rows ?? []) as Row[]).map((r) => [r.id, r as unknown as LineageRow])),
      );
      if (built) {
        setData(built);
        setSelected(built);
        setFromDb(true);
        const s = new Set<string>();
        collectIds(built, s);
        setOpen(s);
      }
    };
    void load();
    const { data: sub } = sb.auth.onAuthStateChange(() => {
      void load();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const total = useMemo(() => countAll(data), [data]);
  const gens = useMemo(() => depth(data), [data]);
  const hit = (p: Person) => matches(p, q);

  // Expand path when searching
  useEffect(() => {
    if (!q.trim()) return;
    const path = pathTo(data, q);
    if (path) setOpen((o) => new Set([...o, ...path]));
  }, [q, data]);

  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const expandAll = () => {
    const s = new Set<string>();
    collectIds(data, s);
    setOpen(s);
  };
  const collapseAll = () => setOpen(new Set([data.id]));

  return (
    <main className="min-h-screen bg-parchment" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <section className="emerald-band pattern-bg pb-12 pt-36 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <span className="eyebrow-pill">✦ {ar ? "النسب" : "Lineage"}</span>
          <h1 className="mt-5 font-arabic text-5xl text-[#F5EDD8] md:text-7xl">
            {ar ? "شجرة العائلة التفاعلية" : "Interactive Family Tree"}
          </h1>
          <Ornament className="mt-6" />
          <p className="mx-auto mt-5 max-w-2xl font-serif-display text-lg italic text-cream/75">
            {ar
              ? "خثعم ← ناهس شهران ← المزارقة ← آل بوخف"
              : "Khath'am → Nahas Shahran → Al-Mazarigah → Al Bukhuf"}
          </p>

          {/* Counters */}
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[
              { n: total, l: ar ? "فرداً في الشجرة" : "Members" },
              { n: gens, l: ar ? "أجيال موثقة" : "Generations" },
              { n: "٥٧١", l: ar ? "ميلادية · الجذور" : "CE · Roots" },
            ].map((s, i) => (
              <div key={i} className="stat-tile">
                <div className="font-arabic text-3xl text-[#F0CC60]">{s.n}</div>
                <div className="mt-1 text-xs text-cream/75">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="sticky top-16 z-30 border-y border-gold/25 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ar ? "ابحث عن اسم…" : "Search a name…"}
            className="min-w-[200px] flex-1 rounded-md border border-gold/40 bg-white px-4 py-2.5 text-navy outline-none focus:border-gold"
          />
          <button
            onClick={expandAll}
            className="rounded-md border border-gold/40 bg-white px-4 py-2 text-sm text-navy hover:bg-parchment"
          >
            {ar ? "توسيع الكل" : "Expand all"}
          </button>
          <button
            onClick={collapseAll}
            className="rounded-md border border-gold/40 bg-white px-4 py-2 text-sm text-navy hover:bg-parchment"
          >
            {ar ? "طي الكل" : "Collapse"}
          </button>
          <div className="flex items-center rounded-md border border-gold/40 bg-white">
            <button
              onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
              className="px-3 py-2 text-navy"
            >
              −
            </button>
            <span className="px-2 text-xs text-navy/60">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
              className="px-3 py-2 text-navy"
            >
              +
            </button>
          </div>
          {canAdd && (
            <button onClick={() => setShowAdd(true)} className="btn-gold">
              {ar ? "＋ أضف اسمك" : "＋ Add your name"}
            </button>
          )}
        </div>
      </section>

      {/* Tree + Detail */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[1fr_320px]">
        <PanZoom zoom={zoom} onZoom={setZoom} fitKey={data.id + ":" + open.size} ar={ar}>
          <div className="p-6">
            <TreeNode
              p={data}
              level={0}
              open={open}
              toggle={toggle}
              select={setSelected}
              selected={selected.id}
              hit={hit}
              ar={ar}
            />
          </div>
        </PanZoom>

        <aside className="space-y-4 lg:sticky lg:top-36 lg:self-start">
          <div className="premium-card h-fit p-6">
            {rowsById[selected.id] ? (
              <PersonCard
                id={selected.id}
                rows={dbRows}
                ar={ar}
                onSelect={(id) => {
                  const n = findNode(data, id);
                  if (n) setSelected(n);
                }}
              />
            ) : (
              <>
                <div className="eyebrow">{ar ? "بطاقة الفرد" : "Profile"}</div>
                <h3 className="mt-2 font-arabic text-2xl text-navy">
                  {ar ? selected.ar : selected.en}
                </h3>
                {selected.year && <p className="mt-1 text-sm text-gold">{selected.year}</p>}
                {selected.place && <p className="text-xs text-navy/50">{selected.place}</p>}
                {selected.note && (
                  <p className="mt-4 leading-relaxed text-navy/70">
                    {ar ? selected.note.ar : selected.note.en}
                  </p>
                )}
              </>
            )}
            <button
              onClick={() => setShowAdd(true)}
              className="mt-6 w-full rounded-md border border-gold px-4 py-2 text-sm text-gold hover:bg-gold hover:text-white"
            >
              {ar ? "أضف فرداً لهذا الفرع" : "Add to this branch"}
            </button>
          </div>
          <RelationFinder byId={rowsById} ar={ar} />
        </aside>
      </section>

      {/* CTA */}
      <section className="bg-cream py-20 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-3xl md:text-4xl">
            {ar ? "كل اسم يُضاف يحفظ ذاكرة" : "Every name added preserves a memory"}
          </h2>
          <Ornament className="mt-5" />
          <p className="mt-5 text-navy/60">
            {ar
              ? "سجّل بياناتك وسيراجعها مشرف العائلة ويضيفها للشجرة."
              : "Submit your details; the family admin will review and add them."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => setShowAdd(true)} className="btn-gold">
              {ar ? "أضف اسمك الآن" : "Add your name"}
            </button>
            <Link to="/portal" className="btn-outline-navy">
              {ar ? "بوابة العائلة" : "Family Portal"}
            </Link>
          </div>
        </div>
      </section>

      {showAdd && (
        <AddToTreeModal
          ar={ar}
          parent={selected}
          byId={rowsById}
          onClose={() => setShowAdd(false)}
        />
      )}
    </main>
  );
}
