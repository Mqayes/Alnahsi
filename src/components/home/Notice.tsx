import { useSiteContent } from "@/lib/site-content";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Reveal } from "@/components/site/Reveal";

/** مربع إعلاني في الرئيسية — يُدار من الإعدادات: notice_enabled / notice_title / notice_text / notice_contact */
export function Notice() {
  const sc = useSiteContent();
  const { lang } = useLang();
  const ar = lang !== "en";
  if (sc["notice_enabled"] === "false") return null;

  const title = sc["notice_title_ar"] || (ar ? "تنبيه للأعضاء" : "Notice for members");
  const text =
    sc["notice_text_ar"] ||
    (ar
      ? "إذا سجّلت في بوابة العائلة فأرسل لنا رسالة لتفعيل حسابك. وإذا واجهت أي مشكلة في الموقع راسلنا وسنساعدك."
      : "If you registered in the family portal, message us to activate your account. If you face any issue, contact us.");
  const phone = (sc["contact_phone"] || "").replace(/\D/g, "");
  const email = sc["contact_email"] || "";
  const wa = phone ? `https://wa.me/${phone.startsWith("0") ? "966" + phone.slice(1) : phone}` : "";

  return (
    <section className="bg-parchment px-5 pb-4 pt-8" dir={ar ? "rtl" : "ltr"}>
      <Reveal>
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-l from-[#FFF8E6] via-white to-[#FAF0D0] p-5 shadow-[0_10px_40px_rgba(207,169,58,0.18)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold/15 text-2xl">
              📣
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-arabic text-xl text-navy md:text-2xl">{title}</h3>
              <p className="mt-1 leading-relaxed text-navy/70">{text}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-gold !px-4 !py-2.5 !text-sm"
                >
                  {ar ? "واتساب" : "WhatsApp"}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="btn-outline-navy !px-4 !py-2.5 !text-sm">
                  {ar ? "راسلنا" : "Email us"}
                </a>
              )}
              {!wa && !email && (
                <a href="/contact" className="btn-outline-navy !px-4 !py-2.5 !text-sm">
                  {ar ? "تواصل معنا" : "Contact us"}
                </a>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
