import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Ornament } from "@/components/site/Ornament";
import { useState, useEffect, type FormEvent } from "react";
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

  // Set password state (invite / password reset flow)
  const [showSetPassword, setShowSetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [setPasswordLoading, setSetPasswordLoading] = useState(false)
  const [setPasswordError, setSetPasswordError] = useState('')

  // Detect invite / password-recovery token in the URL and wait for session
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const hash = window.location.hash;
    const isInvite = hash.includes('type=invite');
    const isRecovery = hash.includes('type=recovery');
    if (!isInvite && !isRecovery) return;

    // Listen for Supabase to finish exchanging the token
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        setShowSetPassword(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSetPasswordError(lang === 'en' ? 'Passwords do not match.' : 'كلمتا المرور غير متطابقتين.');
      return;
    }
    if (newPassword.length < 6) {
      setSetPasswordError(lang === 'en' ? 'Password must be at least 6 characters.' : 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
      return;
    }
    setSetPasswordLoading(true);
    setSetPasswordError('');
    const { error } = await getSupabase().auth.updateUser({ password: newPassword });
    if (error) {
      setSetPasswordError(error.message);
      setSetPasswordLoading(false);
      return;
    }
    // Navigate to family portal after setting password
    void navigate({ to: '/family' });
  };

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState('')

  const handleForgot = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError('')
    const { error } = await getSupabase().auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/portal`,
    })
    if (error) setForgotError(error.message)
    else setForgotSent(true)
    setForgotLoading(false)
  }

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

      const { data: profile } = await getSupabase()
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .maybeSingle();

      await navigate({ to: profile?.role === "admin" ? "/admin" : "/family" });
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

        {/* SET PASSWORD FORM — shown after clicking invite or reset link */}
        {showSetPassword && (
          <form onSubmit={handleSetPassword} className="mt-12 border border-gold/30 bg-navy-deep/60 p-8 backdrop-blur-sm">
            <h2 className="text-center text-lg uppercase tracking-[0.18em] text-gold mb-2">
              {lang === 'en' ? 'Set Your Password' : 'تعيين كلمة المرور'}
            </h2>
            <p className="text-center text-xs text-cream/50 mb-6">
              {lang === 'en' ? 'Choose a password to access the family portal.' : 'اختر كلمة مرور للوصول إلى بوابة العائلة.'}
            </p>
            <label className="block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-cream/70">
                {lang === 'en' ? 'New Password' : 'كلمة المرور الجديدة'}
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-cream/70">
                {lang === 'en' ? 'Confirm Password' : 'تأكيد كلمة المرور'}
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
              />
            </label>
            {setPasswordError && <p className="mt-3 text-sm text-red-400">{setPasswordError}</p>}
            <button
              type="submit"
              disabled={setPasswordLoading}
              className="btn-gold mt-8 w-full justify-center disabled:opacity-50"
            >
              {setPasswordLoading
                ? (lang === 'en' ? 'Saving...' : 'جاري الحفظ...')
                : (lang === 'en' ? 'Set Password & Enter' : 'تعيين كلمة المرور والدخول')}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {showForgot && (
          <form onSubmit={handleForgot} className="mt-12 border border-gold/30 bg-navy-deep/60 p-8 backdrop-blur-sm">
            <h2 className="text-center text-lg uppercase tracking-[0.18em] text-gold mb-6">
              {lang === 'en' ? 'Reset Password' : 'إعادة تعيين كلمة السر'}
            </h2>
            {forgotSent ? (
              <p className="text-center text-sm text-cream/80">
                {lang === 'en' ? 'Check your email for a reset link.' : 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة التعيين.'}
              </p>
            ) : (
              <>
                <label className="block">
                  <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-cream/70">{lang === 'en' ? 'Email' : 'البريد الإلكتروني'}</span>
                  <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full border border-cream/20 bg-transparent px-4 py-3 text-cream outline-none transition-colors focus:border-gold" />
                </label>
                {forgotError && <p className="mt-3 text-sm text-red-400">{forgotError}</p>}
                <button type="submit" disabled={forgotLoading} className="btn-gold mt-6 w-full justify-center disabled:opacity-50">
                  {forgotLoading ? '...' : lang === 'en' ? 'Send Reset Link' : 'إرسال رابط الإعادة'}
                </button>
              </>
            )}
            <button type="button" onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
              className="mt-4 w-full text-center text-xs text-cream/50 hover:text-cream">
              {lang === 'en' ? '← Back to sign in' : '← العودة لتسجيل الدخول'}
            </button>
          </form>
        )}

        {/* LOGIN FORM */}
        {!showRequest && !showForgot && !showSetPassword && (
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
              <button type="button" onClick={() => setShowForgot(true)} className="text-cream/60 hover:text-gold">
                {t(c.forgot, lang)}
              </button>
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
        {showRequest && !reqSuccess && !showForgot && (
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