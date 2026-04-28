"use client";
import React, { useState, useRef, useEffect } from "react";
import Container from "../../custom/Container";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Send, Mail, ShieldCheck, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import Toast from "../../custom/Toast";
import { useRouter } from "next/navigation";
import Loading from "../../custom/Loading";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  otp: string;
};

type RegisterProps = {
  mode?: "page" | "popup";
  onSuccess?: () => void;
};

export default function Register({ mode = "page", onSuccess }: RegisterProps) {
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { language } = useSelector((state: IRootState) => state.settings);

  const initialValues: RegisterFormValues = {
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    otp: "",
  };

  const validate = Yup.object({
    name: Yup.string()
      .required(t(language, "formNameRequired") || "Họ tên là bắt buộc")
      .min(2, t(language, "formNameMin") || "Họ tên tối thiểu 2 ký tự")
      .max(60, t(language, "formNameMax") || "Họ tên tối đa 60 ký tự"),
    email: Yup.string()
      .required(t(language, "formEmailRequired") || "Email là bắt buộc")
      .email(t(language, "formEmailInvalid") || "Email không hợp lệ"),
    password: Yup.string()
      .required(t(language, "formPasswordRequired"))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,
        t(language, "formPasswordPattern")
      ),
    confirm_password: Yup.string()
      .required(t(language, "formPasswordInvalid"))
      .oneOf(
        [Yup.ref("password"), "null"],
        t(language, "formConfirmPasswordMismatch")
      ),
    otp: Yup.string(),
  });

  const router = useRouter();

  const handleRegisterAndSendOtp = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const registerResponse = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, email: values.email, password: values.password }),
      });
      const registerData = await registerResponse.json();

      if (!registerResponse.ok || registerData?.success === false) {
        const errorMsg = registerData?.message || t(language, "registerError");
        toast.custom(
          <Toast message={errorMsg} status="error" />
        );
        return;
      }

      const sendOtpResponse = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, purpose: "email_verify" }),
      });
      const sendOtpData = await sendOtpResponse.json();

      if (!sendOtpResponse.ok || sendOtpData?.success === false) {
        toast.custom(
          <Toast message={t(language, "registerErrorOtp")} status="error" />
        );
        return;
      }

      setPendingEmail(values.email);
      setPendingPassword(values.password);
      setOtpStep(true);
      setOtpDigits(["", "", "", "", "", ""]);

      toast.custom(
        <Toast
          message={t(language, "registerSuccess")}
          status="success"
        />
      );
    } catch {
      toast.custom(
        <Toast message={t(language, "registerErrorGeneral")} status="error" />
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");

    if (otp.length < 6) {
      toast.custom(
        <Toast message={t(language, "otpEnterAll")} status="error" />
      );
      return;
    }

    setLoading(true);
    try {
      const verifyOtpResponse = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: otp, purpose: "email_verify" }),
      });
      const verifyOtpData = await verifyOtpResponse.json();

      if (!verifyOtpResponse.ok || verifyOtpData?.success === false) {
        toast.custom(
          <Toast message={t(language, "otpInvalid")} status="error" />
        );
        return;
      }

      toast.custom(
        <Toast message={t(language, "otpSuccess")} status="success" />
      );

      await signIn("credentials", {
        email: pendingEmail,
        password: pendingPassword,
        redirect: true,
      });

      onSuccess?.();
    } catch {
      toast.custom(
        <Toast message={t(language, "otpFailed")} status="error" />
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail || loading) return;
    setLoading(true);
    try {
      const resendResponse = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, purpose: "email_verify" }),
      });
      const resendData = await resendResponse.json();

      if (!resendResponse.ok || resendData?.success === false) {
        toast.custom(
          <Toast message={t(language, "otpCannotResend")} status="error" />
        );
        return;
      }

      setOtpDigits(["", "", "", "", "", ""]);
      toast.custom(
        <Toast message={t(language, "otpResent")} status="success" />
      );
    } catch {
      toast.custom(
        <Toast message={t(language, "otpCannotResend")} status="error" />
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otpStep && otpInputRefs.current[0]) {
      otpInputRefs.current[0]?.focus();
    }
  }, [otpStep]);

  const handleOtpInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const fullOtp = newDigits.join("");
      if (fullOtp.length === 6) {
        setTimeout(() => handleVerifyOtp(), 300);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const formContent = (
    <div className="flex flex-col gap-8">
      {loading && <Loading isLoading={loading} />}

      <div className="flex flex-col gap-2 items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mb-2">
          <ShieldCheck className="h-7 w-7 text-primary-600" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {otpStep
            ? t(language, "verifyOtpTitle")
            : t(language, "registerTitle")}
        </h2>
        <p className="text-sm text-slate-500 max-w-xs">
          {otpStep
            ? `${t(language, "verifyOtpDesc")} ${pendingEmail}`
            : t(language, "registerSubtitle")}
        </p>
      </div>

      {otpStep ? (
        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { otpInputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpInput(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e as unknown as React.KeyboardEvent<HTMLInputElement>)}
                className={cn(
                  "w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200",
                  "bg-white text-slate-900",
                  "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
                  "placeholder:text-slate-300",
                  digit ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:border-slate-300"
                )}
                placeholder="•"
              />
            ))}
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span>
              {t(language, "verifyOtpInstruction")}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpDigits.join("").length < 6}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold transition-all duration-200",
                "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ShieldCheck className="h-5 w-5" />
              <span>{t(language, "verifyButton")}</span>
            </button>

            <button
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-600 hover:text-primary-600 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>{t(language, "verifyResend")}</span>
            </button>

            <button
              onClick={() => { setOtpStep(false); setPendingEmail(""); setPendingPassword(""); setOtpDigits(["", "", "", "", "", ""]); }}
              className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
            >
              {t(language, "verifyBack")}
            </button>
          </div>
        </div>
      ) : (
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={validate}
          onSubmit={async (values) => {
            if (loading) return;
            await handleRegisterAndSendOtp(values);
          }}
        >
          {({ errors, touched }) => (
            <Form className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-slate-700">
                  {t(language, "formFullName")}
                </label>
                <Field
                  type="text"
                  name="name"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 text-sm",
                    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
                    "placeholder:text-slate-400 transition-all",
                    errors.name && touched.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200"
                  )}
                  placeholder={t(language, "formNamePlaceholder")}
                />
                <ErrorMessage name="name" component="p" className="text-xs text-red-500 font-medium" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                <Field
                  type="email"
                  name="email"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 text-sm",
                    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
                    "placeholder:text-slate-400 transition-all",
                    errors.email && touched.email ? "border-red-500" : "border-slate-200"
                  )}
                  placeholder="email@example.com"
                />
                <ErrorMessage name="email" component="p" className="text-xs text-red-500 font-medium" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  {t(language, "formPassword")}
                </label>
                <Field
                  type="password"
                  name="password"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 text-sm",
                    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
                    "placeholder:text-slate-400 transition-all",
                    errors.password && touched.password ? "border-red-500" : "border-slate-200"
                  )}
                  placeholder={t(language, "formPasswordPlaceholder")}
                />
                <ErrorMessage name="password" component="p" className="text-xs text-red-500 font-medium" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm_password" className="text-sm font-medium text-slate-700">
                  {t(language, "formConfirmPassword")}
                </label>
                <Field
                  type="password"
                  name="confirm_password"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 text-sm",
                    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
                    "placeholder:text-slate-400 transition-all",
                    errors.confirm_password && touched.confirm_password ? "border-red-500" : "border-slate-200"
                  )}
                  placeholder={t(language, "formConfirmPasswordPlaceholder")}
                />
                <ErrorMessage name="confirm_password" component="p" className="text-xs text-red-500 font-medium" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold transition-all duration-200 active:scale-[0.98]",
                  "bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                <Send className="h-5 w-5" />
                <span>{t(language, "registerButton")}</span>
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">{t(language, "oauthDivider")}</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all"
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
                  className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all"
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
      )}

      {mode === "page" && !otpStep && (
        <div className="text-center">
          <span className="text-sm text-slate-500">
            {t(language, "registerHasAccount")}{" "}
          </span>
          <Link href="/signin" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            {t(language, "registerLink")}
          </Link>
        </div>
      )}
    </div>
  );

  if (mode === "popup") {
    return <div className="py-4">{formContent}</div>;
  }

  return (
    <section className="py-12">
      <Container>
        <div className="mx-auto max-w-md">{formContent}</div>
      </Container>
    </section>
  );
}