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

export function nextGeneration(
  parentId: string | null,
  byId: Record<string, LineageRow>,
): number | null {
  if (!parentId) return 1;
  const p = byId[parentId];
  return p?.generation ? p.generation + 1 : null;
}

export function chainLabel(parentId: string | null, byId: Record<string, LineageRow>): string {
  const c = ancestors(parentId, byId).map(firstNameOf);
  return c.length ? c.join(" ← ") : "الجذر";
}
