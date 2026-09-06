import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toGedcom, auditTree, upcomingEvents, type Issue } from "@/lib/gedcom";
import type { PersonRow } from "@/components/tree/PersonCard";

export function TreeToolsTab({ ar }: { ar: boolean }) {
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [tab, setTab] = useState<"audit" | "calendar" | "export" | "invite" | "app">("audit");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getSupabase()
      .from("family_members")
      .select("*")
      .then(({ data }) => setRows((data ?? []) as PersonRow[]));
  }, []);

  const issues = useMemo(() => auditTree(rows), [rows]);
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  const events = useMemo(() => upcomingEvents(rows), [rows]);

  const download = () => {
    const blob = new Blob([toGedcom(rows)], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `alnahsi-${new Date().toISOString().slice(0, 10)}.ged`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const downloadCsv = () => {
    const head = ["#", "الاسم", "الأب", "الجيل", "الجنس", "الميلاد", "الوفاة", "المدينة", "المهنة"];
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    const lines = rows.map((r, i) =>
      [
        i + 1,
        r.full_name_ar || r.full_name_en,
        r.parent_id ? (byId[r.parent_id]?.full_name_ar ?? "") : "",
        r.generation ?? "",
        r.gender === "f" ? "أنثى" : "ذكر",
        r.birth_year ?? "",
        r.death_year ?? "",
        r.city ?? "",
        r.occupation ?? "",
      ].join(","),
    );
    const blob = new Blob(["\uFEFF" + [head.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "alnahsi-members.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/tree?join=1` : "";
  const appUrl = typeof window !== "undefined" ? `${window.location.origin}/app` : "";
  const appWa = `https://wa.me/?text=${encodeURIComponent("تطبيق عائلة آل بوخف الناهسي 🌳\nشجرة العائلة والأخبار والمناسبات في تطبيق واحد.\nافتح الرابط وثبّته على جوالك بخطوتين:\n" + appUrl)}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(joinUrl)}`;

  const TabBtn = ({ id, label }: { id: typeof tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-full border px-4 py-1.5 text-sm ${tab === id ? "border-gold bg-gold text-navy" : "border-gold/30 bg-white text-navy/70"}`}
    >
      {label}
    </button>
  );
  const IssueRow = ({ i }: { i: Issue }) => (
    <li className="flex flex-wrap items-center gap-2 border-b border-gold/10 py-2 text-sm">
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] ${i.level === "error" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}
      >
        {i.level === "error" ? "خطأ" : "تنبيه"}
      </span>
      <span className="font-arabic text-navy">{i.name}</span>
      <span className="text-navy/60">{i.text}</span>
    </li>
  );

  return (
    <div dir={ar ? "rtl" : "ltr"} className="space-y-5">
      <div className="premium-card p-5">
        <h3 className="font-arabic text-xl text-navy">أدوات الشجرة</h3>
        <p className="mt-1 text-sm text-navy/60">
          فحص جودة البيانات، تقويم المناسبات، التصدير، ودعوة الأقارب.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <TabBtn
            id="audit"
            label={`🔍 فحص البيانات${issues.length ? ` (${issues.length})` : ""}`}
          />
          <TabBtn id="calendar" label="📅 تقويم المناسبات" />
          <TabBtn id="export" label="⬇ تصدير" />
          <TabBtn id="invite" label="📱 دعوة بـ QR" />
          <TabBtn id="app" label="📲 مشاركة التطبيق" />
        </div>
      </div>

      {tab === "audit" && (
        <div className="premium-card p-5">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
              {errors.length} خطأ
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
              {warns.length} تنبيه
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
              {rows.length} فرداً
            </span>
          </div>
          {issues.length === 0 ? (
            <p className="mt-4 text-sm text-green-700">✓ لا توجد مشاكل — البيانات سليمة</p>
          ) : (
            <ul className="mt-4">
              {[...errors, ...warns].map((i, k) => (
                <IssueRow key={k} i={i} />
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "calendar" && (
        <div className="premium-card p-5">
          {events.length === 0 ? (
            <p className="text-sm text-navy/50">لا توجد مناسبات مسجّلة</p>
          ) : (
            <ul className="divide-y divide-gold/10">
              {events.slice(0, 60).map((e, k) => (
                <li key={k} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span>
                      {e.kind === "birthday" ? "🎂" : e.kind === "memorial" ? "🕊" : "💍"}
                    </span>
                    <span className="font-arabic text-navy">{e.name}</span>
                  </span>
                  <span className="text-navy/60">{e.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "export" && (
        <div className="premium-card space-y-3 p-5">
          <p className="text-sm text-navy/70">
            احتفظ بنسخة من نسب العائلة. صيغة GEDCOM تُستورد في أي برنامج أنساب عالمي (FamilySearch،
            MyHeritage…).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={download} className="bg-gold text-navy hover:bg-gold/90">
              ⬇ تصدير GEDCOM (.ged)
            </Button>
            <Button variant="outline" onClick={downloadCsv}>
              ⬇ تصدير Excel (CSV)
            </Button>
          </div>
        </div>
      )}

      {tab === "invite" && (
        <div className="premium-card p-5 text-center">
          <p className="text-sm text-navy/70">
            اعرض هذا الرمز في مجلس العائلة — يفتح نموذج الانضمام مباشرة.
          </p>
          <img
            src={qr}
            alt="QR"
            className="mx-auto mt-4 rounded-xl border border-gold/30 bg-white p-2"
            width={260}
            height={260}
          />
          <p className="mt-3 break-all text-xs text-navy/50" dir="ltr">
            {joinUrl}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(joinUrl);
                setCopied(true);
              }}
            >
              {copied ? "✓ نُسخ" : "نسخ الرابط"}
            </Button>
            <a
              className="rounded-md border border-gold/40 px-4 py-2 text-sm text-navy hover:bg-parchment"
              href={`https://wa.me/?text=${encodeURIComponent("انضم لشجرة عائلة آل بوخف الناهسي: " + joinUrl)}`}
              target="_blank"
              rel="noreferrer"
            >
              مشاركة عبر واتساب
            </a>
          </div>
        </div>
      )}
      {tab === "app" && (
        <div className="premium-card p-5 text-center">
          <img src="/icon-192.png" alt="" className="mx-auto h-16 w-16 rounded-2xl" />
          <p className="mt-3 text-sm text-navy/70">
            رابط تحميل التطبيق — يفتح صفحة تشرح التثبيت خطوة بخطوة حسب جهاز المستقبِل (آيفون /
            أندرويد).
          </p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(appUrl)}`}
            alt="QR"
            className="mx-auto mt-4 rounded-xl border border-gold/30 bg-white p-2"
            width={220}
            height={220}
          />
          <p className="mt-3 break-all text-xs text-navy/50" dir="ltr">
            {appUrl}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <a
              className="btn-gold !px-4 !py-2 !text-sm"
              href={appWa}
              target="_blank"
              rel="noreferrer"
            >
              مشاركة التطبيق عبر واتساب
            </a>
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(appUrl);
                setCopied(true);
              }}
            >
              {copied ? "✓ نُسخ" : "نسخ رابط التطبيق"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
