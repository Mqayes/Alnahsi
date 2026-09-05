import { useEffect, useState, type FormEvent } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { composeFullName, chainLabel, nextGeneration, type LineageRow } from "@/lib/lineage";

export type TreeParent = { id: string; ar: string; en: string };

/* ─── Add member modal ───────────────────────────────────────── */
export function AddToTreeModal({
  byId: byIdProp,
  ar,
  parent,
  onClose,
}: {
  ar: boolean;
  parent: TreeParent;
  byId: Record<string, LineageRow>;
  onClose: () => void;
}) {
  const [byId, setById] = useState<Record<string, LineageRow>>(byIdProp);
  const [loadingTree, setLoadingTree] = useState(Object.keys(byIdProp).length === 0);
  useEffect(() => {
    if (Object.keys(byIdProp).length > 0) {
      setById(byIdProp);
      setLoadingTree(false);
      return;
    }
    if (!isSupabaseConfigured()) {
      setLoadingTree(false);
      return;
    }
    getSupabase()
      .from("family_members")
      .select("id, full_name_ar, full_name_en, first_name, parent_id, generation, gender")
      .then(({ data }) => {
        setById(Object.fromEntries(((data ?? []) as LineageRow[]).map((r) => [r.id, r])));
        setLoadingTree(false);
      });
  }, [byIdProp]);

  const initialParent = parent.id === "root" ? null : byId[parent.id] ? parent.id : null;
  const [parentId, setParentId] = useState<string | null>(initialParent);
  const isDbParent = parentId !== null && !!byId[parentId];
  const fathers = Object.values(byId)
    .filter((r) => r.gender !== "f")
    .sort(
      (a, b) =>
        (a.generation ?? 99) - (b.generation ?? 99) ||
        (a.full_name_ar ?? "").localeCompare(b.full_name_ar ?? "", "ar"),
    );
  const [f, setF] = useState({
    first: "",
    gender: "m" as "m" | "f",
    deceased: false,
    birth: "",
    death: "",
    city: "",
    email: "",
    phone: "",
    job: "",
    note: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF({
        ...f,
        [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value,
      });

  const fullName = f.first.trim()
    ? composeFullName(f.first, f.gender, isDbParent ? parentId : null, byId)
    : "";
  const gen = nextGeneration(isDbParent ? parentId : null, byId);
  const lineage = isDbParent ? chainLabel(parentId, byId) : ar ? parent.ar : parent.en;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.first.trim() || !f.birth) return;
    setState("sending");
    setErrMsg("");
    const message = [
      `الفرع: ${lineage}`,
      f.job && `المهنة: ${f.job}`,
      f.note && `ملاحظة: ${f.note}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      if (isSupabaseConfigured()) {
        const { error } = await getSupabase()
          .from("join_requests")
          .insert({
            full_name_en: fullName,
            full_name_ar: fullName,
            first_name: f.first.trim(),
            email: f.email.trim(),
            parent_id: isDbParent ? parentId : null,
            gender: f.gender,
            is_deceased: f.deceased,
            birth_year: f.birth ? Number(f.birth) : null,
            death_year: f.deceased && f.death ? Number(f.death) : null,
            city: f.city.trim() || null,
            phone: f.phone.trim() || null,
            occupation: f.job.trim() || null,
            message,
            status: "pending",
          });
        if (error) throw error;
      }
      setState("done");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "error");
      setState("error");
    }
  };

  const I =
    "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";
  const L = "block text-xs text-navy/60 mb-1";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir={ar ? "rtl" : "ltr"}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="eyebrow">{ar ? "طلب إضافة إلى الشجرة" : "Add to the tree"}</div>
            <h3 className="mt-1 font-arabic text-2xl text-navy">
              {ar ? "أضف فرداً تحت هذا الفرع" : "Add a person under this branch"}
            </h3>
          </div>
          <button onClick={onClose} className="text-2xl text-navy/40 hover:text-navy">
            ✕
          </button>
        </div>

        {/* Lineage summary */}
        <div className="mb-4 rounded-lg border border-gold/30 bg-parchment p-3 text-sm">
          <div className="text-xs text-navy/50">
            {ar ? "الأب والأجداد (يُحددون تلقائياً من الفرع)" : "Lineage (auto from branch)"}
          </div>
          <div className="mt-1 font-arabic text-base text-navy">{lineage}</div>
          {gen && (
            <div className="mt-1 text-xs text-gold">
              {ar ? `سيكون في الجيل ${gen}` : `Generation ${gen}`}
            </div>
          )}
          {fullName && (
            <div className="mt-2 border-t border-gold/20 pt-2 font-arabic text-navy">
              {ar ? "الاسم الكامل: " : "Full name: "}
              <b>{fullName}</b>
            </div>
          )}
        </div>

        {state === "done" ? (
          <div className="rounded-md border border-green-300 bg-green-50 p-5 text-center text-green-800">
            {ar
              ? "🎉 تم استلام الطلب وسيُراجَع من مشرف العائلة قبل إضافته للشجرة."
              : "🎉 Request received — the family admin will review it."}
            <button onClick={onClose} className="btn-gold mt-5 w-full">
              {ar ? "إغلاق" : "Close"}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={L}>{ar ? "الاسم الأول *" : "First name *"}</label>
                <input
                  className={I}
                  value={f.first}
                  onChange={set("first")}
                  required
                  placeholder={ar ? "مثال: محمد" : "e.g. Mohammed"}
                />
              </div>
              <div>
                <label className={L}>{ar ? "الجنس" : "Gender"}</label>
                <select className={I} value={f.gender} onChange={set("gender")}>
                  <option value="m">{ar ? "ذكر" : "Male"}</option>
                  <option value="f">{ar ? "أنثى" : "Female"}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={L}>{ar ? "سنة الميلاد *" : "Birth year *"}</label>
                <input
                  className={I}
                  type="number"
                  min={1700}
                  max={2100}
                  value={f.birth}
                  onChange={set("birth")}
                  required
                />
              </div>
              <div>
                <label className={L}>{ar ? "المدينة" : "City"}</label>
                <input className={I} value={f.city} onChange={set("city")} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#CFA93A]"
                checked={f.deceased}
                onChange={set("deceased")}
              />
              {ar ? "متوفى (رحمه الله)" : "Deceased"}
            </label>
            {f.deceased && (
              <div>
                <label className={L}>{ar ? "سنة الوفاة" : "Death year"}</label>
                <input
                  className={I}
                  type="number"
                  min={1700}
                  max={2100}
                  value={f.death}
                  onChange={set("death")}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={L}>
                  {ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}
                </label>
                <input
                  className={I}
                  type="email"
                  dir="ltr"
                  value={f.email}
                  onChange={set("email")}
                />
              </div>
              <div>
                <label className={L}>{ar ? "الجوال" : "Phone"}</label>
                <input className={I} dir="ltr" value={f.phone} onChange={set("phone")} />
              </div>
            </div>
            <div>
              <label className={L}>{ar ? "المهنة" : "Occupation"}</label>
              <input className={I} value={f.job} onChange={set("job")} />
            </div>
            <div>
              <label className={L}>{ar ? "ملاحظة (اختياري)" : "Note (optional)"}</label>
              <textarea className={I} rows={2} value={f.note} onChange={set("note")} />
            </div>
            {state === "error" && (
              <p className="text-sm text-red-600">
                {ar ? "تعذّر الإرسال: " : "Could not send: "}
                {errMsg}
              </p>
            )}
            <button type="submit" disabled={state === "sending"} className="btn-gold w-full">
              {state === "sending"
                ? ar
                  ? "جارٍ الإرسال…"
                  : "Sending…"
                : ar
                  ? "✦ أرسل الطلب"
                  : "✦ Submit"}
            </button>
            <p className="text-center text-xs text-navy/40">
              {ar
                ? "الأب والجد يُؤخذان من الفرع المختار. تُراجَع البيانات قبل النشر."
                : "Father and grandfather come from the selected branch."}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
