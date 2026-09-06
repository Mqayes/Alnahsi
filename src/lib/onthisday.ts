import type { PersonRow } from "@/components/tree/PersonCard";

export type Highlight = {
  kind: "birthday" | "memorial" | "anniversary" | "gap" | "milestone";
  icon: string;
  text: string;
  memberId?: string;
  weight: number;
};

const cur = () => new Date().getFullYear();

/** يبني قائمة "في مثل هذا الوقت" من بيانات الشجرة */
export function buildHighlights(rows: PersonRow[], ar = true): Highlight[] {
  const y = cur();
  const nm = (r: PersonRow) =>
    r.full_name_ar || r.full_name_en || (ar ? "أحد أفراد العائلة" : "A member");
  const out: Highlight[] = [];

  rows.forEach((r) => {
    if (r.birth_year && !r.is_deceased) {
      const age = y - r.birth_year;
      if (age > 0 && age % 10 === 0)
        out.push({
          kind: "milestone",
          icon: "🎈",
          memberId: r.id,
          weight: 9,
          text: ar ? `${nm(r)} يكمل ${age} عاماً هذا العام` : `${nm(r)} turns ${age}`,
        });
      else if (age > 0)
        out.push({
          kind: "birthday",
          icon: "🎂",
          memberId: r.id,
          weight: 4,
          text: ar ? `${nm(r)} عمره ${age} عاماً` : `${nm(r)} is ${age}`,
        });
    }
    if (r.death_year) {
      const since = y - r.death_year;
      if (since > 0)
        out.push({
          kind: "memorial",
          icon: "🕊",
          memberId: r.id,
          weight: since % 5 === 0 ? 8 : 5,
          text: ar
            ? `مضى ${since} ${since === 1 ? "عام" : "أعوام"} على رحيل ${nm(r)} — رحمه الله`
            : `${since}y since ${nm(r)} passed`,
        });
    }
    if (r.marriage_year) {
      const yrs = y - r.marriage_year;
      if (yrs > 0)
        out.push({
          kind: "anniversary",
          icon: "💍",
          memberId: r.id,
          weight: yrs % 5 === 0 ? 7 : 3,
          text: ar ? `${nm(r)} أتم ${yrs} عاماً على زواجه` : `${nm(r)}: ${yrs} years married`,
        });
    }
    if (!r.birth_year)
      out.push({
        kind: "gap",
        icon: "❓",
        memberId: r.id,
        weight: 6,
        text: ar ? `سنة ميلاد ${nm(r)} غير مسجّلة — تعرفها؟` : `${nm(r)}'s birth year is missing`,
      });
    if (!r.city && r.birth_year)
      out.push({
        kind: "gap",
        icon: "📍",
        memberId: r.id,
        weight: 2,
        text: ar ? `مدينة ${nm(r)} غير مسجّلة` : `${nm(r)}'s city is missing`,
      });
  });

  // ترتيب شبه عشوائي ثابت لكل أسبوع
  const week = Math.floor(Date.now() / (7 * 864e5));
  return out
    .map((h, i) => ({ h, k: (i * 2654435761 + week * 40503) % 1000 }))
    .sort((a, b) => b.h.weight - a.h.weight || a.k - b.k)
    .map((x) => x.h);
}
