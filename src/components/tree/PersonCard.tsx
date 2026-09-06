import { useMemo } from "react";
import { ancestors, firstNameOf, type LineageRow } from "@/lib/lineage";

export type PersonRow = LineageRow & {
  birth_year?: number | null;
  death_year?: number | null;
  is_deceased?: boolean | null;
  city?: string | null;
  occupation?: string | null;
  spouse_name?: string | null;
  marriage_year?: number | null;
  death_cause?: string | null;
  notes?: string | null;
  photo_url?: string | null;
};

export function PersonCard({
  id,
  rows,
  ar,
  onSelect,
}: {
  id: string;
  rows: PersonRow[];
  ar: boolean;
  onSelect: (id: string) => void;
}) {
  const byId = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.id, r])) as Record<string, PersonRow>,
    [rows],
  );
  const p = byId[id];
  const name = (r?: PersonRow) =>
    r ? r.full_name_ar || r.full_name_en || (ar ? "خاص" : "Private") : "";
  if (!p) return null;

  const father = p.parent_id ? byId[p.parent_id] : undefined;
  const siblings = rows.filter((r) => r.parent_id === p.parent_id && r.id !== p.id && p.parent_id);
  const children = rows.filter((r) => r.parent_id === p.id);
  const chain = ancestors(p.parent_id, byId as unknown as Record<string, LineageRow>).map(
    firstNameOf,
  );
  const age = p.birth_year ? (p.death_year ?? new Date().getFullYear()) - p.birth_year : null;

  const Chip = ({ r }: { r: PersonRow }) => (
    <button
      onClick={() => onSelect(r.id)}
      className="rounded-full border border-gold/40 bg-parchment px-3 py-1 font-arabic text-sm text-navy hover:bg-gold hover:text-white"
    >
      {r.gender === "f" ? "♀ " : ""}
      {firstNameOf(r as LineageRow) || name(r)}
    </button>
  );
  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex justify-between gap-3 border-b border-gold/10 py-1.5 text-sm">
      <span className="text-navy/55">{k}</span>
      <span className="text-navy">{v}</span>
    </div>
  );

  return (
    <div dir={ar ? "rtl" : "ltr"} className="space-y-4">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-gold/50 bg-parchment font-arabic text-2xl text-gold">
          {p.photo_url ? (
            <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            name(p).slice(0, 2)
          )}
        </div>
        <h3 className="mt-3 font-arabic text-xl text-navy">{name(p)}</h3>
        {chain.length > 0 && (
          <p className="mt-1 text-xs text-navy/50">
            {ar ? "النسب: " : "Lineage: "}
            {chain.join(" ← ")}
          </p>
        )}
        {p.is_deceased && (
          <span className="mt-2 inline-block rounded-full bg-navy/10 px-3 py-0.5 text-xs text-navy">
            {p.gender === "f" ? "رحمها الله" : "رحمه الله"}
          </span>
        )}
      </div>

      <div>
        {p.generation != null && <Row k={ar ? "الجيل" : "Generation"} v={String(p.generation)} />}
        {p.birth_year && <Row k={ar ? "الميلاد" : "Born"} v={String(p.birth_year)} />}
        {p.death_year && <Row k={ar ? "الوفاة" : "Died"} v={String(p.death_year)} />}
        {age !== null && (
          <Row k={ar ? (p.is_deceased ? "عمره عند الوفاة" : "العمر") : "Age"} v={`${age}`} />
        )}
        {p.death_cause && <Row k={ar ? "سبب الوفاة" : "Cause"} v={p.death_cause} />}
        {p.city && <Row k={ar ? "المدينة" : "City"} v={p.city} />}
        {p.occupation && <Row k={ar ? "المهنة" : "Occupation"} v={p.occupation} />}
        {p.spouse_name && (
          <Row
            k={ar ? "الزوج/الزوجة" : "Spouse"}
            v={p.spouse_name + (p.marriage_year ? ` · ${p.marriage_year}` : "")}
          />
        )}
      </div>

      {p.notes && (
        <p className="rounded-lg bg-parchment p-3 text-sm leading-relaxed text-navy/75">
          {p.notes}
        </p>
      )}

      {father && (
        <div>
          <div className="text-xs uppercase tracking-widest text-gold">
            {ar ? "الأب" : "Father"}
          </div>
          <div className="mt-1">
            <Chip r={father} />
          </div>
        </div>
      )}
      {siblings.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest text-gold">
            {ar ? `الإخوة (${siblings.length})` : `Siblings (${siblings.length})`}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {siblings.map((s) => (
              <Chip key={s.id} r={s} />
            ))}
          </div>
        </div>
      )}
      {children.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest text-gold">
            {ar ? `الأبناء (${children.length})` : `Children (${children.length})`}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {children.map((c) => (
              <Chip key={c.id} r={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
