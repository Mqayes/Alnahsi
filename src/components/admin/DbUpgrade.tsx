import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { MIGRATIONS } from "@/lib/migrations";
import { Button } from "@/components/ui/button";

export function DbUpgrade({ autoRun = false }: { autoRun?: boolean }) {
  const [applied, setApplied] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  const load = async () => {
    const { data, error } = await getSupabase().from("schema_migrations").select("id");
    if (error) {
      setNeedsBootstrap(true);
      setApplied([]);
      return;
    }
    setApplied((data ?? []).map((r: { id: string }) => r.id));
  };
  useEffect(() => {
    void load();
  }, []);

  const pending = MIGRATIONS.filter((m) => !(applied ?? []).includes(m.id));

  const run = async () => {
    setBusy(true);
    setLog([]);
    for (const m of pending) {
      const { error } = await getSupabase().rpc("apply_migration", {
        mig_id: m.id,
        mig_sql: m.sql,
      });
      if (error) {
        setLog((l) => [...l, `✗ ${m.title}: ${error.message}`]);
        setBusy(false);
        return;
      }
      setLog((l) => [...l, `✓ ${m.title}`]);
    }
    await load();
    setBusy(false);
  };

  useEffect(() => {
    if (autoRun && applied && !needsBootstrap && pending.length > 0 && !busy) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, needsBootstrap]);

  if (applied === null) return null;
  return (
    <div dir="rtl" className={`premium-card p-5 ${pending.length ? "border-amber-400" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-arabic text-lg text-navy">قاعدة البيانات</h3>
          <p className="text-sm text-navy/60">
            {needsBootstrap
              ? "آلية الترقية غير مثبتة بعد."
              : pending.length
                ? `${pending.length} ترقية بانتظار التطبيق`
                : "قاعدة البيانات محدّثة ✓"}
          </p>
        </div>
        {!needsBootstrap && pending.length > 0 && (
          <Button
            disabled={busy}
            onClick={() => void run()}
            className="bg-gold text-navy hover:bg-gold/90"
          >
            {busy ? "جارٍ التطبيق…" : "تحديث قاعدة البيانات الآن"}
          </Button>
        )}
      </div>
      {pending.length > 0 && !needsBootstrap && (
        <ul className="mt-3 text-sm text-navy/70">
          {pending.map((m) => (
            <li key={m.id}>• {m.title}</li>
          ))}
        </ul>
      )}
      {log.length > 0 && (
        <pre className="mt-3 whitespace-pre-wrap rounded bg-parchment p-3 text-xs text-navy">
          {log.join("\n")}
        </pre>
      )}
      {needsBootstrap && (
        <p className="mt-3 text-xs text-navy/60">
          تثبيت لمرة واحدة: شغّل ملف <code>supabase/bootstrap.sql</code> من المستودع في SQL Editor،
          وبعدها تُطبَّق كل الترقيات من هذا الزر.
        </p>
      )}
    </div>
  );
}
