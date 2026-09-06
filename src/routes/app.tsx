import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Ornament } from "@/components/site/Ornament";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "حمّل تطبيق آل بوخف الناهسي" },
      {
        name: "description",
        content:
          "ثبّت تطبيق عائلة آل بوخف الناهسي على جوالك — شجرة العائلة والأخبار والمناسبات في تطبيق واحد.",
      },
      { property: "og:title", content: "تطبيق آل بوخف الناهسي" },
      {
        property: "og:description",
        content: "شجرة العائلة والأخبار والمناسبات — ثبّته على شاشتك الرئيسية بخطوتين.",
      },
      { property: "og:image", content: "/icon-512.png" },
    ],
  }),
  component: AppInstallPage,
});

type OS = "ios" | "android" | "desktop";

function AppInstallPage() {
  const { lang } = useLang();
  const ar = lang !== "en";
  const [os, setOs] = useState<OS>("desktop");
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<{ prompt: () => void } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setOs(/iPad|iPhone|iPod/.test(ua) ? "ios" : /Android/i.test(ua) ? "android" : "desktop");
    setInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true,
    );
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as unknown as { prompt: () => void });
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const url = typeof window !== "undefined" ? `${window.location.origin}/app` : "";
  const waText = ar
    ? `تطبيق عائلة آل بوخف الناهسي 🌳\nشجرة العائلة والأخبار والمناسبات في تطبيق واحد.\nافتح الرابط وثبّته على جوالك بخطوتين:\n${url}`
    : `Al Bukhuf Alnahsi family app 🌳\n${url}`;

  const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <li className="flex gap-3 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold font-bold text-navy">
        {n}
      </span>
      <span className="text-navy/80">{children}</span>
    </li>
  );

  return (
    <main dir={ar ? "rtl" : "ltr"} className="min-h-screen bg-parchment px-5 pb-20 pt-28">
      <div className="mx-auto max-w-lg text-center">
        <img
          src="/icon-512.png"
          alt=""
          className="mx-auto h-24 w-24 rounded-3xl shadow-[0_12px_40px_rgba(20,36,58,.25)]"
        />
        <h1 className="mt-5 font-arabic text-4xl text-navy">
          {ar ? "تطبيق آل بوخف الناهسي" : "Al Bukhuf Alnahsi App"}
        </h1>
        <Ornament className="mt-4" />
        <p className="mt-4 text-navy/70">
          {ar
            ? "شجرة العائلة، الأخبار، المناسبات، وبوابة الأعضاء — في تطبيق على شاشتك الرئيسية."
            : "Family tree, news, occasions and the member portal — on your home screen."}
        </p>
        <p className="mt-2 text-xs text-navy/45">
          {ar ? "بلا متجر تطبيقات · بلا تحميل ثقيل · مجاناً" : "No app store · lightweight · free"}
        </p>

        {installed ? (
          <div className="premium-card mt-8 p-6 text-green-700">
            {ar ? "✓ التطبيق مثبّت على جهازك" : "✓ Installed"}
          </div>
        ) : (
          <div className="premium-card mt-8 p-6 text-start">
            {os === "ios" && (
              <>
                <h2 className="font-arabic text-xl text-navy">
                  {ar ? "التثبيت على iPhone" : "Install on iPhone"}
                </h2>
                <ol className="mt-2 divide-y divide-gold/10">
                  <Step n={1}>
                    {ar ? (
                      <>
                        افتح هذه الصفحة في متصفح <b>سفاري</b>
                      </>
                    ) : (
                      "Open in Safari"
                    )}
                  </Step>
                  <Step n={2}>
                    {ar ? (
                      <>
                        اضغط زر <b>المشاركة</b>{" "}
                        <span className="rounded bg-parchment px-1.5">􀈂</span> في الأسفل
                      </>
                    ) : (
                      "Tap the Share button"
                    )}
                  </Step>
                  <Step n={3}>
                    {ar ? (
                      <>
                        اختر <b>«إضافة إلى الشاشة الرئيسية»</b> ثم <b>إضافة</b>
                      </>
                    ) : (
                      "Choose ‘Add to Home Screen’"
                    )}
                  </Step>
                </ol>
              </>
            )}
            {os === "android" && (
              <>
                <h2 className="font-arabic text-xl text-navy">
                  {ar ? "التثبيت على أندرويد" : "Install on Android"}
                </h2>
                {prompt ? (
                  <button onClick={() => prompt.prompt()} className="btn-gold mt-4 w-full">
                    {ar ? "⬇ تثبيت التطبيق الآن" : "⬇ Install now"}
                  </button>
                ) : (
                  <ol className="mt-2 divide-y divide-gold/10">
                    <Step n={1}>
                      {ar ? (
                        <>
                          اضغط قائمة المتصفح <b>⋮</b>
                        </>
                      ) : (
                        "Open browser menu ⋮"
                      )}
                    </Step>
                    <Step n={2}>
                      {ar ? (
                        <>
                          اختر <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>
                        </>
                      ) : (
                        "Choose ‘Install app’"
                      )}
                    </Step>
                  </ol>
                )}
              </>
            )}
            {os === "desktop" && (
              <>
                <h2 className="font-arabic text-xl text-navy">
                  {ar ? "افتح الرابط من جوالك" : "Open on your phone"}
                </h2>
                <p className="mt-2 text-sm text-navy/70">
                  {ar ? "امسح الرمز بكاميرا جوالك لتثبيت التطبيق:" : "Scan with your phone camera:"}
                </p>
                <img
                  alt="QR"
                  className="mx-auto mt-4 rounded-xl border border-gold/30 bg-white p-2"
                  width={220}
                  height={220}
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`}
                />
                {prompt && (
                  <button onClick={() => prompt.prompt()} className="btn-gold mt-5 w-full">
                    {ar ? "⬇ تثبيت على هذا الجهاز" : "⬇ Install here"}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-gold"
          >
            {ar ? "شارك التطبيق عبر واتساب" : "Share on WhatsApp"}
          </a>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(url);
              setCopied(true);
            }}
            className="btn-outline-navy"
          >
            {copied ? (ar ? "✓ نُسخ الرابط" : "✓ Copied") : ar ? "نسخ الرابط" : "Copy link"}
          </button>
        </div>
        <a href="/" className="mt-8 inline-block text-sm text-navy/50 hover:text-gold">
          {ar ? "← تصفّح الموقع" : "← Browse site"}
        </a>
      </div>
    </main>
  );
}
