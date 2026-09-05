/** منطق النسب المشترك: تركيب الاسم الكامل، سلسلة الآباء، الجيل */
export type LineageRow = {
  id: string;
  full_name_ar: string | null;
  full_name_en: string;
  first_name?: string | null;
  parent_id: string | null;
  generation: number | null;
  gender?: "m" | "f" | null;
};

export const FAMILY_SUFFIX = "آل بوخف";

/** يعيد سلسلة الآباء من الأقرب إلى الأبعد */
export function ancestors(id: string | null, byId: Record<string, LineageRow>): LineageRow[] {
  const out: LineageRow[] = [];
  let cur = id ? byId[id] : undefined;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    out.push(cur);
    seen.add(cur.id);
    cur = cur.parent_id ? byId[cur.parent_id] : undefined;
  }
  return out;
}

export function firstNameOf(r: LineageRow): string {
  if (r.first_name) return r.first_name;
  const n = (r.full_name_ar || r.full_name_en || "").trim();
  return n.split(/\s+/)[0] ?? "";
}

/** يركّب الاسم الكامل: الأول بن/بنت الأب بن الجد آل بوخف */
export function composeFullName(
  first: string,
  gender: "m" | "f",
  parentId: string | null,
  byId: Record<string, LineageRow>,
): string {
  const chain = ancestors(parentId, byId).slice(0, 3).map(firstNameOf).filter(Boolean);
  const link = gender === "f" ? "بنت" : "بن";
  const parts = [first.trim()];
  if (chain.length) parts.push(link, chain.join(" بن "));
  parts.push(FAMILY_SUFFIX);
  return parts.join(" ");
}

/** رقم جيل الجذر (بلا أب مسجّل). يُضبط من الإعدادات: generation_base */
export let GENERATION_BASE = 2;
export function setGenerationBase(n: number) {
  if (Number.isFinite(n) && n >= 0) GENERATION_BASE = n;
}

export function nextGeneration(parentId: string | null, byId: Record<string, LineageRow>): number {
  if (!parentId) return GENERATION_BASE;
  return ancestors(parentId, byId).length + GENERATION_BASE;
}

/** جيل فرد محسوب من عمق نسبه */
export function generationOf(id: string, byId: Record<string, LineageRow>): number {
  const r = byId[id];
  if (!r) return GENERATION_BASE;
  return ancestors(r.parent_id, byId).length + GENERATION_BASE;
}

/** يعيد احتساب جيل كل فرد من عمق النسب */
export function recomputeGenerations(rows: LineageRow[]): { id: string; generation: number }[] {
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  return rows.map((r) => ({
    id: r.id,
    generation: ancestors(r.parent_id, byId).length + GENERATION_BASE,
  }));
}

export function chainLabel(parentId: string | null, byId: Record<string, LineageRow>): string {
  const c = ancestors(parentId, byId).map(firstNameOf);
  return c.length ? c.join(" ← ") : "الجذر";
}
