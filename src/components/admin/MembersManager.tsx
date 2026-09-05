import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { composeFullName, chainLabel, nextGeneration, type LineageRow } from "@/lib/lineage";
import { setGenerationBase, generationOf } from "@/lib/lineage";

export type Member = {
  id: string;
  full_name_ar: string | null;
  full_name_en: string;
  relation: string | null;
  birth_year: number | null;
  death_year: number | null;
  photo_url: string | null;
  email: string | null;
  parent_id: string | null;
  generation: number | null;
  city: string | null;
  is_deceased: boolean | null;
  notes: string | null;
  first_name: string | null;
  gender: "m" | "f" | null;
  phone: string | null;
  occupation: string | null;
  death_cause: string | null;
  spouse_name: string | null;
  marriage_year: number | null;
  created_at?: string;
  updated_at?: string | null;
};
const EMPTY: Omit<Member, "id"> = {
  full_name_ar: "",
  full_name_en: "",
  relation: "",
  birth_year: null,
  death_year: null,
  photo_url: "",
  email: "",
  parent_id: null,
  generation: null,
  city: "",
  is_deceased: false,
  notes: "",
  first_name: "",
  gender: "m",
  phone: "",
  occupation: "",
  death_cause: "",
  spouse_name: "",
  marriage_year: null,
};
const I =
  "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";

export function MembersManager() {
  const [rows, setRows] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<
    "seq" | "name" | "birth" | "generation" | "city" | "status"
  >("seq");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [genFilter, setGenFilter] = useState<string>("");
  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };
  const arrow = (k: typeof sortKey) => (sortKey === k ? (sortDir === "asc" ? " ▲" : " ▼") : "");
  const [qa, setQa] = useState({
    first: "",
    gender: "m" as "m" | "f",
    birth: "",
    parent: "",
    deceased: false,
    death: "",
    cause: "",
  });
  const [qaBusy, setQaBusy] = useState(false);
  const qaFirstRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await getSupabase()
      .from("family_members")
      .select("*")
      .order("generation", { ascending: true, nullsFirst: false })
      .order("birth_year", { ascending: true, nullsFirst: false });
    if (error) setErr(error.message);
    else {
      const list = (data ?? []) as Member[];
      // تصحيح تلقائي للأجيال من سلسلة النسب
      const byIdL = Object.fromEntries(list.map((r) => [r.id, r])) as unknown as Record<
        string,
        LineageRow
      >;
      const fixes = list.filter((r) => r.generation !== generationOf(r.id, byIdL));
      if (fixes.length) {
        await Promise.all(
          fixes.map((r) =>
            getSupabase()
              .from("family_members")
              .update({ generation: generationOf(r.id, byIdL) })
              .eq("id", r.id),
          ),
        );
        fixes.forEach((r) => {
          r.generation = generationOf(r.id, byIdL);
        });
      }
      setRows(list);
    }
    setLoading(false);
  };
  useEffect(() => {
    void (async () => {
      const { data } = await getSupabase()
        .from("site_content")
        .select("value")
        .eq("key", "generation_base")
        .maybeSingle();
      if (data?.value) setGenerationBase(Number(data.value));
      await load();
    })();
  }, []);

  const byId = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, r])), [rows]);
  const seqOf = useMemo(() => {
    const sorted = [...rows].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    return Object.fromEntries(sorted.map((r, i) => [r.id, i + 1]));
  }, [rows]);
  const fmt = (d?: string | null) =>
    d
      ? new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })
      : "—";
  const lineageById = byId as unknown as Record<string, LineageRow>;
  const applyLineage = (e: Member): Member => {
    const first = (e.first_name ?? "").trim();
    if (!first) return e;
    return {
      ...e,
      full_name_ar: composeFullName(first, e.gender ?? "m", e.parent_id, lineageById),
      generation: nextGeneration(e.parent_id, lineageById) ?? e.generation,
    };
  };
  const name = (m: Member) => m.full_name_ar || m.full_name_en;

  const save = async (m: Partial<Member> & { id?: string }) => {
    setErr(null);
    setMsg(null);
    const payload = {
      ...m,
      full_name_en: (m.full_name_en || m.full_name_ar || "").trim(),
      full_name_ar: m.full_name_ar?.trim() || null,
      city: m.city?.trim() || null,
      relation: m.relation?.trim() || null,
      email: m.email?.trim() || null,
      notes: m.notes?.trim() || null,
      photo_url: m.photo_url?.trim() || null,
    };
    delete (payload as { id?: string }).id;
    const sb = getSupabase();
    const res = m.id
      ? await sb.from("family_members").update(payload).eq("id", m.id)
      : await sb.from("family_members").insert(payload);
    if (res.error) {
      setErr("تعذّر الحفظ: " + res.error.message);
      return;
    }
    setMsg("تم الحفظ ✓");
    setEditing(null);
    setCreating(false);
    void load();
  };

  const remove = async (m: Member) => {
    if (!window.confirm(`حذف «${name(m)}» من الشجرة؟`)) return;
    const { error } = await getSupabase().from("family_members").delete().eq("id", m.id);
    if (error) setErr("تعذّر الحذف: " + error.message);
    else {
      setMsg("تم الحذف");
      void load();
    }
  };

  const quickAdd = async () => {
    const first = qa.first.trim();
    if (!first || !qa.birth) {
      setErr("الاسم الأول وسنة الميلاد مطلوبان");
      return;
    }
    setQaBusy(true);
    setErr(null);
    setMsg(null);
    const parent_id = qa.parent || null;
    const payload = {
      first_name: first,
      gender: qa.gender,
      parent_id,
      generation: nextGeneration(parent_id, lineageById),
      full_name_ar: composeFullName(first, qa.gender, parent_id, lineageById),
      full_name_en: composeFullName(first, qa.gender, parent_id, lineageById),
      birth_year: Number(qa.birth),
      death_year: qa.deceased && qa.death ? Number(qa.death) : null,
      is_deceased: qa.deceased,
      death_cause: qa.deceased && qa.cause.trim() ? qa.cause.trim() : null,
    };
    const { error } = await getSupabase().from("family_members").insert(payload);
    setQaBusy(false);
    if (error) {
      setErr("تعذّرت الإضافة: " + error.message);
      return;
    }
    setMsg(`أُضيف: ${payload.full_name_ar} ✓`);
    setQa((s) => ({ ...s, first: "", birth: "", death: "", cause: "", deceased: false })); // يبقي الأب والجنس للإدخال المتتالي
    await load();
    qaFirstRef.current?.focus();
  };

  const filtered = rows
    .filter(
      (r) =>
        (!q ||
          name(r).includes(q) ||
          (r.full_name_en ?? "").toLowerCase().includes(q.toLowerCase()) ||
          (r.city ?? "").includes(q)) &&
        (!genFilter || String(r.generation ?? "") === genFilter),
    )
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const cmp = (
        x: string | number | null | undefined,
        y: string | number | null | undefined,
      ) => {
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        return typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), "ar");
      };
      switch (sortKey) {
        case "seq":
          return dir * cmp(seqOf[a.id], seqOf[b.id]);
        case "name":
          return dir * cmp(name(a), name(b));
        case "birth":
          return dir * cmp(a.birth_year, b.birth_year);
        case "generation":
          return dir * (cmp(a.generation, b.generation) || cmp(a.birth_year, b.birth_year));
        case "city":
          return dir * cmp(a.city, b.city);
        case "status":
          return dir * cmp(Number(!!a.is_deceased), Number(!!b.is_deceased));
        default:
          return 0;
      }
    });
  const generations = Array.from(
    new Set(rows.map((r) => r.generation).filter((g): g is number => !!g)),
  ).sort((a, b) => a - b);

  return (
    <div dir="rtl" className="space-y-5">
      <div className="premium-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-arabic text-lg text-navy">إضافة سريعة</h3>
          <span className="text-xs text-navy/50">
            اختر الأب مرة واحدة ثم أدخل الأبناء تباعاً — Enter للإضافة
          </span>
        </div>
        <form
          className="grid gap-2 md:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            void quickAdd();
          }}
        >
          <select
            className={I + " md:col-span-2"}
            value={qa.parent}
            onChange={(e) => setQa({ ...qa, parent: e.target.value })}
          >
            <option value="">الأب: — الجذر —</option>
            {rows
              .filter((r) => r.gender !== "f")
              .map((r) => (
                <option key={r.id} value={r.id}>
                  الأب: {name(r)}
                </option>
              ))}
          </select>
          <input
            ref={qaFirstRef}
            className={I}
            placeholder="الاسم الأول *"
            value={qa.first}
            onChange={(e) => setQa({ ...qa, first: e.target.value })}
          />
          <select
            className={I}
            value={qa.gender}
            onChange={(e) => setQa({ ...qa, gender: e.target.value as "m" | "f" })}
          >
            <option value="m">ذكر</option>
            <option value="f">أنثى</option>
          </select>
          <input
            className={I}
            type="number"
            placeholder="سنة الميلاد *"
            value={qa.birth}
            onChange={(e) => setQa({ ...qa, birth: e.target.value })}
          />
          <Button type="submit" disabled={qaBusy} className="bg-gold text-navy hover:bg-gold/90">
            {qaBusy ? "…" : "＋ إضافة"}
          </Button>
          <label className="flex items-center gap-2 text-sm text-navy md:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#CFA93A]"
              checked={qa.deceased}
              onChange={(e) => setQa({ ...qa, deceased: e.target.checked })}
            />
            متوفى
          </label>
          {qa.deceased && (
            <input
              className={I}
              type="number"
              placeholder="سنة الوفاة"
              value={qa.death}
              onChange={(e) => setQa({ ...qa, death: e.target.value })}
            />
          )}
          {qa.deceased && (
            <input
              className={I + " md:col-span-2"}
              placeholder="سبب الوفاة (اختياري)"
              value={qa.cause}
              onChange={(e) => setQa({ ...qa, cause: e.target.value })}
            />
          )}
          {qa.first.trim() && (
            <div className="text-sm text-navy/70 md:col-span-3">
              الاسم الكامل:{" "}
              <b className="font-arabic text-navy">
                {composeFullName(qa.first, qa.gender, qa.parent || null, lineageById)}
              </b>{" "}
              · الجيل {nextGeneration(qa.parent || null, lineageById)}
            </div>
          )}
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="بحث بالاسم أو المدينة…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <select
          className={I + " w-auto"}
          value={genFilter}
          onChange={(e) => setGenFilter(e.target.value)}
        >
          <option value="">كل الأجيال</option>
          {generations.map((g) => (
            <option key={g} value={String(g)}>
              الجيل {g}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 rounded-md border border-gold/40 bg-white p-1 text-xs">
          <span className="px-1 text-navy/50">ترتيب:</span>
          {(
            [
              ["seq", "الرقم"],
              ["generation", "الجيل"],
              ["name", "الاسم"],
              ["birth", "الميلاد"],
              ["city", "المدينة"],
              ["status", "الحالة"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => toggleSort(k)}
              className={`rounded px-2 py-1 ${sortKey === k ? "bg-gold text-navy font-semibold" : "text-navy/70 hover:bg-parchment"}`}
            >
              {l}
              {arrow(k)}
            </button>
          ))}
        </div>
        <span className="text-xs text-navy/50">
          {filtered.length} / {rows.length}
        </span>
        <Button
          onClick={() => {
            setEditing({ ...EMPTY, id: "" } as Member);
            setCreating(true);
          }}
          className="bg-gold text-navy hover:bg-gold/90"
        >
          ＋ إضافة فرد
        </Button>
        <Button variant="outline" onClick={() => void load()}>
          تحديث
        </Button>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      {loading ? (
        <p className="text-navy/60">جارٍ التحميل…</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((m) => (
              <div key={m.id} className="rounded-lg border border-gold/25 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-arabic text-lg text-navy">
                      <span className="me-2 rounded bg-navy/10 px-1.5 py-0.5 text-xs text-navy/70">
                        #{seqOf[m.id]}
                      </span>
                      {m.gender === "f" ? "♀ " : ""}
                      {name(m)}
                    </div>
                    {m.full_name_en && (
                      <div className="text-xs text-navy/40" dir="ltr">
                        {m.full_name_en}
                      </div>
                    )}
                  </div>
                  {m.is_deceased ? (
                    <span className="shrink-0 rounded-full bg-navy/10 px-2 py-0.5 text-[11px]">
                      رحمه الله
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] text-green-700">
                      حي
                    </span>
                  )}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-navy/70">
                  <dt>الأب</dt>
                  <dd className="text-navy">
                    {m.parent_id && byId[m.parent_id] ? name(byId[m.parent_id]) : "—"}
                  </dd>
                  <dt>الجيل</dt>
                  <dd className="text-navy">{m.generation ?? "—"}</dd>
                  <dt>المدينة</dt>
                  <dd className="text-navy">{m.city ?? "—"}</dd>
                  <dt>أُضيف</dt>
                  <dd className="text-navy">{fmt(m.created_at)}</dd>
                  <dt>آخر تعديل</dt>
                  <dd className="text-navy">{fmt(m.updated_at)}</dd>
                  <dt>الميلاد</dt>
                  <dd className="text-navy">
                    {m.birth_year ?? "—"}
                    {m.death_year ? ` — ${m.death_year}` : ""}
                  </dd>
                </dl>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-gold text-navy hover:bg-gold/90"
                    onClick={() => {
                      setEditing(m);
                      setCreating(false);
                    }}
                  >
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => void remove(m)}
                  >
                    حذف
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="p-6 text-center text-navy/50">لا يوجد أفراد بعد</p>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-gold/25 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-parchment text-navy/70">
                <tr>
                  <th
                    className="cursor-pointer p-3 text-right hover:text-gold"
                    onClick={() => toggleSort("seq")}
                  >
                    #{arrow("seq")}
                  </th>
                  <th
                    className="cursor-pointer p-3 text-right hover:text-gold"
                    onClick={() => toggleSort("name")}
                  >
                    الاسم{arrow("name")}
                  </th>
                  <th className="p-3 text-right">الأب</th>
                  <th
                    className="cursor-pointer p-3 hover:text-gold"
                    onClick={() => toggleSort("generation")}
                  >
                    الجيل{arrow("generation")}
                  </th>
                  <th
                    className="cursor-pointer p-3 hover:text-gold"
                    onClick={() => toggleSort("city")}
                  >
                    المدينة{arrow("city")}
                  </th>
                  <th
                    className="cursor-pointer p-3 hover:text-gold"
                    onClick={() => toggleSort("birth")}
                  >
                    الميلاد{arrow("birth")}
                  </th>
                  <th className="p-3">أُضيف</th>
                  <th className="p-3">آخر تعديل</th>
                  <th
                    className="cursor-pointer p-3 hover:text-gold"
                    onClick={() => toggleSort("status")}
                  >
                    الحالة{arrow("status")}
                  </th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-t border-gold/15 hover:bg-parchment/60">
                    <td className="p-3 text-center text-xs text-navy/60">{seqOf[m.id]}</td>
                    <td className="p-3 font-arabic text-base text-navy">
                      {name(m)}
                      <div className="text-xs text-navy/40" dir="ltr">
                        {m.full_name_en}
                      </div>
                    </td>
                    <td className="p-3 text-navy/70">
                      {m.parent_id && byId[m.parent_id] ? name(byId[m.parent_id]) : "—"}
                    </td>
                    <td className="p-3 text-center">{m.generation ?? "—"}</td>
                    <td className="p-3 text-center">{m.city ?? "—"}</td>
                    <td className="p-3 text-center">{m.birth_year ?? "—"}</td>
                    <td className="p-3 text-center text-xs text-navy/60">{fmt(m.created_at)}</td>
                    <td className="p-3 text-center text-xs text-navy/60">{fmt(m.updated_at)}</td>
                    <td className="p-3 text-center">
                      {m.is_deceased ? (
                        <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs">
                          رحمه الله
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          على قيد الحياة
                        </span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <button
                        className="text-gold hover:underline"
                        onClick={() => {
                          setEditing(m);
                          setCreating(false);
                        }}
                      >
                        تعديل
                      </button>
                      <span className="mx-2 text-navy/20">|</span>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => void remove(m)}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-navy/50">
                      لا يوجد أفراد بعد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4"
          onClick={() => setEditing(null)}
        >
          <form
            className="max-h-[92vh] w-full max-w-xl space-y-3 overflow-auto rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              void save(creating ? { ...editing, id: undefined } : editing);
            }}
          >
            <h3 className="font-arabic text-2xl text-navy">
              {creating ? "إضافة فرد جديد" : "تعديل بيانات الفرد"}
            </h3>
            <div className="rounded-lg border border-gold/30 bg-parchment p-3 text-sm">
              <div className="text-xs text-navy/50">الأب والأجداد</div>
              <div className="mt-1 font-arabic text-navy">
                {chainLabel(editing.parent_id, lineageById)}
              </div>
              {editing.full_name_ar && (
                <div className="mt-2 border-t border-gold/20 pt-2 font-arabic text-navy">
                  الاسم الكامل: <b>{editing.full_name_ar}</b>
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-navy/70">
                الاسم الأول *
                <input
                  className={I}
                  required
                  value={editing.first_name ?? ""}
                  onChange={(e) =>
                    setEditing(applyLineage({ ...editing, first_name: e.target.value }))
                  }
                  placeholder="مثال: محمد"
                />
              </label>
              {editing.is_deceased && (
                <label className="text-sm text-navy/70 sm:col-span-2">
                  سبب الوفاة
                  <input
                    className={I}
                    value={editing.death_cause ?? ""}
                    onChange={(e) => setEditing({ ...editing, death_cause: e.target.value })}
                    placeholder="مثال: بعد مرض، حادث"
                  />
                </label>
              )}
              <label className="text-sm text-navy/70">
                الزوج/الزوجة
                <input
                  className={I}
                  value={editing.spouse_name ?? ""}
                  onChange={(e) => setEditing({ ...editing, spouse_name: e.target.value })}
                />
              </label>
              <label className="text-sm text-navy/70">
                سنة الزواج
                <input
                  className={I}
                  type="number"
                  value={editing.marriage_year ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      marriage_year: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
              <label className="text-sm text-navy/70">
                الجنس
                <select
                  className={I}
                  value={editing.gender ?? "m"}
                  onChange={(e) =>
                    setEditing(applyLineage({ ...editing, gender: e.target.value as "m" | "f" }))
                  }
                >
                  <option value="m">ذكر</option>
                  <option value="f">أنثى</option>
                </select>
              </label>
              <label className="text-sm text-navy/70 sm:col-span-2">
                الأب (الفرع في الشجرة)
                <select
                  className={I}
                  value={editing.parent_id ?? ""}
                  onChange={(e) =>
                    setEditing(applyLineage({ ...editing, parent_id: e.target.value || null }))
                  }
                >
                  <option value="">— الجذر / بدون أب مسجّل —</option>
                  {rows
                    .filter((r) => r.id !== editing.id && r.gender !== "f")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {name(r)}
                        {r.generation ? ` (الجيل ${r.generation})` : ""}
                      </option>
                    ))}
                </select>
              </label>
              <label className="text-sm text-navy/70">
                الجيل (يُحسب تلقائياً)
                <input
                  className={I}
                  type="number"
                  value={editing.generation ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      generation: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
              <label className="text-sm text-navy/70">
                المدينة
                <input
                  className={I}
                  value={editing.city ?? ""}
                  onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                  placeholder="الرياض"
                />
              </label>
              <label className="text-sm text-navy/70">
                سنة الميلاد
                <input
                  className={I}
                  type="number"
                  value={editing.birth_year ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      birth_year: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
              <label className="text-sm text-navy/70">
                سنة الوفاة
                <input
                  className={I}
                  type="number"
                  value={editing.death_year ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      death_year: e.target.value ? Number(e.target.value) : null,
                      is_deceased: !!e.target.value || editing.is_deceased,
                    })
                  }
                />
              </label>
              <label className="text-sm text-navy/70">
                المهنة
                <input
                  className={I}
                  value={editing.occupation ?? ""}
                  onChange={(e) => setEditing({ ...editing, occupation: e.target.value })}
                />
              </label>
              <label className="text-sm text-navy/70">
                الجوال
                <input
                  className={I}
                  dir="ltr"
                  value={editing.phone ?? ""}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                />
              </label>
              <label className="text-sm text-navy/70">
                البريد الإلكتروني
                <input
                  className={I}
                  dir="ltr"
                  type="email"
                  value={editing.email ?? ""}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
              </label>
              <label className="text-sm text-navy/70">
                الاسم بالإنجليزي (اختياري)
                <input
                  className={I}
                  dir="ltr"
                  value={editing.full_name_en ?? ""}
                  onChange={(e) => setEditing({ ...editing, full_name_en: e.target.value })}
                />
              </label>
              <label className="text-sm text-navy/70 sm:col-span-2">
                رابط الصورة
                <input
                  className={I}
                  dir="ltr"
                  value={editing.photo_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, photo_url: e.target.value })}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#CFA93A]"
                checked={!!editing.is_deceased}
                onChange={(e) => setEditing({ ...editing, is_deceased: e.target.checked })}
              />{" "}
              متوفى (رحمه الله)
            </label>
            <label className="text-sm text-navy/70">
              نبذة / ملاحظات
              <textarea
                className={I}
                rows={3}
                value={editing.notes ?? ""}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-gold text-navy hover:bg-gold/90">
                حفظ
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
