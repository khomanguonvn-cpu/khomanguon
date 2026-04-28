"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Store, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BuyerStep1Register,
  BuyerStep2Browse,
  BuyerStep3Cart,
  BuyerStep4Pay,
  BuyerStep5Receive,
  BuyerStep6Track,
  SellerStep1Kyc,
  SellerStep2Bank,
  SellerStep3Telegram,
  SellerStep4Upload,
  SellerStep5OrderIn,
  SellerStep6Fulfill,
  SellerStep7Wallet,
} from "./GuideIllustrations";

type Step = {
  illustration: React.FC<{ className?: string }>;
  title: string;
  desc: string;
  bullets: string[];
  ctaLabel?: string;
  ctaHref?: string;
};

const BUYER_STEPS: Step[] = [
  {
    illustration: BuyerStep1Register,
    title: "Tạo tài khoản miễn phí",
    desc: "Đăng ký bằng email hoặc tài khoản Google chỉ trong 30 giây.",
    bullets: [
      "Bấm “Đăng ký” ở góc trên bên phải.",
      "Nhập email + mật khẩu, hoặc đăng nhập Google.",
      "Xác minh email để bật xác thực OTP cho thanh toán.",
    ],
    ctaLabel: "Đăng ký ngay",
    ctaHref: "/register",
  },
  {
    illustration: BuyerStep2Browse,
    title: "Khám phá sản phẩm",
    desc: "Lọc theo danh mục: Mã nguồn, Tool AI, SaaS, Template, Game & MMO.",
    bullets: [
      "Truy cập “Sản phẩm” trên menu hoặc chọn danh mục từ trang chủ.",
      "Dùng thanh tìm kiếm để tìm sản phẩm cụ thể.",
      "Xem ảnh, mô tả, review trước khi quyết định.",
    ],
    ctaLabel: "Xem sản phẩm",
    ctaHref: "/products",
  },
  {
    illustration: BuyerStep3Cart,
    title: "Thêm vào giỏ & thanh toán",
    desc: "Chọn “Mua ngay” để đi thẳng tới thanh toán hoặc thêm nhiều sản phẩm vào giỏ.",
    bullets: [
      "Bấm “Mua ngay” hoặc “Thêm vào giỏ”.",
      "Mở giỏ hàng → kiểm tra số lượng, tổng tiền.",
      "Bấm “Thanh toán” để chuyển sang trang checkout.",
    ],
    ctaLabel: "Mở giỏ hàng",
    ctaHref: "/cart",
  },
  {
    illustration: BuyerStep4Pay,
    title: "Thanh toán PayOS qua QR",
    desc: "Quét QR trên app ngân hàng — tiền chuyển vào ví trang trong vài giây.",
    bullets: [
      "Hệ thống tạo mã QR PayOS cho bạn.",
      "Mở app ngân hàng → quét QR → xác nhận chuyển khoản.",
      "Đơn hàng tự động được ghi nhận khi tiền vào.",
    ],
  },
  {
    illustration: BuyerStep5Receive,
    title: "Nhận sản phẩm tự động",
    desc: "Sản phẩm số được giao ngay tại trang chi tiết đơn — không cần chờ đợi.",
    bullets: [
      "Tài khoản AI / Source code: hiển thị username, password, link ngay.",
      "Người bán có 24h để bàn giao thủ công nếu chưa cấu hình tự động.",
      "Quá hạn? Hệ thống tự hoàn tiền 100% về ví của bạn.",
    ],
  },
  {
    illustration: BuyerStep6Track,
    title: "Theo dõi & quản lý đơn",
    desc: "Mọi đơn hàng đều được lưu trong “Lịch sử mua hàng” của bạn.",
    bullets: [
      "Vào /account/order để xem trạng thái đơn.",
      "Nhấn “Sao chép” để copy thông tin đăng nhập / link.",
      "Có vấn đề? Mở chat với người bán hoặc admin trong 24h.",
    ],
    ctaLabel: "Lịch sử đơn của tôi",
    ctaHref: "/account/order",
  },
];

const SELLER_STEPS: Step[] = [
  {
    illustration: SellerStep1Kyc,
    title: "Xác minh KYC CCCD",
    desc: "Chứng thực danh tính để mở khóa quyền đăng bán và rút tiền.",
    bullets: [
      "Vào /account/kyc → tải ảnh CCCD mặt trước, mặt sau.",
      "Selfie cầm CCCD để hệ thống đối chiếu.",
      "Đợi admin duyệt (thường 1–24h).",
    ],
    ctaLabel: "Đăng ký KYC",
    ctaHref: "/account/kyc",
  },
  {
    illustration: SellerStep2Bank,
    title: "Liên kết ngân hàng rút tiền",
    desc: "Lưu tài khoản ngân hàng chính chủ để rút doanh thu nhanh chóng.",
    bullets: [
      "Vào /account/bank → chọn ngân hàng từ danh sách.",
      "Nhập số tài khoản + tên chủ tài khoản (phải khớp KYC).",
      "Xác thực OTP qua email để hoàn tất.",
    ],
    ctaLabel: "Thêm ngân hàng",
    ctaHref: "/account/bank",
  },
  {
    illustration: SellerStep3Telegram,
    title: "Cấu hình Telegram Bot (tuỳ chọn)",
    desc: "Nhận thông báo đơn mới ngay trên điện thoại để không bỏ lỡ.",
    bullets: [
      "Vào /account/seller/telegram → mở @KhomanguonBot.",
      "Gõ /start → bot trả về token cá nhân.",
      "Dán token vào ô cấu hình → bấm “Lưu”.",
    ],
    ctaLabel: "Kết nối Telegram",
    ctaHref: "/account/seller/telegram",
  },
  {
    illustration: SellerStep4Upload,
    title: "Đăng sản phẩm đầu tiên",
    desc: "Mỗi sản phẩm cần ảnh, mô tả ≥ 10 ký tự, danh mục và giá.",
    bullets: [
      "Vào /account/seller/products → bấm “+ Thêm sản phẩm”.",
      "Tải tối đa 30 ảnh, chọn danh mục, viết mô tả chi tiết.",
      "Cấu hình bàn giao: Sản phẩm số / Tài khoản AI / Source code.",
    ],
    ctaLabel: "Đăng sản phẩm",
    ctaHref: "/account/seller/products",
  },
  {
    illustration: SellerStep5OrderIn,
    title: "Nhận đơn vào",
    desc: "Mỗi đơn mới đều có thông báo + đếm ngược 24h trước khi tự hoàn.",
    bullets: [
      "Vào /account/seller/orders → tab “Chờ trả”.",
      "Xem chi tiết người mua, sản phẩm, biến thể, số lượng.",
      "Telegram bot báo thêm 1 lần khi có đơn mới.",
    ],
    ctaLabel: "Đơn cần trả",
    ctaHref: "/account/seller/orders",
  },
  {
    illustration: SellerStep6Fulfill,
    title: "Bàn giao trong 24h",
    desc: "Tuỳ loại sản phẩm, nhập đúng thông tin để giao cho người mua.",
    bullets: [
      "Tài khoản AI: nhập username, password, mã 2FA (nếu có).",
      "Source code: dán URL Google Drive / Mega / GitHub.",
      "Bấm “Xác nhận trả” → tiền chuyển vào ví của bạn.",
    ],
  },
  {
    illustration: SellerStep7Wallet,
    title: "Nhận tiền & rút về ngân hàng",
    desc: "Doanh thu chảy vào ví theo thời gian thực, rút bất cứ khi nào.",
    bullets: [
      "Vào /account/wallet → xem số dư khả dụng.",
      "Bấm “Rút tiền” → chọn ngân hàng đã liên kết.",
      "Xác thực OTP email → admin duyệt → tiền về tài khoản trong vài giờ.",
    ],
    ctaLabel: "Mở ví của tôi",
    ctaHref: "/account/wallet",
  },
];

type TabKey = "buyer" | "seller";

export default function GuideTabs() {
  const [tab, setTab] = useState<TabKey>("buyer");
  const steps = tab === "buyer" ? BUYER_STEPS : SELLER_STEPS;

  return (
    <div className="space-y-8">
      {/* Tab toggle */}
      <div className="mx-auto flex w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setTab("buyer")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all sm:text-base",
            tab === "buyer"
              ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200"
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
          Người mua
        </button>
        <button
          type="button"
          onClick={() => setTab("seller")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all sm:text-base",
            tab === "seller"
              ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200"
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <Store className="h-4 w-4 sm:h-5 sm:w-5" />
          Người bán
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, idx) => {
          const Illustration = step.illustration;
          const isEven = idx % 2 === 0;
          return (
            <div
              key={`${tab}-${idx}`}
              className={cn(
                "grid gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg sm:p-7 lg:grid-cols-2 lg:gap-10 lg:p-8",
                !isEven && "lg:[&>:first-child]:order-2"
              )}
            >
              {/* Illustration */}
              <div className="overflow-hidden rounded-2xl">
                <Illustration className="aspect-[16/10] w-full" />
              </div>

              {/* Content */}
              <div className="flex flex-col justify-center">
                <span
                  className={cn(
                    "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                    tab === "buyer"
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-emerald-50 text-emerald-700"
                  )}
                >
                  Bước {idx + 1} / {steps.length}
                </span>
                <h3 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {step.desc}
                </p>

                <ul className="mt-4 space-y-2.5">
                  {step.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 sm:text-[15px]">
                      <CheckCircle2
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          tab === "buyer" ? "text-indigo-500" : "text-emerald-500"
                        )}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {step.ctaLabel && step.ctaHref && (
                  <Link
                    href={step.ctaHref}
                    className={cn(
                      "mt-5 inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg",
                      tab === "buyer"
                        ? "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-200"
                        : "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-200"
                    )}
                  >
                    {step.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
