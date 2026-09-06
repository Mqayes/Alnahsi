import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { recomputeGenerations, setGenerationBase, type LineageRow } from "@/lib/lineage";
import { useLang } from "@/lib/i18n/LanguageContext";

type F = {
  key: string;
  ar: string;
  en: string;
  hint?: string;
  type?: "text" | "textarea" | "toggle" | "number";
  def?: string;
};
type Group = { id: string; ar: string; en: string; fields: F[] };

const GROUPS: Group[] = [
  {
    id: "general",
    ar: "عام",
    en: "General",
    fields: [
      { key: "site_name_ar", ar: "اسم الموقع (عربي)", en: "Site name (Arabic)" },
      { key: "site_name_en", ar: "اسم الموقع (إنجليزي)", en: "Site name (English)" },
      {
        key: "default_lang",
        ar: "اللغة الافتراضية (ar/en)",
        en: "Default language (ar/en)",
        def: "ar",
      },
      {
        key: "maintenance_mode",
        ar: "وضع الصيانة (إخفاء الموقع عن الزوار)",
        en: "Maintenance mode",
        type: "toggle",
        def: "false",
      },
      {
        key: "maintenance_message",
        ar: "رسالة الصيانة",
        en: "Maintenance message",
        type: "textarea",
        def: "الموقع تحت الصيانة — نعود قريباً",
      },
    ],
  },
  {
    id: "tree",
    ar: "الشجرة والأعضاء",
    en: "Tree & members",
    fields: [
      {
        key: "generation_base",
        ar: "رقم الجيل للجذر (أول اسم بلا أب)",
        en: "Root generation number",
        type: "number",
        def: "2",
        hint: "2 يجعل مفلح الجيل الثاني ثم 3، 4…",
      },
      {
        key: "tree_public",
        ar: "إظهار الشجرة للزوار بدون تسجيل",
        en: "Public tree",
        type: "toggle",
        def: "false",
      },
      {
        key: "tree_show_years",
        ar: "إظهار سنوات الميلاد/الوفاة في الشجرة",
        en: "Show years on tree",
        type: "toggle",
        def: "true",
      },
      {
        key: "tree_allow_public_add",
        ar: "السماح للزوار بطلب الإضافة من الشجرة",
        en: "Visitors can request additions",
        type: "toggle",
        def: "true",
      },
      {
        key: "member_can_edit_profile",
        ar: "الأعضاء يعدّلون ملفاتهم",
        en: "Members edit own profile",
        type: "toggle",
        def: "true",
      },
      {
        key: "member_can_add_children",
        ar: "الأعضاء يقترحون إضافة أبنائهم",
        en: "Members propose children",
        type: "toggle",
        def: "true",
      },
      {
        key: "member_can_post",
        ar: "الأعضاء ينشرون مشاركات (بعد الاعتماد)",
        en: "Members can post",
        type: "toggle",
        def: "true",
      },
    ],
  },
  {
    id: "join",
    ar: "الانضمام",
    en: "Joining",
    fields: [
      {
        key: "join_open",
        ar: "فتح باب طلبات الانضمام",
        en: "Join requests open",
        type: "toggle",
        def: "true",
      },
      {
        key: "join_note_ar",
        ar: "رسالة تظهر في نموذج الانضمام",
        en: "Join form note",
        type: "textarea",
      },
    ],
  },
  {
    id: "home",
    ar: "أقسام الرئيسية",
    en: "Home sections",
    fields: [
      { key: "sec_origin", ar: "قسم الأصل", en: "Origin", type: "toggle", def: "true" },
      {
        key: "sec_platform",
        ar: "منصة العائلة (البطاقات)",
        en: "Platform cards",
        type: "toggle",
        def: "true",
      },
      {
        key: "sec_timeline",
        ar: "الأجيال (الخط الزمني)",
        en: "Timeline",
        type: "toggle",
        def: "true",
      },
      { key: "sec_businesses", ar: "الإرث", en: "Legacy", type: "toggle", def: "true" },
      { key: "sec_values", ar: "القيم", en: "Values", type: "toggle", def: "true" },
      {
        key: "sec_gallery",
        ar: "معاينة الأرشيف",
        en: "Gallery preview",
        type: "toggle",
        def: "true",
      },
      {
        key: "sec_portal",
        ar: "دعوة بوابة العائلة",
        en: "Portal CTA",
        type: "toggle",
        def: "true",
      },
    ],
  },
  {
    id: "pages",
    ar: "الصفحات",
    en: "Pages",
    fields: [
      { key: "page_story", ar: "قصتنا", en: "Our story", type: "toggle", def: "true" },
      { key: "page_tree", ar: "شجرة العائلة", en: "Family tree", type: "toggle", def: "true" },
      {
        key: "page_journey",
        ar: "رحلة العائلة (الخريطة)",
        en: "Journey map",
        type: "toggle",
        def: "true",
      },
      {
        key: "page_games",
        ar: "مجلس العائلة (الألعاب)",
        en: "Family majlis (games)",
        type: "toggle",
        def: "true",
      },
      { key: "page_businesses", ar: "الإرث", en: "Legacy", type: "toggle", def: "true" },
      { key: "page_gallery", ar: "الأرشيف", en: "Archive", type: "toggle", def: "true" },
      { key: "page_news", ar: "الأخبار", en: "News", type: "toggle", def: "true" },
      { key: "page_contact", ar: "تواصل", en: "Contact", type: "toggle", def: "true" },
    ],
  },
  {
    id: "contact",
    ar: "التواصل والتذييل",
    en: "Contact & footer",
    fields: [
      { key: "contact_email", ar: "بريد التواصل", en: "Contact email" },
      { key: "contact_phone", ar: "جوال / واتساب", en: "Phone / WhatsApp" },
      { key: "social_x", ar: "رابط X (تويتر)", en: "X link" },
      { key: "social_instagram", ar: "رابط إنستغرام", en: "Instagram link" },
      { key: "social_snapchat", ar: "رابط سناب شات", en: "Snapchat link" },
      { key: "footer_quote_ar", ar: "اقتباس التذييل", en: "Footer quote", type: "textarea" },
      { key: "footer_copyright_ar", ar: "سطر الحقوق", en: "Copyright line" },
    ],
  },
];

export function SettingsTab() {
  const { lang } = useLang();
  const ar = lang !== "en";
  const [vals, setVals] = useState<Record<string, string>>({});
  const [group, setGroup] = useState(GROUPS[0].id);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSupabase()
      .from("site_content")
      .select("key, value")
      .then(({ data }) => {
        const v: Record<string, string> = {};
        (data ?? []).forEach((r: { key: string; value: string | null }) => {
          v[r.key] = r.value ?? "";
        });
        setVals(v);
      });
  }, []);

  const get = (f: F) => vals[f.key] ?? f.def ?? "";
  const set = (k: string, v: string) => setVals((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    const rows = GROUPS.flatMap((g) => g.fields).map((f) => ({ key: f.key, value: get(f) }));
    const { error } = await getSupabase().from("site_content").upsert(rows, { onConflict: "key" });
    setBusy(false);
    if (error) {
      setErr((ar ? "تعذّر الحفظ: " : "Save failed: ") + error.message);
      return;
    }
    setGenerationBase(Number(vals.generation_base) || 2);
    setMsg(ar ? "تم حفظ الإعدادات ✓" : "Settings saved ✓");
  };

  const recompute = async () => {
    setErr(null);
    setMsg(null);
    setGenerationBase(Number(vals.generation_base) || 2);
    const { data, error } = await getSupabase()
      .from("family_members")
      .select("id, full_name_ar, full_name_en, parent_id, generation");
    if (error) {
      setErr(error.message);
      return;
    }
    const updates = recomputeGenerations((data ?? []) as LineageRow[]);
    for (const u of updates) {
      const { error: e } = await getSupabase()
        .from("family_members")
        .update({ generation: u.generation })
        .eq("id", u.id);
      if (e) {
        setErr(e.message);
        return;
      }
    }
    setMsg(
      ar
        ? `أُعيد احتساب الأجيال لـ ${updates.length} فرداً ✓`
        : `Recomputed ${updates.length} members ✓`,
    );
  };

  const g = GROUPS.find((x) => x.id === group)!;
  const I =
    "mt-1 w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";

  return (
    <div dir={ar ? "rtl" : "ltr"} className="space-y-5">
      <div className="premium-card p-5">
        <h3 className="font-arabic text-xl text-navy">{ar ? "إعدادات الموقع" : "Site settings"}</h3>
        <p className="mt-1 text-sm text-navy/60">
          {ar
            ? "تحكّم بكل أجزاء الموقع: الأقسام، الصفحات، الصلاحيات العامة، التواصل، الصيانة."
            : "Control every part of the site."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {GROUPS.map((x) => (
            <button
              key={x.id}
              onClick={() => setGroup(x.id)}
              className={`rounded-full border px-4 py-1.5 text-sm ${group === x.id ? "border-gold bg-gold text-navy" : "border-gold/30 bg-white text-navy/70"}`}
            >
              {ar ? x.ar : x.en}
            </button>
          ))}
        </div>
      </div>

      <div className="premium-card space-y-4 p-5">
        <h4 className="font-arabic text-lg text-navy">{ar ? g.ar : g.en}</h4>
        {g.fields.map((f) => (
          <div
            key={f.key}
            className="flex flex-wrap items-start justify-between gap-3 border-b border-gold/10 pb-3"
          >
            <div className="min-w-0 flex-1">
              <label className="text-sm text-navy">{ar ? f.ar : f.en}</label>
              {f.hint && <p className="text-xs text-navy/50">{f.hint}</p>}
              {f.type === "textarea" && (
                <textarea
                  rows={2}
                  value={get(f)}
                  onChange={(e) => set(f.key, e.target.value)}
                  className={I}
                />
              )}
              {(f.type === "text" || !f.type) && (
                <input value={get(f)} onChange={(e) => set(f.key, e.target.value)} className={I} />
              )}
              {f.type === "number" && (
                <input
                  type="number"
                  value={get(f)}
                  onChange={(e) => set(f.key, e.target.value)}
                  className={I + " max-w-[140px]"}
                />
              )}
            </div>
            {f.type === "toggle" && (
              <button
                onClick={() => set(f.key, get(f) === "true" ? "false" : "true")}
                className={`mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${get(f) === "true" ? "bg-[#1F5C4F]" : "bg-navy/20"}`}
                aria-label={ar ? f.ar : f.en}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white transition ${get(f) === "true" ? (ar ? "-translate-x-5" : "translate-x-5") : ""}`}
                />
              </button>
            )}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={busy}
            onClick={() => void save()}
            className="bg-gold text-navy hover:bg-gold/90"
          >
            {busy ? "…" : ar ? "حفظ الإعدادات" : "Save settings"}
          </Button>
          {group === "tree" && (
            <Button variant="outline" onClick={() => void recompute()}>
              ↻ {ar ? "إعادة احتساب أجيال الشجرة" : "Recompute generations"}
            </Button>
          )}
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </div>
    </div>
  );
}
