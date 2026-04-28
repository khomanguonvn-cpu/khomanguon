"use client";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Slide } from "@/types";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Cpu,
  Gift,
  Hexagon,
  Layers,
  LucideIcon,
  Rocket,
  ScanSearch,
} from "lucide-react";
import "./style.css";
import "swiper/css/pagination";
import "swiper/css";

type BuiltInSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  Icon: LucideIcon;
  gradient: string;
  glow: string;
  accentRing: string;
  iconColor: string;
};

const BUILT_IN_SLIDES: BuiltInSlide[] = [
  {
    id: "source-code",
    eyebrow: "Mã nguồn",
    title: "Kho mã nguồn premium",
    subtitle: "Source code chuẩn, có hướng dẫn cài đặt và bàn giao tức thì.",
    ctaLabel: "Xem mã nguồn",
    ctaHref: "/products?category=source-code",
    Icon: Cpu,
    gradient: "from-slate-900 via-indigo-950 to-slate-900",
    glow: "bg-indigo-500/30",
    accentRing: "from-indigo-400/30 to-blue-400/10",
    iconColor: "text-indigo-300",
  },
  {
    id: "ai-tools",
    eyebrow: "Công cụ AI",
    title: "Tool AI tăng tốc công việc",
    subtitle: "Tài khoản ChatGPT, Midjourney, Claude và hàng chục tool AI khác.",
    ctaLabel: "Khám phá AI",
    ctaHref: "/products?category=ai-tools",
    Icon: ScanSearch,
    gradient: "from-violet-950 via-purple-900 to-slate-900",
    glow: "bg-violet-500/30",
    accentRing: "from-violet-400/30 to-fuchsia-400/10",
    iconColor: "text-violet-300",
  },
  {
    id: "saas",
    eyebrow: "Dịch vụ SaaS",
    title: "SaaS triển khai trong vài phút",
    subtitle: "Hosting, email, automation, CRM — dùng ngay không cần cấu hình.",
    ctaLabel: "Xem dịch vụ",
    ctaHref: "/products?category=saas",
    Icon: Rocket,
    gradient: "from-slate-900 via-cyan-900 to-blue-950",
    glow: "bg-cyan-500/30",
    accentRing: "from-cyan-400/30 to-blue-400/10",
    iconColor: "text-cyan-300",
  },
  {
    id: "template",
    eyebrow: "Template",
    title: "Template chuyên nghiệp",
    subtitle: "Khởi tạo website, app, landing page chỉ trong vài phút.",
    ctaLabel: "Chọn template",
    ctaHref: "/products?category=template",
    Icon: Layers,
    gradient: "from-rose-950 via-pink-900 to-slate-900",
    glow: "bg-rose-500/30",
    accentRing: "from-rose-400/30 to-pink-400/10",
    iconColor: "text-rose-300",
  },
  {
    id: "game-mmo",
    eyebrow: "Game & MMO",
    title: "Tài khoản game chính chủ",
    subtitle: "Bàn giao tức thì, hỗ trợ đổi mật khẩu, bảo hành theo cam kết.",
    ctaLabel: "Vào kho game",
    ctaHref: "/products?category=game-mmo",
    Icon: Gift,
    gradient: "from-emerald-950 via-green-900 to-slate-900",
    glow: "bg-emerald-500/30",
    accentRing: "from-emerald-400/30 to-teal-400/10",
    iconColor: "text-emerald-300",
  },
];

export default function HomeSlide({ className }: { className?: string }) {
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    const getSlides = async () => {
      try {
        const response = await axios.get("/api/slides");
        const filteredSlides = (response.data.data || []).filter((item: Slide) =>
          item.slug.startsWith("banner-home")
        );
        setSlides(filteredSlides);
      } catch {
        setSlides([]);
      } finally {
        setLoading(false);
      }
    };
    getSlides();
  }, []);

  if (loading) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-primary-900 to-slate-800 shadow-xl",
          className
        )}
        style={{ aspectRatio: "16/9" }}
      >
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-400 border-t-transparent" />
            <span className="text-sm font-medium text-white/70">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Swiper
      autoplay={{
        delay: 5000,
        disableOnInteraction: false,
      }}
      spaceBetween={0}
      slidesPerView={1}
      navigation={false}
      pagination={{
        clickable: true,
      }}
      modules={[Autoplay, Pagination]}
      className={cn("mySwiper w-full", className)}
    >
      {slides.length > 0 ? (
        slides.map((item: Slide, idx: number) => (
          <SwiperSlide key={idx} className="!block">
            <Link href={item.link || "/products"} className="block w-full" style={{ aspectRatio: "16/9" }}>
              <Image
                src={item.image}
                alt={item.title || "Banner"}
                className="block h-full w-full rounded-2xl object-cover shadow-xl"
                fill
                unoptimized
              />
            </Link>
          </SwiperSlide>
        ))
      ) : (
        /* ───────── FALLBACK: 5-slide built-in hero ───────── */
        BUILT_IN_SLIDES.map((slide) => {
          const SlideIcon = slide.Icon;
          return (
            <SwiperSlide key={slide.id} className="!block">
              <div
                className={cn(
                  "relative w-full overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br",
                  slide.gradient
                )}
                style={{ aspectRatio: "16/9" }}
              >
                {/* ── Background glow layers ── */}
                <div className={cn("absolute -right-16 -top-16 h-80 w-80 rounded-full blur-3xl", slide.glow)} />
                <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute right-1/3 top-1/4 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

                {/* ── Decorative grid pattern ── */}
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />

                {/* ── Floating geometric shapes ── */}
                <div className="absolute right-6 top-6 animate-float opacity-25">
                  <Hexagon className={cn("h-16 w-16", slide.iconColor)} />
                </div>
                <div className="absolute bottom-10 right-1/3 animate-float-slow opacity-15">
                  <Hexagon className={cn("h-10 w-10", slide.iconColor)} />
                </div>
                <div className="absolute right-1/4 top-1/3 animate-float-reverse opacity-10">
                  <div className="h-6 w-6 rotate-45 border-2 border-white" />
                </div>

                {/* ── Slide content (split layout) ── */}
                <div className="relative z-10 grid h-full grid-cols-1 items-center gap-4 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_auto] md:gap-6 lg:p-9">
                  {/* Text */}
                  <div className="max-w-lg">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md",
                      slide.iconColor
                    )}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {slide.eyebrow}
                    </span>
                    <h2 className="mt-3 text-xl font-extrabold leading-tight text-white sm:text-2xl md:text-3xl lg:text-4xl">
                      {slide.title}
                    </h2>
                    <p className="mt-2 hidden text-sm leading-relaxed text-white/70 sm:block sm:text-base lg:mt-3">
                      {slide.subtitle}
                    </p>
                    <Link
                      href={slide.ctaHref}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-lg transition-all hover:scale-[1.03] hover:shadow-xl sm:mt-5 sm:px-5 sm:py-2.5 sm:text-sm"
                    >
                      {slide.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Decorative icon block (hidden on small screens) */}
                  <div className="relative hidden md:block">
                    <div className={cn(
                      "absolute inset-0 -m-6 rounded-full bg-gradient-to-br blur-2xl",
                      slide.accentRing
                    )} />
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl lg:h-40 lg:w-40">
                      <SlideIcon className={cn("h-14 w-14 lg:h-20 lg:w-20", slide.iconColor)} />
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })
      )}
    </Swiper>
  );
}
