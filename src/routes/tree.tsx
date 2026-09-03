import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Ornament } from "@/components/site/Ornament";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/tree")({
  head: () => ({
    meta: [
      { title: "شجرة العائلة التفاعلية — آل بوخف الناهسي" },
      { name: "description", content: "شجرة نسب آل بوخف الناهسي التفاعلية — ابحث، تصفّح الأجيال، وأضف اسمك." },
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
          children: [
            { id: "g4a", ar: "فهد", en: "Fahd", year: "الجيل الرابع", place: "الرياض",
              children: [
                { id: "g5a", ar: "محمد", en: "Mohammed", place: "الرياض" },
                { id: "g5b", ar: "سلطان", en: "Sultan", place: "الرياض", note: { ar: "الرئيس التنفيذي لمصنع مقاييس الدقة للمعدات.", en: "CEO, Mqayes Factory Equipment." } },
                { id: "g5c", ar: "مفلح", en: "Muflih", place: "الرياض" },
              ] },
            { id: "g4b", ar: "سعود", en: "Saud", year: "الجيل الرابع", place: "الرياض",
              children: [
                { id: "g5d", ar: "عبدالرحمن", en: "Abdulrahman", place: "الرياض" },
                { id: "g5e", ar: "أحمد", en: "Ahmad", place: "الرياض" },
              ] },
            { id: "g4c", ar: "خالد", en: "Khalid", year: "الجيل الرابع", place: "الرياض",
              children: [
                { id: "g5f", ar: "عبدالعزيز", en: "Abdulaziz", place: "الرياض" },
              ] },
            { id: "g4d", ar: "عبدالله", en: "Abdullah", year: "الجيل الرابع", place: "الرياض",
              children: [
                { id: "g5g", ar: "يوسف", en: "Yusuf", place: "الرياض" },
                { id: "g5h", ar: "إبراهيم", en: "Ibrahim", place: "الرياض" },
              ] },
            { id: "g4e", ar: "مفلح", en: "Muflih", year: "الجيل الرابع", place: "الرياض" },
          ],
        },
      ],
    },
  ],
};

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

/* ─── Node ───────────────────────────────────────────────────── */
function TreeNode({
  p, level, open, toggle, select, selected, hit, ar,
}: {
  p: Person; level: number; open: Set<string>; toggle: (id: string) => void;
  select: (p: Person) => void; selected: string | null; hit: (p: Person) => boolean; ar: boolean;
}) {
  const kids = p.children ?? [];
  const isOpen = open.has(p.id);
  const isSel = selected === p.id;
  const isHit = hit(p);
  const size = level === 0 ? "px-8 py-4 text-lg" : level === 1 ? "px-6 py-3 text-base" : level === 2 ? "px-5 py-2.5 text-sm" : "px-4 py-2 text-sm";
  const tone = level === 0
    ? "bg-gradient-to-br from-[#CFA93A] to-[#9A7A1E] text-white shadow-[0_12px_34px_rgba(207,169,58,0.4)]"
    : isSel ? "bg-gradient-to-br from-[#1F5C4F] to-[#143D34] text-[#F0CC60] shadow-lg border-transparent"
    : isHit ? "bg-[#FFF3C4] text-navy border-gold ring-2 ring-gold/40"
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
            onClick={(e) => { e.stopPropagation(); toggle(p.id); }}
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
            {kids.length > 1 && <div className="absolute left-[calc(12.5%)] right-[calc(12.5%)] top-0 h-px bg-gold/40" />}
            {kids.map((c) => (
              <div key={c.id} className="flex flex-col items-center">
                <div className="h-6 w-px bg-gold/50" />
                <TreeNode p={c} level={level + 1} open={open} toggle={toggle} select={select} selected={selected} hit={hit} ar={ar} />
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
  const [open, setOpen] = useState<Set<string>>(() => new Set(["root", "g2", "g3"]));
  const [selected, setSelected] = useState<Person>(ROOT);
  const [q, setQ] = useState("");
  const [zoom, setZoom] = useState(1);
  const [showAdd, setShowAdd] = useState(false);

  const total = useMemo(() => countAll(ROOT), []);
  const gens = useMemo(() => depth(ROOT), []);
  const hit = (p: Person) => matches(p, q);

  // Expand path when searching
  useEffect(() => {
    if (!q.trim()) return;
    const path = pathTo(ROOT, q);
    if (path) setOpen((o) => new Set([...o, ...path]));
  }, [q]);

  const toggle = (id: string) =>
    setOpen((o) => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const expandAll = () => { const s = new Set<string>(); collectIds(ROOT, s); setOpen(s); };
  const collapseAll = () => setOpen(new Set(["root"]));

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
            {ar ? "خثعم ← ناهس شهران ← المزارقة ← آل بوخف" : "Khath'am → Nahas Shahran → Al-Mazarigah → Al Bukhuf"}
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
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={ar ? "ابحث عن اسم…" : "Search a name…"}
            className="min-w-[200px] flex-1 rounded-md border border-gold/40 bg-white px-4 py-2.5 text-navy outline-none focus:border-gold"
          />
          <button onClick={expandAll} className="rounded-md border border-gold/40 bg-white px-4 py-2 text-sm text-navy hover:bg-parchment">{ar ? "توسيع الكل" : "Expand all"}</button>
          <button onClick={collapseAll} className="rounded-md border border-gold/40 bg-white px-4 py-2 text-sm text-navy hover:bg-parchment">{ar ? "طي الكل" : "Collapse"}</button>
          <div className="flex items-center rounded-md border border-gold/40 bg-white">
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="px-3 py-2 text-navy">−</button>
            <span className="px-2 text-xs text-navy/60">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))} className="px-3 py-2 text-navy">+</button>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-gold">
            {ar ? "＋ أضف اسمك" : "＋ Add your name"}
          </button>
        </div>
      </section>

      {/* Tree + Detail */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[1fr_320px]">
        <div className="premium-card overflow-auto p-6 md:p-8">
          <div className="min-w-max origin-top transition-transform" style={{ transform: `scale(${zoom})` }}>
            <TreeNode p={ROOT} level={0} open={open} toggle={toggle} select={setSelected} selected={selected.id} hit={hit} ar={ar} />
          </div>
        </div>

        <aside className="premium-card h-fit p-6 lg:sticky lg:top-36">
          <div className="eyebrow">{ar ? "بطاقة الفرد" : "Profile"}</div>
          <h3 className="mt-2 font-arabic text-2xl text-navy">{ar ? selected.ar : selected.en}</h3>
          {selected.year && <p className="mt-1 text-sm text-gold">{selected.year}</p>}
          {selected.place && <p className="text-xs text-navy/50">{selected.place}</p>}
          {selected.note && <p className="mt-4 leading-relaxed text-navy/70">{ar ? selected.note.ar : selected.note.en}</p>}
          {selected.children && selected.children.length > 0 && (
            <div className="mt-5">
              <div className="text-xs uppercase tracking-widest text-gold">{ar ? "الأبناء" : "Children"}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.children.map((c) => (
                  <button key={c.id} onClick={() => { setSelected(c); setOpen((o) => new Set([...o, selected.id])); }}
                    className="rounded-full border border-gold/40 bg-parchment px-3 py-1 text-sm text-navy hover:bg-gold hover:text-white">
                    {ar ? c.ar : c.en}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => setShowAdd(true)} className="mt-6 w-full rounded-md border border-gold px-4 py-2 text-sm text-gold hover:bg-gold hover:text-white">
            {ar ? "أضف فرداً لهذا الفرع" : "Add to this branch"}
          </button>
        </aside>
      </section>

      {/* CTA */}
      <section className="bg-cream py-20 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-3xl md:text-4xl">{ar ? "كل اسم يُضاف يحفظ ذاكرة" : "Every name added preserves a memory"}</h2>
          <Ornament className="mt-5" />
          <p className="mt-5 text-navy/60">{ar ? "سجّل بياناتك وسيراجعها مشرف العائلة ويضيفها للشجرة." : "Submit your details; the family admin will review and add them."}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => setShowAdd(true)} className="btn-gold">{ar ? "أضف اسمك الآن" : "Add your name"}</button>
            <Link to="/portal" className="btn-ghost-gold">{ar ? "بوابة العائلة" : "Family Portal"}</Link>
          </div>
        </div>
      </section>

      {showAdd && <AddModal ar={ar} parent={selected} onClose={() => setShowAdd(false)} />}
    </main>
  );
}

/* ─── Add member modal ───────────────────────────────────────── */
function AddModal({ ar, parent, onClose }: { ar: boolean; parent: Person; onClose: () => void }) {
  const [f, setF] = useState({ name: "", father: "", grand: "", year: "", city: "", email: "", phone: "", job: "", note: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.father || !f.email) return;
    setState("sending");
    const fullAr = `${f.name} بن ${f.father}${f.grand ? " بن " + f.grand : ""} آل بوخف`;
    const message = [
      `الفرع: ${parent.ar}`, `الاسم: ${fullAr}`,
      f.year && `سنة الميلاد: ${f.year}`, f.city && `المدينة: ${f.city}`,
      f.phone && `الجوال: ${f.phone}`, f.job && `المهنة: ${f.job}`, f.note && `ملاحظة: ${f.note}`,
    ].filter(Boolean).join("\n");
    try {
      if (isSupabaseConfigured()) {
        const { error } = await getSupabase().from("join_requests").insert({ full_name_en: fullAr, email: f.email, message, status: "pending" });
        if (error) throw error;
      }
      setState("done");
    } catch { setState("error"); }
  };

  const I = "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-7 shadow-2xl" onClick={(e) => e.stopPropagation()} dir={ar ? "rtl" : "ltr"}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="eyebrow">{ar ? "طلب إضافة" : "Add request"}</div>
            <h3 className="mt-1 font-arabic text-2xl text-navy">{ar ? "أضف اسمك إلى الشجرة" : "Add your name"}</h3>
            <p className="mt-1 text-xs text-navy/50">{ar ? "الفرع المختار:" : "Branch:"} <span className="text-gold">{ar ? parent.ar : parent.en}</span></p>
          </div>
          <button onClick={onClose} className="text-2xl text-navy/40 hover:text-navy">✕</button>
        </div>

        {state === "done" ? (
          <div className="rounded-md border border-green-300 bg-green-50 p-5 text-center text-green-800">
            {ar ? "🎉 تم استلام طلبك وسيُراجَع من مشرف العائلة قريباً." : "🎉 Request received — the family admin will review it soon."}
            <button onClick={onClose} className="btn-gold mt-5 w-full">{ar ? "إغلاق" : "Close"}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <input className={I} placeholder={ar ? "الاسم الأول *" : "First name *"} value={f.name} onChange={set("name")} required />
              <input className={I} placeholder={ar ? "اسم الأب *" : "Father *"} value={f.father} onChange={set("father")} required />
              <input className={I} placeholder={ar ? "اسم الجد" : "Grandfather"} value={f.grand} onChange={set("grand")} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className={I} placeholder={ar ? "سنة الميلاد" : "Birth year"} value={f.year} onChange={set("year")} />
              <input className={I} placeholder={ar ? "المدينة" : "City"} value={f.city} onChange={set("city")} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className={I} type="email" placeholder={ar ? "البريد الإلكتروني *" : "Email *"} value={f.email} onChange={set("email")} required />
              <input className={I} placeholder={ar ? "الجوال" : "Phone"} value={f.phone} onChange={set("phone")} />
            </div>
            <input className={I} placeholder={ar ? "المهنة" : "Occupation"} value={f.job} onChange={set("job")} />
            <textarea className={I} rows={3} placeholder={ar ? "كلمة للعائلة (اختياري)" : "A note (optional)"} value={f.note} onChange={set("note")} />
            {state === "error" && <p className="text-sm text-red-600">{ar ? "تعذّر الإرسال، حاول لاحقاً." : "Could not send. Try again."}</p>}
            <button type="submit" disabled={state === "sending"} className="btn-gold w-full">
              {state === "sending" ? (ar ? "جارٍ الإرسال…" : "Sending…") : (ar ? "✦ أرسل الطلب" : "✦ Submit")}
            </button>
            <p className="text-center text-xs text-navy/40">{ar ? "بياناتك خاصة ولا تُنشر إلا بعد اعتماد المشرف." : "Your data stays private until approved."}</p>
          </form>
        )}
      </div>
    </div>
  );
}
