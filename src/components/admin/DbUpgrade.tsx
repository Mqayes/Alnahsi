import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase, withTimeout } from "@/lib/supabase";
import { MIGRATIONS } from "@/lib/migrations";
import { Button } from "@/components/ui/button";

/**
 * بطاقة حالة قاعدة البيانات.
 *
 * القاعدة الحاكمة هنا: **لا تختفي البطاقة في أي حال**. النسخة السابقة كانت
 * ترجع null ما دامت الحالة غير معروفة، فإن تعلّق الاستعلام أو تأخّر اختفت
 * كلياً بلا تحميل ولا خطأ — فيظن المالك أن الترقية غير موجودة أصلاً.
 * الآن لكل حالة عرضٌ صريح: تحميل، خطأ، معلّق، أو محدّثة.
 */

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "bootstrap" }
  | { kind: "ready"; applied: string[] };

export function DbUpgrade({ autoRun = false }: { autoRun?: boolean }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [justFinished, setJustFinished] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const { data, error } = await withTimeout(
        getSupabase().from("schema_migrations").select("id"),
        12_000,
        "قراءة حالة قاعدة البيانات",
      );
      if (error) {
        // الجدول غير موجود = آلية الترقية لم تُثبَّت بعد
        setState({ kind: "bootstrap" });
        return;
      }
      setState({ kind: "ready", applied: (data ?? []).map((r: { id: string }) => r.id) });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "تعذّر الاتصال بقاعدة البيانات",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // مرجع ثابت بين الرسمات، حتى لا تتغيّر اعتماديات run في كل رسمة
  const applied = useMemo(() => (state.kind === "ready" ? state.applied : []), [state]);
  const pending = useMemo(
    () => (state.kind === "ready" ? MIGRATIONS.filter((m) => !applied.includes(m.id)) : []),
    [state.kind, applied],
  );

  const run = useCallback(async () => {
    setBusy(true);
    setLog([]);
    for (const m of MIGRATIONS.filter((x) => !applied.includes(x.id))) {
      const { error } = await getSupabase().rpc("apply_migration", {
        mig_id: m.id,
        mig_sql: m.sql,
      });
      if (error) {
        setLog((l) => [...l, `✗ ${m.title}\n   ${error.message}`]);
        setBusy(false);
        return;
      }
      setLog((l) => [...l, `✓ ${m.title}`]);
    }
    setBusy(false);
    setJustFinished(true);
    await load();
  }, [applied, load]);

  useEffect(() => {
    if (autoRun && state.kind === "ready" && pending.length > 0 && !busy && !justFinished) {
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind, autoRun]);

  /* ── تحميل ── */
  if (state.kind === "loading") {
    return (
      <div dir="rtl" className="premium-card p-5">
        <h3 className="font-arabic text-lg text-navy">قاعدة البيانات</h3>
        <p className="mt-1 text-sm text-navy/60">جارٍ قراءة الحالة…</p>
      </div>
    );
  }

  /* ── تعذّر الاتصال ── */
  if (state.kind === "error") {
    return (
      <div dir="rtl" className="premium-card border-red-400 p-5">
        <h3 className="font-arabic text-lg text-navy">قاعدة البيانات</h3>
        <p className="mt-1 text-sm text-red-600">تعذّرت قراءة الحالة: {state.message}</p>
        <Button variant="outline" className="mt-3" onClick={() => void load()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  /* ── الآلية غير مثبتة ── */
  if (state.kind === "bootstrap") {
    return (
      <div dir="rtl" className="premium-card border-red-400 p-5">
        <h3 className="font-arabic text-lg text-navy">آلية الترقية غير مثبتة</h3>
        <p className="mt-2 text-sm text-navy/70">
          تثبيت لمرة واحدة فقط: افتح Supabase ← SQL Editor، والصق محتوى ملف{" "}
          <code className="rounded bg-parchment px-1">supabase/bootstrap.sql</code> من المستودع
          وشغّله. بعدها تُطبَّق كل الترقيات من هنا تلقائياً.
        </p>
        <Button variant="outline" className="mt-3" onClick={() => void load()}>
          تحققتُ — أعد الفحص
        </Button>
      </div>
    );
  }

  /* ── ترقيات معلّقة: بارزة ولا تُخطأ ── */
  if (pending.length > 0 || busy) {
    return (
      <div
        dir="rtl"
        className="rounded-xl border-2 border-amber-400 bg-amber-50 p-5 shadow-[0_4px_20px_rgba(207,169,58,.25)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-arabic text-xl text-navy">
              ⚠ {busy ? "جارٍ تحديث قاعدة البيانات…" : `${pending.length} ترقية بانتظار التطبيق`}
            </h3>
            <p className="mt-1 text-sm text-navy/70">
              {busy
                ? "لا تغلق الصفحة حتى تنتهي."
                : autoRun
                  ? "تُطبَّق تلقائياً خلال ثوانٍ. إن لم تبدأ، اضغط الزر."
                  : "الميزات الجديدة لن تعمل قبل تطبيقها."}
            </p>
          </div>
          <Button
            disabled={busy}
            onClick={() => void run()}
            className="bg-gold text-navy hover:bg-gold/90"
          >
            {busy ? "جارٍ التطبيق…" : "تحديث قاعدة البيانات الآن"}
          </Button>
        </div>

        <ul className="mt-4 space-y-1 text-sm text-navy/75">
          {pending.map((m) => (
            <li key={m.id}>• {m.title}</li>
          ))}
        </ul>

        {log.length > 0 && (
          <pre className="mt-4 whitespace-pre-wrap rounded bg-white/70 p-3 text-xs text-navy">
            {log.join("\n")}
          </pre>
        )}
      </div>
    );
  }

  /* ── محدّثة ── */
  return (
    <div
      dir="rtl"
      className={`premium-card p-5 ${justFinished ? "border-2 border-[#1F5C4F]" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-arabic text-lg text-navy">
            {justFinished ? "✓ اكتمل التحديث" : "قاعدة البيانات محدّثة ✓"}
          </h3>
          <p className="mt-1 text-sm text-navy/60">
            {justFinished
              ? "حدّث الصفحة لتظهر الميزات الجديدة."
              : `${applied.length} من ${MIGRATIONS.length} ترقية مطبَّقة — كل الميزات مفعّلة.`}
          </p>
        </div>
        {justFinished ? (
          <Button
            onClick={() => window.location.reload()}
            className="bg-gold text-navy hover:bg-gold/90"
          >
            تحديث الصفحة
          </Button>
        ) : (
          <Button variant="outline" onClick={() => void load()}>
            إعادة الفحص
          </Button>
        )}
      </div>

      {log.length > 0 && (
        <pre className="mt-4 whitespace-pre-wrap rounded bg-parchment p-3 text-xs text-navy">
          {log.join("\n")}
        </pre>
      )}
    </div>
  );
}
