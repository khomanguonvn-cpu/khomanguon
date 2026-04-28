"use client";
import React, { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import Toast from "../../custom/Toast";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { Send, Mail } from "lucide-react";

export default function NewsletterCTA() {
  const { language } = useSelector((state: IRootState) => state.settings);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubscribe = async () => {
    const Email = z.object({
      email: z.string().email().min(5),
    });
    const validatedFields = Email.safeParse({ email });

    if (!validatedFields.success) {
      toast.custom(
        <Toast
          message={t(language, "newsletterVerifyFailed")}
          status="error"
        />
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/sendemail",
        {
          method: "POST",
          body: JSON.stringify({
            subject: t(language, "newsletterSubject"),
            email,
            message: t(language, "newsletterThankYou"),
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.custom(<Toast message={data.message || t(language, "newsletterSuccess")} status="success" />);
        setEmail("");
      } else {
        toast.custom(<Toast message={data.message || t(language, "newsletterErrorGeneral")} status="error" />);
      }
    } catch (error) {
      console.error(error);
      toast.custom(<Toast message={t(language, "newsletterErrorGeneral")} status="error" />);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Text */}
          <div className="text-center lg:text-left flex-1">
            <div className="inline-flex items-center gap-2 mb-3">
              <Mail className="h-5 w-5 text-white/80" />
              <span className="text-white/80 text-sm font-medium uppercase tracking-wider">
                {t(language, "newsletterCta")}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-3">
              {t(language, "newsletterTitle") ||
                t(language, "newsletterTitleOld")}
            </h2>
            <p className="text-white/80 text-base max-w-lg mx-auto lg:mx-0">
              {t(language, "newsletterDesc") ||
                t(language, "newsletterDescOld")}
            </p>
          </div>

          {/* Right: Form */}
          <div className="flex-1 w-full max-w-md">
            <div className="flex bg-white rounded-2xl shadow-2xl overflow-hidden">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                placeholder={t(language, "newsletterEmailPlaceholder")}
                className="flex-1 px-5 py-4 text-slate-900 placeholder:text-slate-400 outline-none text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t(language, "newsletterSubscribe")}</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
            <p className="text-white/60 text-xs mt-3 text-center lg:text-left">
              {t(language, "newsletterUnsubscribe")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
