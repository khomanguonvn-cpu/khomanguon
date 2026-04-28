"use client";
import React, { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import Toast from "../../custom/Toast";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { Send, Mail, ArrowRight } from "lucide-react";

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
    <section className="py-20 relative overflow-hidden bg-slate-900">
      {/* Angular decorative shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-20 -left-20 w-80 h-80 bg-primary-600/10"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/10"
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-orange-500/5"
          style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
        />
      </div>

      {/* Diagonal gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 via-indigo-500 to-orange-500" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Left: Text */}
          <div className="text-center lg:text-left flex-1">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="px-4 py-1.5 bg-primary-600 text-white text-xs font-bold uppercase tracking-widest clip-angular-sm">
                <Mail className="inline h-3.5 w-3.5 mr-1.5" />
                {t(language, "newsletterCta")}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
              {t(language, "newsletterTitle") ||
                t(language, "newsletterTitleOld")}
            </h2>
            <p className="text-slate-400 text-lg max-w-lg mx-auto lg:mx-0">
              {t(language, "newsletterDesc") ||
                t(language, "newsletterDescOld")}
            </p>
          </div>

          {/* Right: Form */}
          <div className="flex-1 w-full max-w-md">
            <div className="flex bg-white overflow-hidden clip-angular" style={{ boxShadow: "0 8px 32px rgba(72, 70, 229, 0.15)" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                placeholder={t(language, "newsletterEmailPlaceholder")}
                className="flex-1 px-6 py-4 text-slate-900 placeholder:text-slate-400 outline-none text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold text-sm uppercase tracking-wider hover:from-primary-700 hover:to-indigo-700 active:scale-95 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t(language, "newsletterSubscribe")}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-4 text-center lg:text-left">
              {t(language, "newsletterUnsubscribe")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
