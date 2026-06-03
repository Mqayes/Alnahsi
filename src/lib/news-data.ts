export type NewsItem = {
  id: string;
  created_at: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  cover_image?: string | null;
};

/** Shown when Supabase has no rows or is not connected yet */
export const fallbackNews: NewsItem[] = [
  {
    id: "fallback-1",
    created_at: "2026-05-15T00:00:00.000Z",
    title_en: "Scholarship Program Launches",
    title_ar: "إطلاق برنامج المنح الدراسية",
    content_en:
      "The Alnahsi Family Foundation is proud to announce a scholarship program for outstanding students in engineering, medicine, and business.",
    content_ar:
      "يسعد وقف عائلة آل النحسي أن يعلن عن برنامج منح دراسية للطلاب المتميزين في الهندسة والطب وإدارة الأعمال.",
  },
  {
    id: "fallback-2",
    created_at: "2026-03-01T00:00:00.000Z",
    title_en: "Family Gathering — Riyadh",
    title_ar: "لقاء العائلة — الرياض",
    content_en:
      "Members of the family are invited to our annual gathering this spring. Details will be shared through the family portal.",
    content_ar:
      "يدعى أفراد العائلة إلى لقائنا السنوي هذا الربيع. ستُشارك التفاصيل عبر بوابة العائلة.",
  },
];
