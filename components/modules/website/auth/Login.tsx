"use client";
import { signIn } from "next-auth/react";
import Container from "@/components/modules/custom/Container";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import Toast from "@/components/modules/custom/Toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { useState } from "react";

type LoginFormValues = {
  email: string;
  password: string;
};

type LoginProps = {
  mode?: "page" | "popup";
  onSuccess?: () => void;
  onNavigate?: () => void;
};

export default function Login({ mode = "page", onSuccess, onNavigate }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { language } = useSelector((state: IRootState) => state.settings);
  const router = useRouter();
  const isPopup = mode === "popup";

  const initialValues: LoginFormValues = {
    email: "",
    password: "",
  };

  const validate = Yup.object({
    email: Yup.string().required().email(),
    password: Yup.string().required().min(6),
  });

  const handleLogin = async (values: LoginFormValues) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        const errorMsg = result.error === "CredentialsSignin"
          ? t(language, "loginErrorEmailPassword")
          : result.error;
        toast.custom(
          <Toast message={errorMsg} status="error" />
        );
        return;
      }

      toast.custom(
        <Toast message={t(language, "loginSuccess")} status="success" />
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.custom(
        <Toast message={t(language, "loginErrorGeneral")} status="error" />
      );
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className={cn("flex flex-col", isPopup ? "gap-4 sm:gap-5" : "gap-8")}>
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Header */}
      <div className={cn("flex flex-col items-center text-center", isPopup ? "gap-1" : "gap-2")}>
        <div className={cn(
          "rounded-2xl bg-primary-100 items-center justify-center mb-2",
          isPopup ? "hidden h-11 w-11 sm:flex" : "flex h-14 w-14"
        )}>
          <ShieldCheck className="h-7 w-7 text-primary-600" />
        </div>
        <h2 className={cn("font-extrabold text-slate-900 tracking-tight", isPopup ? "text-lg sm:text-xl" : "text-xl")}>
          {t(language, "loginTitle")}
        </h2>
        <p className={cn("text-sm text-slate-500 max-w-xs", isPopup && "hidden sm:block")}>
          {t(language, "loginSubtitle")}
        </p>
      </div>

      {/* Login Form */}
      <Formik
        initialValues={initialValues}
        validationSchema={validate}
        onSubmit={handleLogin}
      >
        {({ errors, touched }) => (
          <Form className={cn(isPopup ? "space-y-3 sm:space-y-4" : "space-y-5")}>
            {/* Email */}
            <div className={cn(isPopup ? "space-y-1" : "space-y-1.5")}>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                {t(language, "login")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Field
                  type="email"
                  name="email"
                  className={cn(
                    "w-full pl-10 pr-4 rounded-xl border bg-white text-slate-900 text-sm",
                    isPopup ? "py-2.5 sm:py-2.5" : "py-2.5",
                    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
                    "placeholder:text-slate-400 transition-all",
                    errors.email && touched.email ? "border-red-500" : "border-slate-200"
                  )}
                  placeholder="email@example.com"
                />
              </div>
              <ErrorMessage name="email" component="p" className="text-xs text-red-500 font-medium" />
            </div>

            {/* Password */}
            <div className={cn(isPopup ? "space-y-1" : "space-y-1.5")}>
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                {t(language, "formPassword")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Field
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={cn(
                    "w-full pl-10 pr-10 rounded-xl border bg-white text-slate-900 text-sm",
                    isPopup ? "py-2.5 sm:py-2.5" : "py-2.5",
                    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
                    "placeholder:text-slate-400 transition-all",
                    errors.password && touched.password ? "border-red-500" : "border-slate-200"
                  )}
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <ErrorMessage name="password" component="p" className="text-xs text-red-500 font-medium" />
            </div>

            {/* Forgot Password */}
            <div className="text-right leading-none">
              <Link
                href="/forgot-password"
                onClick={() => onNavigate?.()}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {t(language, "forgotPassword")}
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold transition-all duration-200 active:scale-[0.98]",
                "bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                t(language, "loginButton")
              )}
            </Button>
            
            {/* OAuth Dividers */}
            <div className={cn("relative flex items-center", isPopup ? "py-1" : "py-2")}>
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">{t(language, "oauthDivider")}</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 sm:h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all"
                onClick={() => signIn("google")}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.17v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.17C1.43 8.55 1 10.22 1 12s.43 3.45 1.17 4.93l3.67-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.17 7.07l3.67 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 sm:h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all"
                onClick={() => signIn("facebook")}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </Form>
        )}
      </Formik>

      {/* Register link */}
      {mode === "page" && (
        <div className="text-center">
          <span className="text-sm text-slate-500">
            {t(language, "registerHasAccount")}{" "}
          </span>
          <Link href="/register" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            {t(language, "registerLink")}
          </Link>
        </div>
      )}
    </div>
  );

  if (mode === "popup") {
    return <div className="relative pb-1 pt-0 sm:py-3">{formContent}</div>;
  }

  return (
    <section className="py-12">
      <Container>
        <div className="mx-auto max-w-md">{formContent}</div>
      </Container>
    </section>
  );
}
