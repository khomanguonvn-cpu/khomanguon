"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Mail, ShieldCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import Toast from "../../custom/Toast";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

type OtpActionPurpose = "change_password" | "bank_link" | "withdraw_request";

type OtpActionModalProps = {
  open: boolean;
  email: string;
  purpose: OtpActionPurpose;
  title: string;
  description: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (otpCode: string) => Promise<boolean>;
};

export default function OtpActionModal({
  open,
  email,
  purpose,
  title,
  description,
confirmLabel,
  onClose,
  onConfirm,
}: OtpActionModalProps) {
  const { language } = useSelector((state: IRootState) => state.settings);
  const confirmLabelText = confirmLabel ?? t(language, "otpActionTitle");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const normalizedEmail = email.trim().toLowerCase();

  const sendOtp = useCallback(async () => {
    if (!normalizedEmail) {
      toast.custom(<Toast message={t(language, "otpActionNoEmail")} status="error" />);
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, purpose }),
      });
      const data = await response.json();

      if (!response.ok || data?.success === false) {
        toast.custom(<Toast message={data?.message || t(language, "otpActionSendFail")} status="error" />);
        return;
      }

      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      toast.custom(<Toast message={data?.message || t(language, "otpActionSent")} status="success" />);
} catch {
      toast.custom(<Toast message={t(language, "otpActionSendFail")} status="error" />);
    } finally {
      setSendingOtp(false);
    }
  }, [normalizedEmail, purpose, language]);

  useEffect(() => {
    if (!open) return;
    setOtpDigits(["", "", "", "", "", ""]);
    void sendOtp();
  }, [open, sendOtp]);

  const handleOtpInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) {
      return;
    }

    event.preventDefault();
    const nextDigits = ["", "", "", "", "", ""];
    pasted.split("").forEach((digit, idx) => {
      if (idx < 6) {
        nextDigits[idx] = digit;
      }
    });

    setOtpDigits(nextDigits);
    const focusIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const handleConfirm = async () => {
    const otpCode = otpDigits.join("");

    if (otpCode.length < 6) {
      toast.custom(<Toast message={t(language, "otpActionEnterAll")} status="error" />);
      return;
    }

    setSubmitting(true);
    try {
      const success = await onConfirm(otpCode);
      if (success) {
        setOtpDigits(["", "", "", "", "", ""]);
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary-600" />
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          </div>

          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-slate-600">{description}</p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {t(language, "otpActionOtpSentTo")} <span className="font-medium text-slate-900">{normalizedEmail || t(language, "otpActionNotAvailable")}</span>
          </div>

          <div className="flex justify-center gap-2">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  otpInputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) => handleOtpInput(index, event.target.value)}
                onKeyDown={(event) => handleOtpKeyDown(index, event)}
                onPaste={handlePaste}
                className={`h-12 w-11 rounded-xl border-2 text-center text-lg font-bold outline-none transition-all ${
                  digit
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-slate-200 bg-white text-slate-800 focus:border-primary-500"
                }`}
              />
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <AlertCircle className="mt-0.5 h-4 w-4 text-slate-400" />
            <span>{t(language, "otpActionOtpNote")}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            disabled={submitting || sendingOtp}
            onClick={handleConfirm}
            className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t(language, "otpActionVerifying") : confirmLabelText}
          </button>

          <button
            type="button"
            disabled={sendingOtp || submitting}
            onClick={() => void sendOtp()}
            className="inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {sendingOtp ? t(language, "otpActionResending") : t(language, "otpActionResend")}
          </button>
        </div>
      </div>
    </div>
  );
}
