"use client";
import React from "react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { Zap, ShieldCheck, Headphones, Rocket } from "lucide-react";

type I18nKey = Parameters<typeof t>[1];

interface BadgeData {
  icon: React.ElementType;
  titleKey: I18nKey;
  descKey: I18nKey;
  color: string;
  bgColor: string;
  borderColor: string;
}

const badges: BadgeData[] = [
  {
    icon: Zap,
    titleKey: "trustAutoDeliveryTitle",
    descKey: "trustAutoDeliveryDesc",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    icon: ShieldCheck,
    titleKey: "trustSecurePaymentTitle",
    descKey: "trustSecurePaymentDesc",
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    icon: Headphones,
    titleKey: "trustSupport247Title",
    descKey: "trustSupport247Desc",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    icon: Rocket,
    titleKey: "trustQualityTitle",
    descKey: "trustQualityDesc",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
];

export default function TrustBadges() {
  const { language } = useSelector((state: IRootState) => state.settings);

  return (
    <section className="py-8 bg-slate-50 border-y border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className={`trust-badge group cursor-default ${badge.bgColor} ${badge.borderColor}`}
              >
                <div className={`${badge.color} mb-2 transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="h-8 w-8 mx-auto" strokeWidth={1.5} />
                </div>
                <h3 className="text-slate-900 font-bold text-sm text-center mb-1">
                  {t(language, badge.titleKey)}
                </h3>
                <p className="text-slate-500 text-xs text-center leading-relaxed">
                  {t(language, badge.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}