"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { Mail, Phone, User, Wallet, X } from "lucide-react";
import LanguageCurrency from "../../custom/LanguageCurrency";
import axios from "axios";

type SiteConfigData = {
  contactEmail: string;
  contactPhone: string;
  announcementText: string;
  announcementLink: string;
  announcementEnabled: string;
};

const DEFAULTS: SiteConfigData = {
  contactEmail: "contact@khoinguon.io.vn",
  contactPhone: "0868 686 868",
  announcementText: "",
  announcementLink: "",
  announcementEnabled: "false",
};

export default function TopBar() {
  const { status } = useSession();
  const { language } = useSelector((state: IRootState) => state.settings);
  const [balance, setBalance] = useState<number | null>(null);
  const [config, setConfig] = useState<SiteConfigData>(DEFAULTS);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await axios.get("/api/site-config");
        const data = res.data?.data;
        if (data) {
          setConfig({ ...DEFAULTS, ...data });
        }
      } catch {
        // Use defaults
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadBalance = async () => {
      if (status !== "authenticated") {
        setBalance(null);
        return;
      }

      try {
        const response = await axios.get("/api/wallet");
        const amount = Number(response.data?.data?.balance ?? 0);
        if (mounted) {
          setBalance(Number.isFinite(amount) ? amount : 0);
        }
      } catch {
        if (mounted) {
          setBalance(null);
        }
      }
    };

    loadBalance();
    return () => {
      mounted = false;
    };
  }, [status]);

  const handleOpenAuth = () => {
    window.dispatchEvent(new Event("open-auth-popup"));
  };

  const showAnnouncement =
    config.announcementEnabled === "true" &&
    config.announcementText &&
    !announcementDismissed;

  return (
    <>
      {/* Announcement Banner */}
      {showAnnouncement && (
        <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-1.5 text-xs sm:text-sm font-medium">
              {config.announcementLink ? (
                <a
                  href={config.announcementLink}
                  className="hover:underline transition-colors"
                >
                  {config.announcementText}
                </a>
              ) : (
                <span>{config.announcementText}</span>
              )}
              <button
                onClick={() => setAnnouncementDismissed(true)}
                className="absolute right-2 sm:right-4 p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Đóng thông báo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TopBar */}
      <div className="w-full bg-primary-600 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center justify-between">
            <div className="hidden md:flex items-center gap-6 text-sm">
              {config.contactEmail && (
                <a
                  href={`mailto:${config.contactEmail}`}
                  className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{config.contactEmail}</span>
                </a>
              )}
              {config.contactEmail && config.contactPhone && (
                <div className="h-4 w-px bg-white/20" />
              )}
              {config.contactPhone && (
                <a
                  href={`tel:${config.contactPhone.replace(/\s/g, "")}`}
                  className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{config.contactPhone}</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <LanguageCurrency className="!flex-row" />

                <div className="h-4 w-px bg-white/20 hidden sm:block" />

                {status === "authenticated" ? (
                  <Link
                    href="/account/profile"
                    className="flex items-center gap-1.5 text-sm font-medium hover:text-white/80 transition-colors"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>{t(language, "headerAccount")}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs">
                      <Wallet className="h-3 w-3" />
                      {balance === null ? "--" : `${balance.toLocaleString("vi-VN")}đ`}
                    </span>
                  </Link>
                ) : (
                  <button
                    onClick={handleOpenAuth}
                    className="flex items-center gap-1.5 text-sm font-medium hover:text-white/80 transition-colors"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>{t(language, "headerLogin")}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
