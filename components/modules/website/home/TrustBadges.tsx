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
  gradient: string;
  iconColor: string;
}

const badges: BadgeData[] = [
  {
    icon: Zap,
    titleKey: "trustAutoDeliveryTitle",
    descKey: "trustAutoDeliveryDesc",
    gradient: "from-amber-500 to-orange-500",
    iconColor: "text-amber-500",
  },
  {
    icon: ShieldCheck,
    titleKey: "trustSecurePaymentTitle",
    descKey: "trustSecurePaymentDesc",
    gradient: "from-emerald-500 to-green-500",
    iconColor: "text-emerald-500",
  },
  {
    icon: Headphones,
    titleKey: "trustSupport247Title",
    descKey: "trustSupport247Desc",
    gradient: "from-blue-500 to-indigo-500",
    iconColor: "text-blue-500",
  },
  {
    icon: Rocket,
    titleKey: "trustQualityTitle",
    descKey: "trustQualityDesc",
    gradient: "from-purple-500 to-violet-500",
    iconColor: "text-purple-500",
  },
];

export default function TrustBadges() {
  const { language } = useSelector((state: IRootState) => state.settings);

  return (
    <section className="py-10 bg-white border-y border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="trust-badge group cursor-default relative overflow-hidden"
              >
                {/* Angular accent stripe */}
                <div
                  className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${badge.gradient}`}
                  style={{ clipPath: "polygon(0 0, 100% 4%, 100% 96%, 0 100%)" }}
                />

                <div className={`${badge.iconColor} mb-2 transition-transform duration-300 group-hover:scale-110 pl-2`}>
                  <Icon className="h-9 w-9 mx-auto" strokeWidth={1.5} />
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