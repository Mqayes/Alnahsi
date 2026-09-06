import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Ornament } from "@/components/site/Ornament";
import { useState, useEffect, type FormEvent } from "react";
import { getSupabase, isSupabaseConfigured, withTimeout } from "@/lib/supabase";
import { AddToTreeModal } from "@/components/tree/AddToTreeModal";
import type { LineageRow } from "@/lib/lineage";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Family Portal — Al Bukhuf Alnahsi" },
      {
        name: "description",
        content: "Private portal for members of the Al Bukhuf Alnahsi family.",
      },
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Set password state (invite / password reset flow)
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState("");

  // Detect invite / password-recovery token in the URL and wait for session
  // من لديه جلسة لكنه لم يُنشئ كلمة مرور بعد → اطلبها
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    (async () => {
      const {
        data: { session },
      } = await getSupabase().auth.getSession();
      if (!session) return;
      const { data } = await getSupabase()
        .from("profiles")
        .select("password_set")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data && (data as { password_set?: boolean | null }).password_set === false)
        setShowSetPassword(true);
    })();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const hash = window.location.hash;
    const isInvite = hash.includes("type=invite");
    const isRecovery = hash.includes("type=recovery");
    const isMagic =
      hash.includes("type=magiclink") ||
      hash.includes("type=signup") ||
      hash.includes("access_token=");
    if (!isInvite && !isRecovery && !isMagic) return;

    // Listen for Supabase to finish exchanging the token
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
        setShowSetPassword(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSetPasswordError(
        lang === "en" ? "Passwords do not match." : "كلمتا المرور غير متطابقتين.",
      );
      return;
    }
    if (newPassword.length < 6) {
      setSetPasswordError(
        lang === "en"
          ? "Password must be at least 6 characters."
          : "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
      );
      return;
    }
    setSetPasswordLoading(true);
    setSetPasswordError("");
    const { error } = await getSupabase().auth.updateUser({ password: newPassword });
    if (error) {
      setSetPasswordError(error.message);
      setSetPasswordLoading(false);
      return;
    }
    // سجّل أن كلمة المرور أُنشئت، ثم إلى لوحة العضو (أو لوحة التحكم للإدارة)
    const {
      data: { session },
    } = await getSupabase().auth.getSession();
    if (session) {
      await getSupabase().from("profiles").update({ password_set: true }).eq("id", session.user.id);
      const { data: prof } = await getSupabase()
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      void navigate({
        to: ["owner", "admin", "moderator"].includes(prof?.role ?? "") ? "/admin" : "/family",
      });
      return;
    }
    void navigate({ to: "/family" });
  };

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleForgot = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    const mail = forgotEmail.trim();
    // رابط دخول واحد يعمل للمسجّل وغير المسجّل: يُنشئ الحساب إن لم يكن موجوداً،
    // وعند الوصول يُطلب تعيين كلمة مرور جديدة (نيّة الاستعادة محفوظة محلياً)
    try {
      window.localStorage.setItem("alnahsi_pw_reset_intent", "1");
    } catch {
      /* ignore */
    }
    const { error } = await getSupabase().auth.signInWithOtp({
      email: mail,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/portal` },
    });
    if (error) setForgotError(error.message);
    else setForgotSent(true);
    setForgotLoading(false);
  };

  // رابط دخول سحري بدل كلمة المرور
  const [magicSent, setMagicSent] = useState(false);
  const sendMagic = async () => {
    const mail = email.trim();
    if (!email) {
      setLoginError(lang === "en" ? "Enter your email first." : "أدخل بريدك أولاً.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    const { error } = await getSupabase().auth.signInWithOtp({
      email: mail,
      options: { emailRedirectTo: `${window.location.origin}/portal` },
    });
    setLoginLoading(false);
    if (error) setLoginError(error.message);
    else setMagicSent(true);
  };

  // Request access state
  const [showRequest, setShowRequest] = useState(false);
  const [treeById, setTreeById] = useState<Record<string, LineageRow>>({});
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    getSupabase()
      .from("family_members")
      .select("id, full_name_ar, full_name_en, first_name, parent_id, generation, gender")
      .then(({ data }) => {
        setTreeById(Object.fromEntries(((data ?? []) as LineageRow[]).map((r) => [r.id, r])));
      });
  }, []);
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqRelation, setReqRelation] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [reqLoading, setReqLoading] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState("");

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
          lang === "en" ? `Sign in failed: ${error.message}` : `فشل تسجيل الدخول: ${error.message}`,
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

      let st: string | undefined;
      try {
        const { data: ex } = await getSupabase()
          .from("profiles")
          .select("status")
          .eq("id", data.session.user.id)
          .maybeSingle();
        st = (ex as { status?: string } | null)?.status;
      } catch {
        /* pre-migration */
      }
      if (st === "suspended") {
        await getSupabase().auth.signOut();
        setLoginError("تم إيقاف هذا الحساب. تواصل مع إدارة العائلة.");
        setLoginLoading(false);
        return;
      }
      await navigate({
        to: ["owner", "admin", "moderator"].includes(profile?.role ?? "") ? "/admin" : "/family",
      });
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

    const { error } = await getSupabase()
      .from("join_requests")
      .insert({
        full_name_en: reqName,
        email: reqEmail,
        message: reqMessage
          ? `${reqRelation ? `Relation: ${reqRelation}\n\n` : ""}${reqMessage}`
          : reqRelation || null,
        status: "pending",
      });
    if (error) {
      if (error.code === "23505") {
        setReqError(
          lang === "en"
            ? "A request with this email has already been submitted."
            : "تم إرسال طلب بهذا البريد الإلكتروني من قبل.",
        );
      } else {
        setReqError(
          lang === "en" ? "Something went wrong. Please try again." : "حدث خطأ. حاول مرة أخرى.",
        );
      }
      console.error(error);
    } else {
      setReqSuccess(true);
    }
    setReqLoading(false);
  };

  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-cream py-32 text-navy">
      <div className="absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#D4AF37_1px,transparent_0)] [background-size:36px_36px]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy via-navy to-navy-deep" />

      <div className="mx-auto w-full max-w-md px-6">
        <div className="text-center">
          <span className="font-arabic text-6xl text-gold">الناهسي</span>
          <Ornament className="mt-6" />
          <h1 className="mt-6 text-navy text-3xl md:text-4xl">{t(c.title, lang)}</h1>
          <p className="mt-3 text-sm italic text-navy/65">{t(c.sub, lang)}</p>
        </div>

        {/* SET PASSWORD FORM — shown after clicking invite or reset link */}
        {showSetPassword && (
          <form
            onSubmit={handleSetPassword}
            className="mt-12 border border-gold/30 bg-white/80 p-8 backdrop-blur-sm"
          >
            <h2 className="text-center text-lg uppercase tracking-[0.18em] text-gold mb-2">
              {lang === "en" ? "Set Your Password" : "تعيين كلمة المرور"}
            </h2>
            <p className="text-center text-xs text-navy/45 mb-6">
              {lang === "en"
                ? "Choose a password to access the family portal."
                : "اختر كلمة مرور للوصول إلى بوابة العائلة."}
            </p>
            <label className="block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-navy/65">
                {lang === "en" ? "New Password" : "كلمة المرور الجديدة"}
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-navy outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-navy/65">
                {lang === "en" ? "Confirm Password" : "تأكيد كلمة المرور"}
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-navy outline-none transition-colors focus:border-gold"
              />
            </label>
            {setPasswordError && <p className="mt-3 text-sm text-red-400">{setPasswordError}</p>}
            <button
              type="submit"
              disabled={setPasswordLoading}
              className="btn-gold mt-8 w-full justify-center disabled:opacity-50"
            >
              {setPasswordLoading
                ? lang === "en"
                  ? "Saving..."
                  : "جاري الحفظ..."
                : lang === "en"
                  ? "Set Password & Enter"
                  : "تعيين كلمة المرور والدخول"}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {showForgot && (
          <form
            onSubmit={handleForgot}
            className="mt-12 border border-gold/30 bg-white/80 p-8 backdrop-blur-sm"
          >
            <h2 className="text-center text-lg uppercase tracking-[0.18em] text-gold mb-6">
              {lang === "en" ? "Reset Password" : "إعادة تعيين كلمة السر"}
            </h2>
            {forgotSent ? (
              <p className="text-center text-sm text-navy/70">
                {lang === "en"
                  ? "✓ We emailed you a sign-in link. Open it, then set your new password. If you were not registered, your account has been created."
                  : "✓ أرسلنا إلى بريدك رابط دخول. افتحه ثم عيّن كلمة مرورك الجديدة. وإن لم تكن مسجّلاً فقد أُنشئ حسابك الآن."}
              </p>
            ) : (
              <>
                <label className="block">
                  <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-navy/65">
                    {lang === "en" ? "Email" : "البريد الإلكتروني"}
                  </span>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full border border-cream/20 bg-transparent px-4 py-3 text-navy outline-none transition-colors focus:border-gold"
                  />
                </label>
                {forgotError && <p className="mt-3 text-sm text-red-400">{forgotError}</p>}
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-gold mt-6 w-full justify-center disabled:opacity-50"
                >
                  {forgotLoading ? "..." : lang === "en" ? "Send Reset Link" : "إرسال رابط الإعادة"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setShowForgot(false);
                setForgotSent(false);
                setForgotEmail("");
              }}
              className="mt-4 w-full text-center text-xs text-navy/45 hover:text-navy"
            >
              {lang === "en" ? "← Back to sign in" : "← العودة لتسجيل الدخول"}
            </button>
          </form>
        )}

        {/* LOGIN FORM */}
        {!showRequest && !showForgot && !showSetPassword && (
          <form
            onSubmit={handleLogin}
            className="mt-12 border border-gold/30 bg-white/80 p-8 backdrop-blur-sm"
          >
            <label className="block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-navy/65">
                {t(c.email, lang)}
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-navy outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-navy/65">
                {t(c.password, lang)}
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-navy outline-none transition-colors focus:border-gold"
              />
            </label>
            {loginError && <p className="mt-3 text-sm text-red-400">{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading}
              className="btn-gold mt-8 w-full justify-center disabled:opacity-50"
            >
              {loginLoading ? "..." : t(c.signIn, lang)}
            </button>
            <div className="mt-6 flex items-center justify-between text-xs font-serif-display uppercase tracking-[0.18em]">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-navy/55 hover:text-gold"
              >
                {t(c.forgot, lang)}
              </button>
              <button
                type="button"
                onClick={() => void sendMagic()}
                className="text-xs text-navy/70 underline-offset-4 hover:text-gold hover:underline"
              >
                {magicSent
                  ? lang === "en"
                    ? "✓ Login link sent to your email"
                    : "✓ أُرسل رابط الدخول إلى بريدك"
                  : lang === "en"
                    ? "Email me a login link"
                    : "أرسل لي رابط دخول بالبريد"}
              </button>
              <button
                type="button"
                onClick={() => setShowRequest(true)}
                className="text-gold hover:text-navy"
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
            className="mt-12 border border-gold/30 bg-white/80 p-8 backdrop-blur-sm"
          >
            <h2 className="text-center text-lg uppercase tracking-[0.18em] text-gold mb-6">
              {lang === "en" ? "Request Family Access" : "طلب الانضمام للعائلة"}
            </h2>
            <label className="block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-navy/65">
                {lang === "en" ? "Full Name" : "الاسم الكامل"}
              </span>
              <input
                type="text"
                required
                value={reqName}
                onChange={(e) => setReqName(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-navy outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-navy/65">
                {lang === "en" ? "Email" : "البريد الإلكتروني"}
              </span>
              <input
                type="email"
                required
                value={reqEmail}
                onChange={(e) => setReqEmail(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-navy outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-navy/65">
                {lang === "en" ? "Relation to Family" : "صلة القرابة"}
              </span>
              <input
                type="text"
                value={reqRelation}
                onChange={(e) => setReqRelation(e.target.value)}
                placeholder={lang === "en" ? "e.g. Son of Ibrahim" : "مثال: ابن إبراهيم"}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-navy outline-none transition-colors focus:border-gold placeholder:text-navy/30"
              />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-navy/65">
                {lang === "en" ? "Message (optional)" : "رسالة (اختياري)"}
              </span>
              <textarea
                rows={3}
                value={reqMessage}
                onChange={(e) => setReqMessage(e.target.value)}
                className="w-full border border-cream/20 bg-transparent px-4 py-3 text-navy outline-none transition-colors focus:border-gold"
              />
            </label>
            {reqError && <p className="mt-3 text-sm text-red-400">{reqError}</p>}
            <button
              type="submit"
              disabled={reqLoading}
              className="btn-gold mt-8 w-full justify-center disabled:opacity-50"
            >
              {reqLoading ? "..." : lang === "en" ? "Send Request" : "إرسال الطلب"}
            </button>
            <button
              type="button"
              onClick={() => setShowRequest(false)}
              className="mt-4 w-full text-center text-xs text-navy/45 hover:text-navy"
            >
              {lang === "en" ? "← Back to sign in" : "← العودة لتسجيل الدخول"}
            </button>
          </form>
        )}

        {/* SUCCESS MESSAGE */}
        {reqSuccess && (
          <div className="mt-12 border border-gold/30 bg-white/80 p-8 text-center backdrop-blur-sm">
            <p className="text-2xl text-gold mb-4">✓</p>
            <h2 className="text-lg uppercase tracking-[0.18em] text-navy mb-3">
              {lang === "en" ? "Request Sent" : "تم إرسال الطلب"}
            </h2>
            <p className="text-sm text-navy/65">
              {lang === "en"
                ? "Your request has been received. The admin will review it and send you an invite by email."
                : "تم استلام طلبك. سيقوم المسؤول بمراجعته وإرسال دعوة إلى بريدك الإلكتروني."}
            </p>
            <button
              onClick={() => {
                setShowRequest(false);
                setReqSuccess(false);
              }}
              className="mt-6 text-xs text-gold hover:text-navy"
            >
              {lang === "en" ? "← Back to sign in" : "← العودة لتسجيل الدخول"}
            </button>
          </div>
        )}

        <p className="mt-10 text-center text-xs italic text-navy/45">{t(c.notice, lang)}</p>

        <div className="mt-10 text-center">
          <Link
            to="/"
            className="font-serif-display text-xs uppercase tracking-[0.22em] text-navy/55 hover:text-gold"
          >
            ← {lang === "en" ? "Return Home" : "العودة للرئيسية"}
          </Link>
        </div>
      </div>
    </section>
  );
}
