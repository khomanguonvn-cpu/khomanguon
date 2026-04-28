"use client";

import Container from "@/components/modules/custom/Container";
import Toast from "@/components/modules/custom/Toast";
import { cn } from "@/lib/utils";
import { AlertCircle, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;

export default function ForgotPassword() {
  const { language } = useSelector((state: IRootState) => state.settings);
  const [step, setStep] = useState<"email" | "reset">("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.custom(<Toast message={t(language, "forgotPasswordEnterEmail")} status="error" />);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, purpose: "password_reset" }),
      });
      const data = await response.json();

      if (!response.ok || data?.success === false) {
        toast.custom(
          <Toast message={data?.message || t(language, "forgotPasswordSendOtpFail")} status="error" />
        );
        return;
      }

      setEmail(normalizedEmail);
      setStep("reset");
      setOtpDigits(["", "", "", "", "", ""]);
      toast.custom(
        <Toast
          message={t(language, "forgotPasswordOtpSent")}
          status="success"
        />
      );
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch {
      toast.custom(<Toast message={t(language, "forgotPasswordSendOtpFail")} status="error" />);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    if (loading) return;

    const code = otpDigits.join("");
    if (code.length < 6) {
      toast.custom(<Toast message={t(language, "forgotPasswordFillOtp")} status="error" />);
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.custom(<Toast message={t(language, "forgotPasswordFillPassword")} status="error" />);
      return;
    }

    if (!PASSWORD_RULE.test(newPassword)) {
      toast.custom(
        <Toast
          message={t(language, "forgotPasswordNewPasswordMin")}
          status="error"
        />
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.custom(<Toast message={t(language, "forgotPasswordConfirmMismatch")} status="error" />);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok || data?.success === false) {
        toast.custom(
          <Toast message={data?.message || t(language, "forgotPasswordResetFail")} status="error" />
        );
        return;
      }

      toast.custom(
        <Toast
          message={data?.message || t(language, "forgotPasswordResetSuccess")}
          status="success"
        />
      );

      setStep("email");
      setOtpDigits(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.custom(<Toast message={t(language, "forgotPasswordResetFail")} status="error" />);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (loading || !email) return;

    setLoading(true);
    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "password_reset" }),
      });
      const data = await response.json();

      if (!response.ok || data?.success === false) {
        toast.custom(
          <Toast message={data?.message || t(language, "forgotPasswordResendFail")} status="error" />
        );
        return;
      }

      setOtpDigits(["", "", "", "", "", ""]);
      toast.custom(<Toast message={t(language, "forgotPasswordResendSuccess")} status="success" />);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch {
      toast.custom(<Toast message={t(language, "forgotPasswordResendFail")} status="error" />);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12">
      <Container>
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 rounded-2xl z-10 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
          )}

          <div className="flex flex-col items-center text-center gap-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-primary-600" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">{t(language, "forgotPasswordTitle")}</h1>
            <p className="text-sm text-slate-500">
              {step === "email"
                ? t(language, "forgotPasswordDescEmail")
                : t(language, "forgotPasswordDescOtp").replace("{{email}}", email)}
            </p>
          </div>

          {step === "email" ? (
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700">{t(language, "forgotPasswordEmailLabel")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold"
              >
{t(language, "forgotPasswordSendOtp")}
               </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700">{t(language, "forgotPasswordOtpLabel")}</label>
                <div className="flex justify-center gap-2 mt-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpInput(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={cn(
                        "w-11 h-12 text-center text-lg font-bold rounded-xl border-2",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/20",
                        digit ? "border-primary-500 bg-primary-50" : "border-slate-200"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t(language, "forgotPasswordNewPassword")}</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t(language, "forgotPasswordNewPasswordPlaceholder")}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t(language, "forgotPasswordConfirmNewPassword")}</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t(language, "forgotPasswordConfirmNewPasswordPlaceholder")}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 text-slate-400 flex-shrink-0" />
                <span>
                  {t(language, "forgotPasswordNewPasswordMin")}
                </span>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold"
              >
{t(language, "forgotPasswordVerifyAndReset")}
               </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="w-full py-2 text-sm text-slate-600 hover:text-primary-600"
              >
{t(language, "forgotPasswordResendOtp")}
               </button>
            </div>
          )}

          <div className="text-center mt-6 text-sm">
            <Link href="/signin" className="text-primary-600 hover:text-primary-700 font-medium">
              {t(language, "forgotPasswordBackToLogin")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
