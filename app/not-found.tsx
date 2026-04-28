"use client";
import Link from "next/link";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const { language } = useSelector((state: IRootState) => state.settings);

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="relative mb-8">
          <div className="text-[120px] sm:text-[160px] font-black leading-none text-slate-100 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary-100 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Search className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
          {t(language, "notFoundTitle")}
        </h1>

        <p className="text-slate-500 text-base sm:text-lg mb-8 leading-relaxed">
          {t(language, "notFoundDesc")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200 active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            {t(language, "notFoundBackHome")}
          </Link>
          <button
            onClick={() => typeof window !== "undefined" && window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(language, "cancelAction")}
          </button>
        </div>
      </div>
    </section>
  );
}