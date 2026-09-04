import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { composeFullName, nextGeneration, type LineageRow } from "@/lib/lineage";
import { EVENT_TYPES, type EventType } from "@/lib/events";

type M = {
  id: string;
  full_name_ar: string | null;
  full_name_en: string;
  first_name: string | null;
  parent_id: string | null;
  generation: number | null;
  gender: "m" | "f" | null;
  is_deceased: boolean | null;
};
const I =
  "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";
const L = "block text-xs text-navy/60 mb-1";

export function EventsTab() {
  const [members, setMembers] = useState<M[]>([]);
  const [kind, setKind] = useState<EventType>("birth");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    member: "",
    first: "",
    gender: "m" as "m" | "f",
    year: String(new Date().getFullYear()),
    spouse: "",
    cause: "",
    title: "",
    details: "",
    isPrivate: false,
    publish: true,
  });

  const load = async () => {
    const { data } = await getSupabase()
      .from("family_members")
      .select(
        "id, full_name_ar, full_name_en, first_name, parent_id, generation, gender, is_deceased",
      )
      .order("generation");
    setMembers((data ?? []) as M[]);
  };
  useEffect(() => {
    void load();
  }, []);
  const byId = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])) as Record<string, LineageRow>,
    [members],
  );
  const name = (m?: M) => (m ? m.full_name_ar || m.full_name_en : "");
  const sel = members.find((m) => m.id === f.member);

  const publishNews = async (
    titleAr: string,
    titleEn: string,
    bodyAr: string,
    memberId: string | null,
  ) => {
    if (!f.publish) return;
    const { error } = await getSupabase()
      .from("news_posts")
      .insert({
        title_ar: titleAr,
        title_en: titleEn,
        content_ar: bodyAr,
        content_en: bodyAr,
        category: kind,
        member_id: memberId,
        event_date: `${f.year}-01-01`,
        is_private: f.isPrivate,
      });
    if (error) throw error;
  };

  const submit = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    const sb = getSupabase();
    try {
      if (kind === "birth") {
        if (!f.member || !f.first.trim()) throw new Error("اختر الأب واكتب اسم المولود");
        const full = composeFullName(f.first, f.gender, f.member, byId);
        const { data, error } = await sb
          .from("family_members")
          .insert({
            first_name: f.first.trim(),
            gender: f.gender,
            parent_id: f.member,
            generation: nextGeneration(f.member, byId),
            full_name_ar: full,
            full_name_en: full,
            birth_year: Number(f.year),
            is_deceased: false,
          })
          .select("id")
          .single();
        if (error) throw error;
        await publishNews(
          `🍼 مولود جديد: ${full}`,
          `New birth: ${full}`,
          `${f.gender === "f" ? "رُزق" : "رُزق"} ${name(sel)} بـ${f.gender === "f" ? "مولودة" : "مولود"} سمّاه${f.gender === "f" ? "ا" : ""} «${f.first}». ${f.details}`.trim(),
          data.id,
        );
        setMsg(`أُضيف المولود ${full} إلى الشجرة${f.publish ? " ونُشر الخبر" : ""} ✓`);
      } else if (kind === "marriage") {
        if (!f.member) throw new Error("اختر العريس/العروس");
        const { error } = await sb
          .from("family_members")
          .update({ spouse_name: f.spouse.trim() || null, marriage_year: Number(f.year) })
          .eq("id", f.member);
        if (error) throw error;
        await publishNews(
          `💍 زواج ${name(sel)}`,
          `Marriage of ${name(sel)}`,
          `نبارك لـ${name(sel)} زواجه${f.spouse ? " من " + f.spouse : ""}. ${f.details}`.trim(),
          f.member,
        );
        setMsg("سُجّل الزواج ✓");
      } else if (kind === "death") {
        if (!f.member) throw new Error("اختر المتوفى");
        const { error } = await sb
          .from("family_members")
          .update({
            is_deceased: true,
            death_year: Number(f.year),
            death_cause: f.cause.trim() || null,
          })
          .eq("id", f.member);
        if (error) throw error;
        await publishNews(
          `🕊 انتقل إلى رحمة الله: ${name(sel)}`,
          `In memoriam: ${name(sel)}`,
          `انتقل إلى رحمة الله تعالى ${name(sel)}${f.cause ? " — " + f.cause : ""}. ${f.details}`.trim(),
          f.member,
        );
        setMsg("سُجّلت الوفاة وحُدّثت الشجرة ✓");
      } else {
        if (!f.title.trim()) throw new Error("اكتب عنوان المناسبة");
        await publishNews(
          `${EVENT_TYPES[kind].icon} ${f.title}`,
          f.title,
          f.details,
          f.member || null,
        );
        setMsg("نُشرت المناسبة ✓");
      }
      setF((s) => ({ ...s, first: "", spouse: "", cause: "", title: "", details: "" }));
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "خطأ");
    }
    setBusy(false);
  };

  return (
    <div dir="rtl" className="space-y-5">
      <div className="premium-card p-5">
        <h3 className="font-arabic text-xl text-navy">مناسبات العائلة</h3>
        <p className="mt-1 text-sm text-navy/60">
          سجّل المناسبة مرة واحدة: تُحدَّث الشجرة تلقائياً ويُنشر الخبر في صفحة الأخبار.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(EVENT_TYPES) as EventType[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-full border px-3 py-1.5 text-sm ${kind === k ? "border-gold bg-gold text-navy" : "border-gold/30 bg-white text-navy/70"}`}
            >
              {EVENT_TYPES[k].icon} {EVENT_TYPES[k].ar}
            </button>
          ))}
        </div>
      </div>

      <div className="premium-card space-y-3 p-5">
        {kind === "birth" ? (
          <>
            <div>
              <label className={L}>الأب *</label>
              <select
                className={I}
                value={f.member}
                onChange={(e) => setF({ ...f, member: e.target.value })}
              >
                <option value="">— اختر الأب —</option>
                {members
                  .filter((m) => m.gender !== "f" && !m.is_deceased)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {name(m)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className={L}>اسم المولود *</label>
                <input
                  className={I}
                  value={f.first}
                  onChange={(e) => setF({ ...f, first: e.target.value })}
                />
              </div>
              <div>
                <label className={L}>الجنس</label>
                <select
                  className={I}
                  value={f.gender}
                  onChange={(e) => setF({ ...f, gender: e.target.value as "m" | "f" })}
                >
                  <option value="m">ذكر</option>
                  <option value="f">أنثى</option>
                </select>
              </div>
            </div>
            {f.first && f.member && (
              <p className="text-sm text-navy/70">
                الاسم الكامل:{" "}
                <b className="font-arabic text-navy">
                  {composeFullName(f.first, f.gender, f.member, byId)}
                </b>
              </p>
            )}
          </>
        ) : kind === "marriage" ? (
          <>
            <div>
              <label className={L}>العريس / العروس *</label>
              <select
                className={I}
                value={f.member}
                onChange={(e) => setF({ ...f, member: e.target.value })}
              >
                <option value="">— اختر —</option>
                {members
                  .filter((m) => !m.is_deceased)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {name(m)}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={L}>اسم الزوج/الزوجة (اختياري)</label>
              <input
                className={I}
                value={f.spouse}
                onChange={(e) => setF({ ...f, spouse: e.target.value })}
              />
            </div>
          </>
        ) : kind === "death" ? (
          <>
            <div>
              <label className={L}>المتوفى *</label>
              <select
                className={I}
                value={f.member}
                onChange={(e) => setF({ ...f, member: e.target.value })}
              >
                <option value="">— اختر —</option>
                {members
                  .filter((m) => !m.is_deceased)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {name(m)}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={L}>سبب الوفاة (اختياري)</label>
              <input
                className={I}
                value={f.cause}
                onChange={(e) => setF({ ...f, cause: e.target.value })}
                placeholder="مثال: بعد مرض، حادث، وفاة طبيعية"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className={L}>العنوان *</label>
              <input
                className={I}
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
              />
            </div>
            <div>
              <label className={L}>الفرد المرتبط (اختياري)</label>
              <select
                className={I}
                value={f.member}
                onChange={(e) => setF({ ...f, member: e.target.value })}
              >
                <option value="">—</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {name(m)}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={L}>{kind === "death" ? "سنة الوفاة" : "السنة"}</label>
            <input
              className={I}
              type="number"
              value={f.year}
              onChange={(e) => setF({ ...f, year: e.target.value })}
            />
          </div>
          <div className="flex flex-col justify-end gap-1 text-sm text-navy">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#CFA93A]"
                checked={f.publish}
                onChange={(e) => setF({ ...f, publish: e.target.checked })}
              />
              نشر خبر في صفحة الأخبار
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#CFA93A]"
                checked={f.isPrivate}
                onChange={(e) => setF({ ...f, isPrivate: e.target.checked })}
              />
              للأعضاء فقط (خاص)
            </label>
          </div>
        </div>
        <div>
          <label className={L}>تفاصيل / تهنئة (اختياري)</label>
          <textarea
            className={I}
            rows={3}
            value={f.details}
            onChange={(e) => setF({ ...f, details: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            disabled={busy}
            onClick={() => void submit()}
            className="bg-gold text-navy hover:bg-gold/90"
          >
            {busy ? "…" : `${EVENT_TYPES[kind].icon} تسجيل ${EVENT_TYPES[kind].ar}`}
          </Button>
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </div>
    </div>
  );
}
