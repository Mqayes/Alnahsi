import { useEffect, useMemo, useState } from "react";
import { fetchTreeRows } from "@/lib/tree-source";
import { buildHighlights } from "@/lib/onthisday";
import type { PersonRow } from "@/components/tree/PersonCard";

export function OnThisDay({ ar, limit = 6 }: { ar: boolean; limit?: number }) {
  const [rows, setRows] = useState<PersonRow[]>([]);
  useEffect(() => {
    void fetchTreeRows<PersonRow>().then(({ rows: r }) => setRows(r));
  }, []);
  const items = useMemo(() => buildHighlights(rows, ar).slice(0, limit), [rows, ar, limit]);
  if (items.length === 0) return null;

  return (
    <div className="premium-card p-5" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <h3 className="font-arabic text-lg text-navy">
          🗓 {ar ? "في مثل هذا الوقت" : "Around this time"}
        </h3>
        <span className="text-xs text-navy/40">{ar ? "يتجدد أسبوعياً" : "weekly"}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((h, i) => (
          <li key={i} className="flex items-start gap-2 rounded-lg bg-parchment px-3 py-2 text-sm">
            <span className="text-base">{h.icon}</span>
            <span className={h.kind === "gap" ? "text-navy/70" : "text-navy"}>{h.text}</span>
          </li>
        ))}
      </ul>
      <a href="/tree" className="mt-3 inline-block text-sm text-gold hover:underline">
        {ar ? "افتح الشجرة لإكمال الناقص ←" : "Open the tree →"}
      </a>
    </div>
  );
}
