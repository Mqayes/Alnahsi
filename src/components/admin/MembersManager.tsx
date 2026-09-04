import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Member = {
  id: string; full_name_ar: string | null; full_name_en: string; relation: string | null;
  birth_year: number | null; death_year: number | null; photo_url: string | null; email: string | null;
  parent_id: string | null; generation: number | null; city: string | null; is_deceased: boolean | null; notes: string | null;
};
const EMPTY: Omit<Member, "id"> = { full_name_ar: "", full_name_en: "", relation: "", birth_year: null, death_year: null, photo_url: "", email: "", parent_id: null, generation: null, city: "", is_deceased: false, notes: "" };
const I = "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";

export function MembersManager() {
  const [rows, setRows] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true); setErr(null);
    const { data, error } = await getSupabase().from("family_members").select("*").order("generation", { ascending: true, nullsFirst: false }).order("birth_year", { ascending: true, nullsFirst: false });
    if (error) setErr(error.message); else setRows((data ?? []) as Member[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const byId = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, r])), [rows]);
  const name = (m: Member) => m.full_name_ar || m.full_name_en;

  const save = async (m: Partial<Member> & { id?: string }) => {
    setErr(null); setMsg(null);
    const payload = { ...m, full_name_en: (m.full_name_en || m.full_name_ar || "").trim(), full_name_ar: m.full_name_ar?.trim() || null, city: m.city?.trim() || null, relation: m.relation?.trim() || null, email: m.email?.trim() || null, notes: m.notes?.trim() || null, photo_url: m.photo_url?.trim() || null };
    delete (payload as { id?: string }).id;
    const sb = getSupabase();
    const res = m.id ? await sb.from("family_members").update(payload).eq("id", m.id) : await sb.from("family_members").insert(payload);
    if (res.error) { setErr("تعذّر الحفظ: " + res.error.message); return; }
    setMsg("تم الحفظ ✓"); setEditing(null); setCreating(false); void load();
  };

  const remove = async (m: Member) => {
    if (!window.confirm(`حذف «${name(m)}» من الشجرة؟`)) return;
    const { error } = await getSupabase().from("family_members").delete().eq("id", m.id);
    if (error) setErr("تعذّر الحذف: " + error.message); else { setMsg("تم الحذف"); void load(); }
  };

  const filtered = rows.filter((r) => !q || name(r).includes(q) || (r.full_name_en ?? "").toLowerCase().includes(q.toLowerCase()) || (r.city ?? "").includes(q));

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="بحث بالاسم أو المدينة…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Button onClick={() => { setEditing({ ...EMPTY, id: "" } as Member); setCreating(true); }} className="bg-gold text-navy hover:bg-gold/90">＋ إضافة فرد</Button>
        <Button variant="outline" onClick={() => void load()}>تحديث</Button>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      {loading ? <p className="text-navy/60">جارٍ التحميل…</p> : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((m) => (
              <div key={m.id} className="rounded-lg border border-gold/25 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-arabic text-lg text-navy">{name(m)}</div>
                    {m.full_name_en && <div className="text-xs text-navy/40" dir="ltr">{m.full_name_en}</div>}
                  </div>
                  {m.is_deceased ? <span className="shrink-0 rounded-full bg-navy/10 px-2 py-0.5 text-[11px]">رحمه الله</span> : <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] text-green-700">حي</span>}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-navy/70">
                  <dt>الأب</dt><dd className="text-navy">{m.parent_id && byId[m.parent_id] ? name(byId[m.parent_id]) : "—"}</dd>
                  <dt>الجيل</dt><dd className="text-navy">{m.generation ?? "—"}</dd>
                  <dt>المدينة</dt><dd className="text-navy">{m.city ?? "—"}</dd>
                  <dt>الميلاد</dt><dd className="text-navy">{m.birth_year ?? "—"}{m.death_year ? ` — ${m.death_year}` : ""}</dd>
                </dl>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1 bg-gold text-navy hover:bg-gold/90" onClick={() => { setEditing(m); setCreating(false); }}>تعديل</Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => void remove(m)}>حذف</Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="p-6 text-center text-navy/50">لا يوجد أفراد بعد</p>}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-gold/25 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-parchment text-navy/70">
                <tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الأب</th><th className="p-3">الجيل</th><th className="p-3">المدينة</th><th className="p-3">الميلاد</th><th className="p-3">الحالة</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-t border-gold/15 hover:bg-parchment/60">
                    <td className="p-3 font-arabic text-base text-navy">{name(m)}<div className="text-xs text-navy/40" dir="ltr">{m.full_name_en}</div></td>
                    <td className="p-3 text-navy/70">{m.parent_id && byId[m.parent_id] ? name(byId[m.parent_id]) : "—"}</td>
                    <td className="p-3 text-center">{m.generation ?? "—"}</td>
                    <td className="p-3 text-center">{m.city ?? "—"}</td>
                    <td className="p-3 text-center">{m.birth_year ?? "—"}</td>
                    <td className="p-3 text-center">{m.is_deceased ? <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs">رحمه الله</span> : <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">على قيد الحياة</span>}</td>
                    <td className="p-3 whitespace-nowrap">
                      <button className="text-gold hover:underline" onClick={() => { setEditing(m); setCreating(false); }}>تعديل</button>
                      <span className="mx-2 text-navy/20">|</span>
                      <button className="text-red-600 hover:underline" onClick={() => void remove(m)}>حذف</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-navy/50">لا يوجد أفراد بعد</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4" onClick={() => setEditing(null)}>
          <form className="max-h-[92vh] w-full max-w-xl space-y-3 overflow-auto rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); void save(creating ? { ...editing, id: undefined } : editing); }}>
            <h3 className="font-arabic text-2xl text-navy">{creating ? "إضافة فرد جديد" : "تعديل بيانات الفرد"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-navy/70">الاسم بالعربي *<input className={I} required value={editing.full_name_ar ?? ""} onChange={(e) => setEditing({ ...editing, full_name_ar: e.target.value })} placeholder="مثال: محمد بن سعود آل بوخف" /></label>
              <label className="text-sm text-navy/70">الاسم بالإنجليزي<input className={I} dir="ltr" value={editing.full_name_en ?? ""} onChange={(e) => setEditing({ ...editing, full_name_en: e.target.value })} placeholder="Mohammed Saud Al Bukhuf" /></label>
              <label className="text-sm text-navy/70">الأب (الفرع في الشجرة)
                <select className={I} value={editing.parent_id ?? ""} onChange={(e) => setEditing({ ...editing, parent_id: e.target.value || null })}>
                  <option value="">— جذر / بدون أب مسجّل —</option>
                  {rows.filter((r) => r.id !== editing.id).map((r) => <option key={r.id} value={r.id}>{name(r)}{r.generation ? ` (ج${r.generation})` : ""}</option>)}
                </select></label>
              <label className="text-sm text-navy/70">الجيل<select className={I} value={editing.generation ?? ""} onChange={(e) => setEditing({ ...editing, generation: e.target.value ? Number(e.target.value) : null })}>
                <option value="">—</option>{[1,2,3,4,5,6,7].map((g) => <option key={g} value={g}>الجيل {g}</option>)}</select></label>
              <label className="text-sm text-navy/70">المدينة<input className={I} value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} placeholder="الرياض" /></label>
              <label className="text-sm text-navy/70">الصفة / العلاقة<input className={I} value={editing.relation ?? ""} onChange={(e) => setEditing({ ...editing, relation: e.target.value })} placeholder="مثال: الجيل الرابع — الرياض" /></label>
              <label className="text-sm text-navy/70">سنة الميلاد<input className={I} type="number" value={editing.birth_year ?? ""} onChange={(e) => setEditing({ ...editing, birth_year: e.target.value ? Number(e.target.value) : null })} /></label>
              <label className="text-sm text-navy/70">سنة الوفاة<input className={I} type="number" value={editing.death_year ?? ""} onChange={(e) => setEditing({ ...editing, death_year: e.target.value ? Number(e.target.value) : null, is_deceased: !!e.target.value || editing.is_deceased })} /></label>
              <label className="text-sm text-navy/70">البريد الإلكتروني<input className={I} dir="ltr" type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></label>
              <label className="text-sm text-navy/70">رابط الصورة<input className={I} dir="ltr" value={editing.photo_url ?? ""} onChange={(e) => setEditing({ ...editing, photo_url: e.target.value })} /></label>
            </div>
            <label className="flex items-center gap-2 text-sm text-navy"><input type="checkbox" className="h-4 w-4 accent-[#CFA93A]" checked={!!editing.is_deceased} onChange={(e) => setEditing({ ...editing, is_deceased: e.target.checked })} /> متوفى (رحمه الله)</label>
            <label className="text-sm text-navy/70">نبذة / ملاحظات<textarea className={I} rows={3} value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
              <Button type="submit" className="bg-gold text-navy hover:bg-gold/90">حفظ</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
