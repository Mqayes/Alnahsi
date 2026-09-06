import type { PersonRow } from "@/components/tree/PersonCard";

/** يصدّر الشجرة بصيغة GEDCOM 5.5.1 العالمية */
export function toGedcom(rows: PersonRow[], familyName = "Al Bukhuf Alnahsi"): string {
  const idx = new Map(rows.map((r, i) => [r.id, `I${i + 1}`]));
  const out: string[] = [
    "0 HEAD",
    "1 SOUR ALNAHSI",
    "2 NAME alnahsi.com",
    "1 GEDC",
    "2 VERS 5.5.1",
    "2 FORM LINEAGE-LINKED",
    "1 CHAR UTF-8",
    `1 NOTE ${familyName}`,
    `1 DATE ${new Date().toISOString().slice(0, 10)}`,
  ];
  // families: one per father with children
  const fams = new Map<string, PersonRow[]>();
  rows.forEach((r) => {
    if (r.parent_id) {
      const a = fams.get(r.parent_id) ?? [];
      a.push(r);
      fams.set(r.parent_id, a);
    }
  });
  const famId = new Map([...fams.keys()].map((pid, i) => [pid, `F${i + 1}`]));

  rows.forEach((r) => {
    const id = idx.get(r.id)!;
    const given = r.first_name || (r.full_name_ar || r.full_name_en || "").split(/\s+/)[0] || "";
    out.push(`0 @${id}@ INDI`);
    out.push(`1 NAME ${given} /${familyName}/`);
    if (r.full_name_ar) out.push(`2 GIVN ${r.full_name_ar}`);
    out.push(`1 SEX ${r.gender === "f" ? "F" : "M"}`);
    if (r.birth_year) {
      out.push("1 BIRT");
      out.push(`2 DATE ${r.birth_year}`);
      if (r.city) out.push(`2 PLAC ${r.city}`);
    }
    if (r.is_deceased || r.death_year) {
      out.push("1 DEAT");
      if (r.death_year) out.push(`2 DATE ${r.death_year}`);
      if (r.death_cause) out.push(`2 CAUS ${r.death_cause}`);
    }
    if (r.occupation) out.push(`1 OCCU ${r.occupation}`);
    if (r.notes) out.push(`1 NOTE ${r.notes.replace(/\n/g, " ")}`);
    if (r.parent_id && famId.has(r.parent_id)) out.push(`1 FAMC @${famId.get(r.parent_id)}@`);
    if (famId.has(r.id)) out.push(`1 FAMS @${famId.get(r.id)}@`);
  });

  fams.forEach((children, pid) => {
    const f = famId.get(pid)!;
    out.push(`0 @${f}@ FAM`);
    if (idx.has(pid)) out.push(`1 HUSB @${idx.get(pid)}@`);
    children.forEach((c) => out.push(`1 CHIL @${idx.get(c.id)}@`));
  });

  out.push("0 TRLR");
  return out.join("\n");
}

/* ─── فحص جودة البيانات ─────────────────────────────────────── */
export type Issue = { id: string; name: string; level: "error" | "warn"; text: string };

export function auditTree(rows: PersonRow[]): Issue[] {
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  const issues: Issue[] = [];
  const nm = (r: PersonRow) => r.full_name_ar || r.full_name_en;
  const year = new Date().getFullYear();

  const seen = new Map<string, PersonRow[]>();
  rows.forEach((r) => {
    const key = `${(r.full_name_ar || r.full_name_en || "").trim()}|${r.parent_id ?? ""}`;
    seen.set(key, [...(seen.get(key) ?? []), r]);
  });
  seen.forEach((list) => {
    if (list.length > 1)
      list.forEach((r) =>
        issues.push({
          id: r.id,
          name: nm(r),
          level: "warn",
          text: `اسم مكرر تحت نفس الأب (${list.length} مرات)`,
        }),
      );
  });

  rows.forEach((r) => {
    const f = r.parent_id ? byId[r.parent_id] : undefined;
    if (r.birth_year && (r.birth_year < 1700 || r.birth_year > year))
      issues.push({
        id: r.id,
        name: nm(r),
        level: "error",
        text: `سنة ميلاد غير منطقية (${r.birth_year})`,
      });
    if (r.death_year && r.birth_year && r.death_year < r.birth_year)
      issues.push({ id: r.id, name: nm(r), level: "error", text: "سنة الوفاة قبل الميلاد" });
    if (r.death_year && r.birth_year && r.death_year - r.birth_year > 120)
      issues.push({ id: r.id, name: nm(r), level: "warn", text: "عمر يتجاوز 120 سنة" });
    if (f?.birth_year && r.birth_year) {
      const gap = r.birth_year - f.birth_year;
      if (gap <= 0)
        issues.push({
          id: r.id,
          name: nm(r),
          level: "error",
          text: `مولود قبل أبيه أو بنفس سنته (${f.birth_year})`,
        });
      else if (gap < 14)
        issues.push({
          id: r.id,
          name: nm(r),
          level: "warn",
          text: `فارق صغير عن الأب (${gap} سنة)`,
        });
      else if (gap > 70)
        issues.push({
          id: r.id,
          name: nm(r),
          level: "warn",
          text: `فارق كبير عن الأب (${gap} سنة)`,
        });
    }
    if (f?.death_year && r.birth_year && r.birth_year > f.death_year + 1)
      issues.push({ id: r.id, name: nm(r), level: "error", text: "مولود بعد وفاة الأب" });
    if (!r.birth_year)
      issues.push({ id: r.id, name: nm(r), level: "warn", text: "سنة الميلاد غير مسجّلة" });
    if (r.gender === "f" && rows.some((c) => c.parent_id === r.id))
      issues.push({ id: r.id, name: nm(r), level: "warn", text: "أنثى مسجّلة كأب لأفراد" });
    // دورة في النسب
    const seenIds = new Set<string>();
    let cur = r.parent_id ? byId[r.parent_id] : undefined;
    while (cur) {
      if (seenIds.has(cur.id) || cur.id === r.id) {
        issues.push({ id: r.id, name: nm(r), level: "error", text: "دورة في سلسلة النسب" });
        break;
      }
      seenIds.add(cur.id);
      cur = cur.parent_id ? byId[cur.parent_id] : undefined;
    }
  });
  return issues;
}

/* ─── تقويم المناسبات ───────────────────────────────────────── */
export type CalItem = {
  id: string;
  name: string;
  kind: "birthday" | "memorial" | "anniversary";
  label: string;
  years: number;
};

export function upcomingEvents(rows: PersonRow[], monthsAhead = 2): CalItem[] {
  const now = new Date(),
    y = now.getFullYear();
  const out: CalItem[] = [];
  rows.forEach((r) => {
    const nm = r.full_name_ar || r.full_name_en;
    if (r.birth_year && !r.is_deceased)
      out.push({
        id: r.id,
        name: nm,
        kind: "birthday",
        label: `${y - r.birth_year} سنة`,
        years: y - r.birth_year,
      });
    if (r.death_year)
      out.push({
        id: r.id,
        name: nm,
        kind: "memorial",
        label: `مرّت ${y - r.death_year} سنة`,
        years: y - r.death_year,
      });
    if (r.marriage_year)
      out.push({
        id: r.id,
        name: nm,
        kind: "anniversary",
        label: `${y - r.marriage_year} سنة زواج`,
        years: y - r.marriage_year,
      });
  });
  void monthsAhead;
  return out.sort((a, b) => a.years - b.years);
}
