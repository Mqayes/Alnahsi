import { useSiteContent } from "@/lib/site-content";
import { useLang } from "@/lib/i18n/LanguageContext";

/** شريط تنبيه زجاجي أعلى الواجهة الأولى — يُدار من الإعدادات (المربع الإعلاني) */
export function HeroNotice() {
  const sc = useSiteContent();
  const { lang } = useLang();
  const ar = lang !== "en";
  if (sc["sec_notice"] === "false") return null;
  const title = sc["notice_title_ar"] || (ar ? "تنبيه للأعضاء" : "Notice");
  const text =
    sc["notice_text_ar"] ||
    (ar
      ? "إذا سجّلت في بوابة العائلة فأرسل لنا رسالة لتفعيل حسابك، وإذا واجهت مشكلة راسلنا."
      : "Registered? Message us to activate your account. Facing an issue? Contact us.");
  const phone = (sc["contact_phone"] || "").replace(/\D/g, "");
  const wa = phone ? `https://wa.me/${phone.startsWith("0") ? "966" + phone.slice(1) : phone}` : "";
  const email = sc["contact_email"] || "";
  const href = wa || (email ? `mailto:${email}` : "/contact");

  return (
    <a
      href={href}
      target={wa ? "_blank" : undefined}
      rel="noreferrer"
      className="animate-fade-in mb-5 inline-flex max-w-2xl items-center gap-3 rounded-2xl border border-[#F0CC60]/50 bg-[rgba(10,20,34,0.62)] px-4 py-3 text-start shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-[#F0CC60]"
      dir={ar ? "rtl" : "ltr"}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0CC60]/20 text-lg">
        📣
      </span>
      <span className="min-w-0">
        <span className="block font-arabic text-base text-[#F0CC60]">{title}</span>
        <span className="block text-xs leading-relaxed text-[#FFF8E6]/85">{text}</span>
      </span>
      <span className="ms-1 shrink-0 rounded-lg bg-gradient-to-br from-[#E2BC4A] to-[#B8860B] px-3 py-1.5 text-xs font-bold text-navy">
        {wa ? (ar ? "واتساب" : "WhatsApp") : ar ? "راسلنا" : "Contact"}
      </span>
    </a>
  );
}
