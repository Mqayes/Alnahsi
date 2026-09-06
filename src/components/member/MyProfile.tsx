import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Me = { id: string; email: string | null; full_name: string | null; member_id: string | null };
type Member = {
  id: string;
  full_name_ar: string | null;
  full_name_en: string;
  city: string | null;
  phone: string | null;
  occupation: string | null;
  birth_year: number | null;
  photo_url: string | null;
  generation: number | null;
  spouse_name: string | null;
  notes: string | null;
};
const I =
  "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";
const L = "block text-xs text-navy/60 mb-1";

export function MyProfile({ ar }: { ar: boolean }) {
  const [me, setMe] = useState<Me | null>(null);
  const [m, setM] = useState<Member | null>(null);
  const [candidates, setCandidates] = useState<Member[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const sb = getSupabase();
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session) return;
    const { data: p } = await sb
      .from("profiles")
      .select("id, email, full_name, member_id")
      .eq("id", session.user.id)
      .maybeSingle();
    setMe(p as Me);
    if (p?.member_id) {
      const { data: mm } = await sb
        .from("family_members")
        .select("*")
        .eq("id", p.member_id)
        .maybeSingle();
      setM(mm as Member);
    } else {
      const { data: all } = await sb
        .from("tree_public")
        .select(
          "id, full_name_ar, full_name_en, city, phone, occupation, birth_year, photo_url, generation, spouse_name, notes",
        )
        .order("full_name_ar");
      setCandidates((all ?? []) as Member[]);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const link = async (memberId: string) => {
    if (!me) return;
    const { error } = await getSupabase()
      .from("profiles")
      .update({ member_id: memberId })
      .eq("id", me.id);
    if (error) setErr(error.message);
    else {
      setMsg(ar ? "تم ربط حسابك ✓" : "Linked ✓");
      void load();
    }
  };

  const save = async () => {
    if (!m || !me) return;
    setErr(null);
    setMsg(null);
    const sb = getSupabase();
    const { error } = await sb
      .from("family_members")
      .update({
        city: m.city,
        phone: m.phone,
        occupation: m.occupation,
        photo_url: m.photo_url,
        spouse_name: m.spouse_name,
        notes: m.notes,
      })
      .eq("id", m.id);
    if (error) {
      setErr((ar ? "تعذّر الحفظ: " : "Save failed: ") + error.message);
      return;
    }
    await sb
      .from("profiles")
      .update({ full_name: m.full_name_ar || m.full_name_en })
      .eq("id", me.id);
    setMsg(ar ? "تم الحفظ ✓" : "Saved ✓");
  };

  if (!me) return <p className="text-navy/60">…</p>;

  if (!m) {
    return (
      <div className="premium-card p-6" dir={ar ? "rtl" : "ltr"}>
        <h3 className="font-arabic text-xl text-navy">
          {ar ? "اربط حسابك باسمك في الشجرة" : "Link your account to your tree entry"}
        </h3>
        <p className="mt-1 text-sm text-navy/60">
          {ar
            ? "اختر اسمك من القائمة ليرتبط حسابك ببياناتك في الشجرة."
            : "Pick your name so your account is linked to your tree entry."}
        </p>
        <select
          className={I + " mt-4"}
          defaultValue=""
          onChange={(e) => e.target.value && void link(e.target.value)}
        >
          <option value="">{ar ? "— اختر اسمك —" : "— select your name —"}</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name_ar || c.full_name_en}
            </option>
          ))}
        </select>
        <p className="mt-3 text-xs text-navy/50">
          {ar
            ? "لا تجد اسمك؟ أضف نفسك من صفحة الشجرة وسيُعتمد من المشرف."
            : "Not listed? Add yourself from the Tree page."}
        </p>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[260px_1fr]" dir={ar ? "rtl" : "ltr"}>
      <div className="premium-card p-6 text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-gold/50 bg-parchment font-arabic text-3xl text-gold">
          {m.photo_url ? (
            <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            (m.full_name_ar || m.full_name_en).slice(0, 2)
          )}
        </div>
        <h3 className="mt-4 font-arabic text-xl text-navy">{m.full_name_ar || m.full_name_en}</h3>
        <p className="text-xs text-navy/50">
          {m.generation ? (ar ? `الجيل ${m.generation}` : `Generation ${m.generation}`) : ""}
          {m.birth_year ? ` · ${m.birth_year}` : ""}
        </p>
      </div>
      <div className="premium-card space-y-3 p-6">
        <h3 className="font-arabic text-lg text-navy">{ar ? "بياناتي" : "My details"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={L}>{ar ? "المدينة" : "City"}</label>
            <input
              className={I}
              value={m.city ?? ""}
              onChange={(e) => setM({ ...m, city: e.target.value })}
            />
          </div>
          <div>
            <label className={L}>{ar ? "الجوال" : "Phone"}</label>
            <input
              className={I}
              dir="ltr"
              value={m.phone ?? ""}
              onChange={(e) => setM({ ...m, phone: e.target.value })}
            />
          </div>
          <div>
            <label className={L}>{ar ? "المهنة" : "Occupation"}</label>
            <input
              className={I}
              value={m.occupation ?? ""}
              onChange={(e) => setM({ ...m, occupation: e.target.value })}
            />
          </div>
          <div>
            <label className={L}>{ar ? "الزوج/الزوجة" : "Spouse"}</label>
            <input
              className={I}
              value={m.spouse_name ?? ""}
              onChange={(e) => setM({ ...m, spouse_name: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={L}>{ar ? "رابط الصورة الشخصية" : "Photo URL"}</label>
            <input
              className={I}
              dir="ltr"
              value={m.photo_url ?? ""}
              onChange={(e) => setM({ ...m, photo_url: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={L}>{ar ? "نبذة عني" : "About me"}</label>
            <textarea
              className={I}
              rows={3}
              value={m.notes ?? ""}
              onChange={(e) => setM({ ...m, notes: e.target.value })}
            />
          </div>
        </div>
        <p className="text-xs text-navy/50">
          {ar
            ? "الاسم والنسب وسنة الميلاد يعدّلها مشرف العائلة فقط حفاظاً على دقة الشجرة."
            : "Name, lineage and birth year are edited by the family admin only."}
        </p>
        <div className="flex items-center gap-3">
          <Button onClick={() => void save()} className="bg-gold text-navy hover:bg-gold/90">
            {ar ? "حفظ" : "Save"}
          </Button>
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </div>
    </div>
  );
}
