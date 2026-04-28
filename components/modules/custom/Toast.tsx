import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import Link from "next/link";
import React from "react";
import toast from "react-hot-toast";

export default function Toast({
  status = "success",
  message,
  link,
  toastId,
}: {
  status?: "error" | "success" | "info";
  message: string;
  link?: string;
  toastId?: string;
}) {
  const config = {
    success: {
      icon: CheckCircle2,
      bg: "bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-500",
      textColor: "text-emerald-800",
      closeHover: "hover:bg-emerald-100",
      accentBar: "bg-emerald-500",
    },
    error: {
      icon: AlertCircle,
      bg: "bg-red-50 border-red-200",
      iconColor: "text-red-500",
      textColor: "text-red-800",
      closeHover: "hover:bg-red-100",
      accentBar: "bg-red-500",
    },
    info: {
      icon: Info,
      bg: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-500",
      textColor: "text-blue-800",
      closeHover: "hover:bg-blue-100",
      accentBar: "bg-blue-500",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-lg",
        "animate-in slide-in-from-top-2 fade-in duration-300",
        "max-w-md w-full",
        config.bg
      )}
      role="alert"
    >
      {/* Accent bar left */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          config.accentBar
        )}
      />

      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.iconColor)} />

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium leading-snug", config.textColor)}>
          {message}
        </p>
        {link && (
          <Link
            href={link}
            className={cn(
              "text-xs font-semibold underline underline-offset-2 mt-1 inline-block",
              config.textColor,
              "hover:no-underline opacity-80 hover:opacity-100"
            )}
          >
            Xem chi tiết →
          </Link>
        )}
      </div>

      <button
        onClick={() => toast.remove(toastId)}
        className={cn(
          "shrink-0 rounded-lg p-1 transition-colors",
          "text-slate-400 hover:text-slate-600",
          config.closeHover
        )}
        aria-label="Đóng thông báo"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
