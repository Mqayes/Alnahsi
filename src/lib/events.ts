/** أنواع مناسبات العائلة */
export const EVENT_TYPES = {
  birth: {
    ar: "مولود جديد",
    en: "New birth",
    icon: "🍼",
    color: "bg-emerald-100 text-emerald-800",
  },
  marriage: { ar: "زواج", en: "Marriage", icon: "💍", color: "bg-amber-100 text-amber-800" },
  death: { ar: "وفاة", en: "Passing", icon: "🕊", color: "bg-navy/10 text-navy" },
  graduation: { ar: "تخرج", en: "Graduation", icon: "🎓", color: "bg-sky-100 text-sky-800" },
  achievement: {
    ar: "إنجاز",
    en: "Achievement",
    icon: "🏆",
    color: "bg-purple-100 text-purple-800",
  },
  gathering: {
    ar: "لقاء عائلي",
    en: "Family gathering",
    icon: "🏡",
    color: "bg-orange-100 text-orange-800",
  },
  general: { ar: "عام", en: "General", icon: "📰", color: "bg-gold/15 text-gold" },
} as const;
export type EventType = keyof typeof EVENT_TYPES;
