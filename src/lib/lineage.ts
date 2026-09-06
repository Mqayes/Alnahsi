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

/* ─── حاسبة القرابة ─────────────────────────────────────────── */
type Rel = { ar: string; en: string };

function ordinalAr(n: number): string {
  return (
    ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن"][n] ??
    `الـ${n}`
  );
}

/** يحسب صلة القرابة بين شخصين داخل الشجرة */
export function relationBetween(
  aId: string,
  bId: string,
  byId: Record<string, LineageRow>,
): Rel | null {
  if (aId === bId) return { ar: "هو نفسه", en: "Same person" };
  const A = byId[aId],
    B = byId[bId];
  if (!A || !B) return null;

  const chainA = [A, ...ancestors(A.parent_id, byId)];
  const chainB = [B, ...ancestors(B.parent_id, byId)];
  const idxB = new Map(chainB.map((r, i) => [r.id, i]));

  let da = -1,
    db = -1;
  for (let i = 0; i < chainA.length; i++) {
    const j = idxB.get(chainA[i].id);
    if (j !== undefined) {
      da = i;
      db = j;
      break;
    }
  }
  if (da < 0) return null; // لا يوجد جدّ مشترك مسجّل

  const male = A.gender !== "f";
  const P = (m: string, f: string) => (male ? m : f);

  // خط مباشر
  if (da === 0) {
    if (db === 1) return { ar: P("ابنه", "ابنته"), en: "child" };
    if (db === 2) return { ar: P("حفيده", "حفيدته"), en: "grandchild" };
    return { ar: `${P("من ذريته", "من ذريته")} (${db} أجيال)`, en: `descendant (${db})` };
  }
  if (db === 0) {
    if (da === 1) return { ar: P("أبوه", "أمه"), en: "parent" };
    if (da === 2) return { ar: P("جدّه", "جدّته"), en: "grandparent" };
    return { ar: `${P("من أجداده", "من جداته")} (${da} أجيال)`, en: `ancestor (${da})` };
  }
  // إخوة
  if (da === 1 && db === 1) return { ar: P("أخوه", "أخته"), en: "sibling" };
  // عم / خال (فرق أجيال)
  if (da === 1) return { ar: P("عمّه", "عمّته"), en: "uncle/aunt" };
  if (db === 1) return { ar: P("ابن أخيه", "بنت أخيه"), en: "nephew/niece" };

  const cousinDeg = Math.min(da, db) - 1;
  const removed = Math.abs(da - db);
  const base =
    cousinDeg === 1
      ? P("ابن عمّه", "بنت عمّه")
      : `${P("ابن", "بنت")} عمّه من الدرجة ${ordinalAr(cousinDeg)}`;
  return {
    ar: removed === 0 ? base : `${base} (بفارق ${removed} جيل)`,
    en: `cousin ${cousinDeg}${removed ? ` removed ${removed}` : ""}`,
  };
}
