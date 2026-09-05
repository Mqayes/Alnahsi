import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { recomputeGenerations, setGenerationBase, type LineageRow } from "@/lib/lineage";

const FIELDS: {
  key: string;
  label: string;
  hint?: string;
  type?: "text" | "textarea" | "toggle";
}[] = [
  {
    key: "generation_base",
    label: "رقم الجيل للجذر (أول اسم بلا أب)",
    hint: "مثال: 2 يجعل مفلح الجيل الثاني ثم يتسلسل 3، 4…",
  },
  { key: "site_name_ar", label: "اسم الموقع (عربي)" },
  { key: "site_name_en", label: "اسم الموقع (إنجليزي)" },
  { key: "contact_email", label: "بريد التواصل" },
  { key: "contact_phone", label: "رقم التواصل / واتساب" },
  {
    key: "tree_public",
    label: "إظهار شجرة العائلة للزوار بدون تسجيل",
    type: "toggle",
    hint: "إن كان مفعلاً تظهر الأسماء للجميع؛ وإلا تظهر النسخة العامة المختصرة فقط",
  },
  { key: "join_open", label: "فتح باب طلبات الانضمام", type: "toggle" },
  { key: "footer_quote_ar", label: "اقتباس التذييل (عربي)", type: "textarea" },
];

export function SettingsTab() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  const save = async () => {
    setErr(null);
    setMsg(null);
    const rows = FIELDS.map((f) => ({ key: f.key, value: vals[f.key] ?? "" }));
    const { error } = await getSupabase().from("site_content").upsert(rows, { onConflict: "key" });
    if (error) setErr("تعذّر الحفظ: " + error.message);
    else setMsg("تم حفظ الإعدادات ✓");
  };

  return (
    <div dir="rtl" className="space-y-5">
      <div className="premium-card p-5">
        <h3 className="font-arabic text-xl text-navy">إعدادات المنصة</h3>
        <p className="mt-1 text-sm text-navy/60">إعدادات عامة تنعكس على الموقع فوراً.</p>
      </div>
      <div className="premium-card space-y-4 p-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="text-sm text-navy">{f.label}</label>
            {f.hint && <p className="text-xs text-navy/50">{f.hint}</p>}
            {f.type === "toggle" ? (
              <button
                onClick={() =>
                  setVals({ ...vals, [f.key]: vals[f.key] === "true" ? "false" : "true" })
                }
                className={`mt-1 inline-flex h-7 w-12 items-center rounded-full p-1 transition ${vals[f.key] === "true" ? "bg-[#1F5C4F]" : "bg-navy/20"}`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white transition ${vals[f.key] === "true" ? "-translate-x-5" : ""}`}
                />
              </button>
            ) : f.type === "textarea" ? (
              <textarea
                rows={3}
                value={vals[f.key] ?? ""}
                onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
                className="mt-1 w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold"
              />
            ) : (
              <input
                value={vals[f.key] ?? ""}
                onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
                className="mt-1 w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold"
              />
            )}
          </div>
        ))}
        <div className="flex items-center gap-3">
          <Button onClick={() => void save()} className="bg-gold text-navy hover:bg-gold/90">
            حفظ الإعدادات
          </Button>
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </div>
    </div>
  );
}
