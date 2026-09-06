import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Vis = "private" | "custom" | "family" | "public";
type Me = { member_id: string | null };
type M = {
  id: string;
  full_name_ar: string | null;
  full_name_en: string;
  vis_name: Vis;
  vis_photo: Vis;
  vis_details: Vis;
  vis_contact: Vis;
};
type Person = { id: string; full_name_ar: string | null; full_name_en: string };

const LEVELS: { v: Vis; ar: string; en: string; icon: string; hint: string }[] = [
  { v: "private", ar: "خاص بي", en: "Only me", icon: "🔒", hint: "لا يراه أحد غيرك (والمشرف)" },
  { v: "custom", ar: "أشخاص محددون", en: "Selected", icon: "👥", hint: "من تختارهم أنت فقط" },
  { v: "family", ar: "أفراد العائلة", en: "Family", icon: "🏡", hint: "كل عضو مسجّل في الموقع" },
  { v: "public", ar: "العامة", en: "Public", icon: "🌍", hint: "أي زائر للموقع" },
];

const FIELDS: {
  key: keyof Pick<M, "vis_name" | "vis_photo" | "vis_details" | "vis_contact">;
  ar: string;
  en: string;
  note?: string;
}[] = [
  {
    key: "vis_name",
    ar: "اسمي في الشجرة",
    en: "My name in the tree",
    note: "إن أخفيته يبقى موضعك في الشجرة لكن يُكتب «خاص»",
  },
  { key: "vis_photo", ar: "صورتي الشخصية", en: "My photo" },
  { key: "vis_details", ar: "بياناتي (المدينة، المهنة، النبذة، الزواج)", en: "My details" },
  { key: "vis_contact", ar: "بيانات التواصل (الجوال والبريد)", en: "Contact info" },
];

export function PrivacyTab({ ar }: { ar: boolean }) {
  const [me, setMe] = useState<Me | null>(null);
  const [m, setM] = useState<M | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [shared, setShared] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
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
      .select("member_id")
      .eq("id", session.user.id)
      .maybeSingle();
    setMe(p as Me);
    if (!p?.member_id) return;
    const [{ data: mm }, { data: all }, { data: sh }] = await Promise.all([
      sb
        .from("family_members")
        .select("id, full_name_ar, full_name_en, vis_name, vis_photo, vis_details, vis_contact")
        .eq("id", p.member_id)
        .maybeSingle(),
      sb
        .from("tree_public")
        .select("id, full_name_ar, full_name_en")
        .neq("id", p.member_id)
        .order("full_name_ar"),
      sb.from("member_shares").select("viewer_member").eq("owner_member", p.member_id),
    ]);
    setM(mm as M);
    setPeople((all ?? []) as Person[]);
    setShared(new Set(((sh ?? []) as { viewer_member: string }[]).map((r) => r.viewer_member)));
  };
  useEffect(() => {
    void load();
  }, []);

  const setVis = async (key: string, v: Vis) => {
    if (!m) return;
    setErr(null);
    const { error } = await getSupabase()
      .from("family_members")
      .update({ [key]: v })
      .eq("id", m.id);
    if (error) {
      setErr("تعذّر الحفظ: " + error.message);
      return;
    }
    setM({ ...m, [key]: v } as M);
    setMsg(ar ? "تم الحفظ ✓" : "Saved ✓");
  };

  const toggleShare = async (viewer: string) => {
    if (!m) return;
    const sb = getSupabase();
    if (shared.has(viewer)) {
      await sb.from("member_shares").delete().eq("owner_member", m.id).eq("viewer_member", viewer);
      setShared((s) => {
        const n = new Set(s);
        n.delete(viewer);
        return n;
      });
    } else {
      const { error } = await sb
        .from("member_shares")
        .insert({ owner_member: m.id, viewer_member: viewer });
      if (error) {
        setErr(error.message);
        return;
      }
      setShared((s) => new Set(s).add(viewer));
    }
  };

  const needsCustom = useMemo(
    () => (m ? [m.vis_name, m.vis_photo, m.vis_details, m.vis_contact].includes("custom") : false),
    [m],
  );
  const filtered = people.filter((p) => !q || (p.full_name_ar ?? p.full_name_en ?? "").includes(q));

  if (!me?.member_id)
    return (
      <div className="premium-card p-6 text-navy/60" dir={ar ? "rtl" : "ltr"}>
        {ar ? "اربط حسابك باسمك من تبويب «ملفي» أولاً." : "Link your account first."}
      </div>
    );
  if (!m) return <p className="text-navy/60">…</p>;

  return (
    <div dir={ar ? "rtl" : "ltr"} className="space-y-5">
      <div className="premium-card p-5">
        <h3 className="font-arabic text-xl text-navy">{ar ? "خصوصيتي" : "My privacy"}</h3>
        <p className="mt-1 text-sm text-navy/60">
          {ar
            ? "أنت تتحكم بمن يرى كل جزء من بياناتك. التغيير يسري فوراً على الموقع كله."
            : "You control who sees each part of your data."}
        </p>
        {msg && <span className="mt-2 inline-block text-sm text-green-700">{msg}</span>}
        {err && <span className="mt-2 inline-block text-sm text-red-600">{err}</span>}
      </div>

      {FIELDS.map((f) => (
        <div key={f.key} className="premium-card p-5">
          <div className="font-arabic text-lg text-navy">{ar ? f.ar : f.en}</div>
          {f.note && <p className="mt-0.5 text-xs text-navy/50">{f.note}</p>}
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {LEVELS.map((l) => {
              const active = m[f.key] === l.v;
              return (
                <button
                  key={l.v}
                  onClick={() => void setVis(f.key, l.v)}
                  className={`rounded-lg border p-3 text-start transition ${active ? "border-gold bg-gold/15 ring-1 ring-gold" : "border-gold/25 bg-white hover:bg-parchment"}`}
                >
                  <div className="text-lg">{l.icon}</div>
                  <div
                    className={`mt-1 text-sm ${active ? "font-bold text-navy" : "text-navy/80"}`}
                  >
                    {ar ? l.ar : l.en}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-navy/50">{l.hint}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {needsCustom && (
        <div className="premium-card p-5">
          <h4 className="font-arabic text-lg text-navy">
            {ar ? `الأشخاص المسموح لهم (${shared.size})` : `Allowed people (${shared.size})`}
          </h4>
          <p className="mt-1 text-xs text-navy/55">
            {ar
              ? "اختر من العائلة من يرى ما حدّدت له «أشخاص محددون»."
              : "Pick who can see your ‘Selected’ items."}
          </p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ar ? "ابحث بالاسم…" : "Search…"}
            className="mt-3 w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold"
          />
          <div className="mt-3 max-h-72 space-y-1 overflow-auto">
            {filtered.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-parchment"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#CFA93A]"
                  checked={shared.has(p.id)}
                  onChange={() => void toggleShare(p.id)}
                />
                <span className="font-arabic text-navy">{p.full_name_ar || p.full_name_en}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="premium-card p-5">
        <h4 className="font-arabic text-lg text-navy">{ar ? "معاينة" : "Preview"}</h4>
        <ul className="mt-2 space-y-1 text-sm text-navy/70">
          {FIELDS.map((f) => {
            const l = LEVELS.find((x) => x.v === m[f.key])!;
            return (
              <li key={f.key}>
                • {ar ? f.ar : f.en}:{" "}
                <b className="text-navy">
                  {l.icon} {ar ? l.ar : l.en}
                </b>
              </li>
            );
          })}
        </ul>
        <Button variant="outline" className="mt-3" onClick={() => void load()}>
          {ar ? "تحديث" : "Refresh"}
        </Button>
      </div>
    </div>
  );
}
