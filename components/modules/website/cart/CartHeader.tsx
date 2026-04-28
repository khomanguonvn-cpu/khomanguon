"use client";
import { cn } from "@/lib/utils";
import { ChevronDownCircle, ShoppingCart, CreditCard, FileText } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function CartHeader({ active }: { active: string }) {
  const { language } = useSelector((state: IRootState) => state.settings);

  const steps = [
    { key: "cart", label: t(language, "cartHeaderCart"), icon: ShoppingCart },
    { key: "checkout", label: t(language, "cartHeaderCheckout"), icon: CreditCard },
    { key: "order", label: t(language, "cartHeaderSummary"), icon: FileText },
  ];

  return (
    <div className="mt-4 sm:mt-6 mb-4 sm:mb-6">
      {/* Desktop: horizontal steps */}
      <ol className="hidden md:flex items-center justify-center gap-2 sm:gap-4 w-full text-sm font-medium text-gray-500">
        {steps.map((step, idx) => {
          const isActive = active === step.key;
          const Icon = step.icon;
          return (
            <React.Fragment key={step.key}>
              <li
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  isActive
                    ? "bg-primary-50 text-primary-700 font-bold"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary-600" : "text-slate-400")} />
                {step.label}
              </li>
              {idx < steps.length - 1 && (
                <ChevronDownCircle className="h-4 w-4 text-slate-300 rotate-90" />
              )}
            </React.Fragment>
          );
        })}
      </ol>

      {/* Mobile: simplified progress */}
      <div className="flex md:hidden items-center gap-2">
        {steps.map((step, idx) => {
          const isActive = active === step.key;
          const Icon = step.icon;
          return (
            <React.Fragment key={step.key}>
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all flex-1 justify-center",
                  isActive
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 rounded-full",
                  active === steps[idx + 1].key || active === step.key
                    ? "bg-primary-400"
                    : "bg-slate-200"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
