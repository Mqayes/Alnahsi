import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Ornament } from "@/components/site/Ornament";
import { useState, type FormEvent } from "react";
import { getSupabase, isSupabaseConfigured, withTimeout } from "@/lib/supabase";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Family Portal — Al Bukhuf Alnahsi" },
      { name: "description", content: "Private portal for members of the Al Bukhuf Alnahsi family." },
      { property: "og:title", content: "Family Portal — Al Bukhuf Alnahsi" },
      { property: "og:description", content: "Private — for family members." },
    ],
  }),
  component: PortalPage,
});

function PortalPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const c = translations.portal;

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Request access state
  const [showRequest, setShowRequest] = useState(false)
  const [reqName, setReqName] = useState('')
  const [reqEmail, setReqEmail] = useState('')
  const [reqRelation, setReqRelation] = useState('')
  const [reqMessage, setReqMessage] = useState('')
  const [reqLoading, setReqLoading] = useState(false)
  const [reqSuccess, setReqSuccess] = useState(false)
  const [reqError, setReqError] = useState('')

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    if (!isSupabaseConfigured()) {
      setLoginError(
        lang === "en"
          ? "Supabase is not configured. Check .env and restart the dev server."
          : "لم يتم إعداد Supabase. تحقق من ملف .env وأعد تشغيل الخادم.",
      );
      setLoginLoading(false);
      return;
    }

    try {
      const { data, error } = await withTimeout(
        getSupabase().auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        15_000,
        "Sign in",
      );

      if (error) {
        setLoginError(
          lang === "en"
            ? `Sign in failed: ${error.message}`
            : `فشل تسجيل الدخول: ${error.message}`,
        );
        return;
      }

      if (!data.session) {
        setLoginError(
          lang === "en"
            ? "Sign in failed: no session returned."
            : "فشل تسجيل الدخول: لم يتم إنشاء جلسة.",
        );
        return;
      }

      await navigate({ to: "/admin" });
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : lang === "en"
            ? "Sign in failed. Please try again."
            : "فشل تسجيل الدخول. حاول مرة أخرى.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReqLoading(true);
    setReqError("");

    if (!isSupabaseConfigured()) {
      setReqError(
        lang === "en"
          ? "Supabase is not configured. Check .env and restart the dev server."
          : "لم يتم إعداد Supabase. تحقق من ملف .env وأعد تشغيل الخادم.",
      );
      setReqLoading(false);
      return;
    }

    const { error } = await getSupabase().from("join_requests").insert({
      full_name_en: reqName,
      email: reqEmail,
      message: reqMessage ? `${reqRelation ? `Relation: ${reqRelation}\n\n` : ""}${reqMessage}` : reqRelation || null,
      status: "pending",
    });
    if (error) {
      if (error.code === '23505') {
        setReqError(lang === 'en' ? 'A request with this email has already been submitted.' : 'تم إرسال طلب بهذا البريد الإلكتروني من قبل.')
      } else {
        setReqError(lang === 'en' ? 'Something went wrong. Please try again.' : 'حدث خطأ. حاول مرة أخرى.')
      }
      console.error(error)
    } else {
      setReqSuccess(true)
    }
    setReqLoading(false)
  }

  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-navy py-32 text-cream">
      <div className="absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#D4AF37_1px,transparent_0)] [background-size:36px_36px]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy via-navy to-navy-deep" />

      <div className="mx-auto w-full max-w-md px-6">
        <div className="text-center">
          <span className="font-arabic text-6xl text-gold">ال النحسي
</span>
          <Ornament className="mt-6" />
          <h1 className="mt-6 text-cream text-3xl md:text-4xl">{t(c.title, lang)}</h1>
          <p className="mt-3 text-sm italic text-cream/70">{t(c.sub, lang)}</p>
        </div>

        {/* LOGIN FORM */}
        {!showRequest && (
          <form
            onSubmit={handleLogin}
            className="mt-12 border border-gold/30 bg-navy-deep/60 p-8 backdrop-blur-sm"
          >
            <label className="block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-cream/70">
                {t(c.email, lang)}
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-cream/70">
                {t(c.password, lang)}
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
              />
            </label>
            {loginError && (
              <p className="mt-3 text-sm text-red-400">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="btn-gold mt-8 w-full justify-center disabled:opacity-50"
            >
              {loginLoading ? '...' : t(c.signIn, lang)}
            </button>
            <div className="mt-6 flex items-center justify-between text-xs font-serif-display uppercase tracking-[0.18em]">
              <a href="#" className="text-cream/60 hover:text-gold">
                {t(c.forgot, lang)}
              </a>
              <button
                type="button"
                onClick={() => setShowRequest(true)}
                className="text-gold hover:text-cream"
              >
                {t(c.request, lang)}
              </button>
            </div>
          </form>
        )}

        {/* REQUEST ACCESS FORM */}
        {showRequest && !reqSuccess && (
          <form
            onSubmit={handleRequest}
            className="mt-12 border border-gold/30 bg-navy-deep/60 p-8 backdrop-blur-sm"
          >
            <h2 className="text-center text-lg uppercase tracking-[0.18em] text-gold mb-6">
              {lang === 'en' ? 'Request Family Access' : 'طلب الانضمام للعائلة'}
            </h2>
            <label className="block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-cream/70">
                {lang === 'en' ? 'Full Name' : 'الاسم الكامل'}
              </span>
              <input
                type="text"
                required
                value={reqName}
                onChange={(e) => setReqName(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-cream/70">
                {lang === 'en' ? 'Email' : 'البريد الإلكتروني'}
              </span>
              <input
                type="email"
                required
                value={reqEmail}
                onChange={(e) => setReqEmail(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-cream/70">
                {lang === 'en' ? 'Relation to Family' : 'صلة القرابة'}
              </span>
              <input
                type="text"
                value={reqRelation}
                onChange={(e) => setReqRelation(e.target.value)}
                placeholder={lang === 'en' ? 'e.g. Son of Ibrahim' : 'مثال: ابن إبراهيم'}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-cream outline-none transition-colors focus:border-gold placeholder:text-cream/30"
              />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-cream/70">
                {lang === 'en' ? 'Message (optional)' : 'رسالة (اختياري)'}
              </span>
              <textarea
                rows={3}
                value={reqMessage}
                onChange={(e) => setReqMessage(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
              />
            </label>
            {reqError && (
              <p className="mt-3 text-sm text-red-400">{reqError}</p>
            )}
            <button
              type="submit"
              disabled={reqLoading}
              className="btn-gold mt-8 w-full justify-center disabled:opacity-50"
            >
              {reqLoading ? '...' : lang === 'en' ? 'Send Request' : 'إرسال الطلب'}
            </button>
            <button
              type="button"
              onClick={() => setShowRequest(false)}
              className="mt-4 w-full text-center text-xs text-cream/50 hover:text-cream"
            >
              {lang === 'en' ? '← Back to sign in' : '← العودة لتسجيل الدخول'}
            </button>
          </form>
        )}

        {/* SUCCESS MESSAGE */}
        {reqSuccess && (
          <div className="mt-12 border border-gold/30 bg-navy-deep/60 p-8 text-center backdrop-blur-sm">
            <p className="text-2xl text-gold mb-4">✓</p>
            <h2 className="text-lg uppercase tracking-[0.18em] text-cream mb-3">
              {lang === 'en' ? 'Request Sent' : 'تم إرسال الطلب'}
            </h2>
            <p className="text-sm text-cream/70">
              {lang === 'en'
                ? 'Your request has been received. The admin will review it and send you an invite by email.'
                : 'تم استلام طلبك. سيقوم المسؤول بمراجعته وإرسال دعوة إلى بريدك الإلكتروني.'}
            </p>
            <button
              onClick={() => { setShowRequest(false); setReqSuccess(false); }}
              className="mt-6 text-xs text-gold hover:text-cream"
            >
              {lang === 'en' ? '← Back to sign in' : '← العودة لتسجيل الدخول'}
            </button>
          </div>
        )}

        <p className="mt-10 text-center text-xs italic text-cream/50">{t(c.notice, lang)}</p>

        <div className="mt-10 text-center">
          <Link
            to="/"
            className="font-serif-display text-xs uppercase tracking-[0.22em] text-cream/60 hover:text-gold"
          >
            ← {lang === "en" ? "Return Home" : "العودة للرئيسية"}
          </Link>
        </div>
      </div>
    </section>
  );
}