import { useMemo, useState } from "react";
import { relationBetween, type LineageRow } from "@/lib/lineage";

export function RelationFinder({
  byId,
  ar,
  meMemberId,
}: {
  byId: Record<string, LineageRow>;
  ar: boolean;
  meMemberId?: string | null;
}) {
  const list = useMemo(
    () =>
      Object.values(byId).sort(
        (a, b) =>
          (a.generation ?? 99) - (b.generation ?? 99) ||
          (a.full_name_ar ?? "").localeCompare(b.full_name_ar ?? "", "ar"),
      ),
    [byId],
  );
  const [a, setA] = useState(meMemberId ?? "");
  const [b, setB] = useState("");
  const name = (r?: LineageRow) => (r ? r.full_name_ar || r.full_name_en : "");
  const rel = a && b ? relationBetween(a, b, byId) : null;
  const I =
    "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";

  if (list.length < 2) return null;
  return (
    <div className="premium-card p-5" dir={ar ? "rtl" : "ltr"}>
      <h3 className="font-arabic text-lg text-navy">
        {ar ? "ما صلتي به؟" : "How are we related?"}
      </h3>
      <p className="mt-1 text-xs text-navy/55">
        {ar
          ? "اختر شخصين لمعرفة صلة القرابة بينهما."
          : "Pick two people to see their relationship."}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select className={I} value={a} onChange={(e) => setA(e.target.value)}>
          <option value="">{ar ? "— الشخص الأول —" : "— First person —"}</option>
          {list.map((r) => (
            <option key={r.id} value={r.id}>
              {name(r)}
            </option>
          ))}
        </select>
        <select className={I} value={b} onChange={(e) => setB(e.target.value)}>
          <option value="">{ar ? "— الشخص الثاني —" : "— Second person —"}</option>
          {list.map((r) => (
            <option key={r.id} value={r.id}>
              {name(r)}
            </option>
          ))}
        </select>
      </div>
      {a && b && (
        <div className="mt-4 rounded-lg border border-gold/30 bg-parchment p-4 text-center">
          {rel ? (
            <p className="font-arabic text-lg text-navy">
              <b className="text-gold">{name(byId[b])}</b> {ar ? "هو" : "is"}{" "}
              <b className="text-gold">{ar ? rel.ar : rel.en}</b> {ar ? "لـ" : "of"}{" "}
              <b>{name(byId[a])}</b>
            </p>
          ) : (
            <p className="text-sm text-navy/60">
              {ar ? "لا يوجد جدّ مشترك مسجّل بينهما بعد." : "No recorded common ancestor yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
