import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, MessageCircle, Sparkles } from "lucide-react";
import GuideTabs from "@/components/modules/website/guide/GuideTabs";

export const metadata: Metadata = {
  title: "Hướng dẫn mua & bán - KHOMANGUON.IO.VN",
  description:
    "Hướng dẫn chi tiết từng bước cho người mua và người bán trên KHOMANGUON.IO.VN — kèm hình minh hoạ trực quan.",
};

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-slate-900/5 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-lg backdrop-blur-md">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
                  <Sparkles className="h-3 w-3" />
                  Hướng dẫn nhanh
                </span>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                  Mua & bán dễ dàng — minh hoạ từng bước
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
                  Theo logic hiện tại của KHOMANGUON.IO.VN. Mỗi bước có hình UI mô phỏng để bạn biết
                  chính xác trông như thế nào trên hệ thống.
                </p>
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur-md transition-all hover:bg-white/20"
            >
              <MessageCircle className="h-4 w-4" />
              Cần hỗ trợ?
            </Link>
          </div>
        </div>

        {/* Tabs + steps */}
        <div className="mt-8">
          <GuideTabs />
        </div>

        {/* Footer help */}
        <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm text-slate-500">Vẫn còn thắc mắc?</p>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Đội ngũ hỗ trợ trực tuyến 24/7
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Liên hệ qua chat, email hoặc Telegram — chúng tôi luôn sẵn sàng giúp bạn hoàn thành giao dịch.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <MessageCircle className="h-4 w-4" />
              Liên hệ đội ngũ
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
            >
              Câu hỏi thường gặp
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}