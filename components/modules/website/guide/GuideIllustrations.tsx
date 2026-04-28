/**
 * SVG illustrations for the user guide pages.
 * Each illustration mimics a UI panel that visually conveys what the step does.
 * Designed at viewBox 0 0 320 200 so they scale fluidly to any container.
 *
 * Tip: any of these can be exported to PNG by:
 *   1. Loading the /guide page
 *   2. Right-clicking the illustration > "Save image as..." (browsers offer SVG)
 *   3. Or using a screenshot at the desired size for a true PNG export.
 */

import React from "react";

type IllProps = { className?: string };

const Frame: React.FC<{ children: React.ReactNode; gradientFrom: string; gradientTo: string }> = ({
  children,
  gradientFrom,
  gradientTo,
}) => (
  <svg
    viewBox="0 0 320 200"
    xmlns="http://www.w3.org/2000/svg"
    className="h-full w-full"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id={`bg-${gradientFrom}-${gradientTo}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={gradientFrom} />
        <stop offset="100%" stopColor={gradientTo} />
      </linearGradient>
      <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
      </filter>
    </defs>
    <rect width="320" height="200" fill={`url(#bg-${gradientFrom}-${gradientTo})`} rx="16" />
    {/* Decorative grid */}
    <g opacity="0.08" stroke="white" strokeWidth="0.5">
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`h-${i}`} x1="0" y1={i * 25} x2="320" y2={i * 25} />
      ))}
      {Array.from({ length: 13 }).map((_, i) => (
        <line key={`v-${i}`} x1={i * 25} y1="0" x2={i * 25} y2="200" />
      ))}
    </g>
    {/* Decorative blobs */}
    <circle cx="280" cy="30" r="40" fill="white" opacity="0.1" />
    <circle cx="40" cy="170" r="30" fill="white" opacity="0.08" />
    {children}
  </svg>
);

/* ─────────── BUYER ─────────── */

export const BuyerStep1Register: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#6366f1" gradientTo="#8b5cf6">
      {/* Card */}
      <g filter="url(#soft-shadow)">
        <rect x="80" y="40" width="160" height="120" rx="14" fill="white" />
        {/* Avatar circle */}
        <circle cx="160" cy="76" r="20" fill="#e0e7ff" />
        <circle cx="160" cy="70" r="6" fill="#6366f1" />
        <path d="M148 88c0-6 6-10 12-10s12 4 12 10" fill="#6366f1" />
        {/* Email field */}
        <rect x="96" y="106" width="128" height="14" rx="4" fill="#f1f5f9" />
        <rect x="100" y="111" width="60" height="4" rx="2" fill="#94a3b8" />
        {/* Password field */}
        <rect x="96" y="124" width="128" height="14" rx="4" fill="#f1f5f9" />
        <circle cx="104" cy="131" r="2" fill="#94a3b8" />
        <circle cx="110" cy="131" r="2" fill="#94a3b8" />
        <circle cx="116" cy="131" r="2" fill="#94a3b8" />
        {/* CTA */}
        <rect x="96" y="143" width="128" height="12" rx="4" fill="#6366f1" />
        <text x="160" y="151" fontSize="7" fontWeight="700" fill="white" textAnchor="middle">ĐĂNG KÝ</text>
      </g>
      {/* Step badge */}
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#6366f1" textAnchor="middle">1</text>
      </g>
    </Frame>
  </div>
);

export const BuyerStep2Browse: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#0ea5e9" gradientTo="#06b6d4">
      <g filter="url(#soft-shadow)">
        <rect x="40" y="30" width="240" height="140" rx="12" fill="white" />
        {/* Search bar */}
        <rect x="52" y="42" width="216" height="20" rx="10" fill="#f1f5f9" />
        <circle cx="62" cy="52" r="4" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
        <line x1="65" y1="55" x2="68" y2="58" stroke="#0ea5e9" strokeWidth="1.5" />
        <text x="74" y="55" fontSize="6" fill="#94a3b8">Tìm sản phẩm số...</text>
        {/* Product grid */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={52 + i * 76} y="72" width="68" height="48" rx="6" fill="#e0f2fe" />
            <rect x={56 + i * 76} y="76" width="60" height="28" rx="4" fill="#0ea5e9" opacity="0.4" />
            <rect x={56 + i * 76} y="106" width="40" height="3" rx="1" fill="#0c4a6e" />
            <rect x={56 + i * 76} y="112" width="28" height="3" rx="1" fill="#0ea5e9" />
          </g>
        ))}
        {/* Filter pills */}
        <rect x="52" y="130" width="40" height="14" rx="7" fill="#0ea5e9" />
        <text x="72" y="139" fontSize="6" fontWeight="700" fill="white" textAnchor="middle">AI</text>
        <rect x="96" y="130" width="50" height="14" rx="7" fill="#f1f5f9" />
        <text x="121" y="139" fontSize="6" fontWeight="600" fill="#64748b" textAnchor="middle">Mã nguồn</text>
        <rect x="150" y="130" width="40" height="14" rx="7" fill="#f1f5f9" />
        <text x="170" y="139" fontSize="6" fontWeight="600" fill="#64748b" textAnchor="middle">SaaS</text>
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#0ea5e9" textAnchor="middle">2</text>
      </g>
    </Frame>
  </div>
);

export const BuyerStep3Cart: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#f59e0b" gradientTo="#f97316">
      <g filter="url(#soft-shadow)">
        <rect x="60" y="30" width="200" height="140" rx="12" fill="white" />
        {/* Header */}
        <text x="72" y="48" fontSize="9" fontWeight="800" fill="#0f172a">GIỎ HÀNG</text>
        <line x1="72" y1="56" x2="248" y2="56" stroke="#e2e8f0" strokeWidth="1" />
        {/* Item 1 */}
        <rect x="72" y="64" width="32" height="32" rx="6" fill="#fef3c7" />
        <rect x="80" y="72" width="16" height="16" rx="2" fill="#f59e0b" />
        <rect x="110" y="68" width="80" height="4" rx="2" fill="#0f172a" />
        <rect x="110" y="78" width="50" height="3" rx="1" fill="#94a3b8" />
        <text x="240" y="84" fontSize="8" fontWeight="800" fill="#f59e0b" textAnchor="end">299K</text>
        {/* Item 2 */}
        <rect x="72" y="104" width="32" height="32" rx="6" fill="#fef3c7" />
        <rect x="80" y="112" width="16" height="16" rx="2" fill="#f59e0b" />
        <rect x="110" y="108" width="70" height="4" rx="2" fill="#0f172a" />
        <rect x="110" y="118" width="40" height="3" rx="1" fill="#94a3b8" />
        <text x="240" y="124" fontSize="8" fontWeight="800" fill="#f59e0b" textAnchor="end">499K</text>
        {/* Total */}
        <line x1="72" y1="146" x2="248" y2="146" stroke="#e2e8f0" strokeWidth="1" />
        <text x="72" y="160" fontSize="7" fontWeight="700" fill="#64748b">Tổng cộng</text>
        <text x="248" y="160" fontSize="10" fontWeight="800" fill="#f97316" textAnchor="end">798K</text>
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#f97316" textAnchor="middle">3</text>
      </g>
    </Frame>
  </div>
);

export const BuyerStep4Pay: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#10b981" gradientTo="#14b8a6">
      <g filter="url(#soft-shadow)">
        <rect x="70" y="30" width="180" height="140" rx="12" fill="white" />
        {/* Title */}
        <text x="160" y="48" fontSize="9" fontWeight="800" fill="#0f172a" textAnchor="middle">THANH TOÁN</text>
        {/* QR mock */}
        <rect x="120" y="58" width="80" height="80" rx="8" fill="#0f172a" />
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <rect
              key={`${r}-${c}`}
              x={124 + c * 12}
              y={62 + r * 12}
              width="8"
              height="8"
              fill={(r + c) % 3 === 0 || r === 0 || c === 5 ? "white" : "#0f172a"}
            />
          ))
        )}
        {/* PayOS badge */}
        <rect x="100" y="146" width="120" height="14" rx="7" fill="#d1fae5" />
        <circle cx="112" cy="153" r="3" fill="#10b981" />
        <text x="160" y="156" fontSize="6" fontWeight="700" fill="#047857" textAnchor="middle">Quét QR PayOS để thanh toán</text>
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#10b981" textAnchor="middle">4</text>
      </g>
    </Frame>
  </div>
);

export const BuyerStep5Receive: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#22c55e" gradientTo="#84cc16">
      <g filter="url(#soft-shadow)">
        <rect x="50" y="34" width="220" height="132" rx="12" fill="white" />
        {/* Email envelope */}
        <rect x="62" y="50" width="60" height="40" rx="4" fill="#dcfce7" />
        <path d="M62 50 L92 75 L122 50" stroke="#16a34a" strokeWidth="2" fill="none" />
        {/* Success badge */}
        <circle cx="118" cy="56" r="10" fill="#16a34a" />
        <path d="M114 57 L117 60 L122 53" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Content */}
        <text x="135" y="62" fontSize="8" fontWeight="800" fill="#0f172a">Đơn hàng đã giao!</text>
        <text x="135" y="74" fontSize="6" fill="#64748b">Sản phẩm đã sẵn sàng tại</text>
        <text x="135" y="84" fontSize="6" fill="#64748b">trang chi tiết đơn.</text>
        {/* Credentials box */}
        <rect x="62" y="100" width="196" height="50" rx="6" fill="#f0fdf4" stroke="#86efac" strokeDasharray="3 2" />
        <text x="72" y="116" fontSize="6" fontWeight="700" fill="#166534">USERNAME</text>
        <rect x="72" y="120" width="80" height="3" rx="1" fill="#16a34a" />
        <text x="72" y="135" fontSize="6" fontWeight="700" fill="#166534">PASSWORD</text>
        <text x="72" y="145" fontSize="6" fontFamily="monospace" fill="#16a34a">●●●●●●●●●●●●</text>
        {/* Copy icon */}
        <rect x="232" y="108" width="18" height="18" rx="3" fill="#16a34a" />
        <rect x="234" y="110" width="14" height="14" rx="2" fill="white" opacity="0.3" />
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#16a34a" textAnchor="middle">5</text>
      </g>
    </Frame>
  </div>
);

export const BuyerStep6Track: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#8b5cf6" gradientTo="#d946ef">
      <g filter="url(#soft-shadow)">
        <rect x="40" y="30" width="240" height="140" rx="12" fill="white" />
        <text x="52" y="48" fontSize="8" fontWeight="800" fill="#0f172a">LỊCH SỬ ĐƠN HÀNG</text>
        {/* Rows */}
        {[
          { y: 60, status: "Đã giao", color: "#16a34a", bg: "#dcfce7" },
          { y: 90, status: "Đang xử lý", color: "#f59e0b", bg: "#fef3c7" },
          { y: 120, status: "Đã giao", color: "#16a34a", bg: "#dcfce7" },
        ].map((row, i) => (
          <g key={i}>
            <rect x="52" y={row.y} width="216" height="22" rx="6" fill="#f8fafc" />
            <text x="60" y={row.y + 11} fontSize="6" fontWeight="700" fill="#0f172a">#{1024 + i}</text>
            <text x="60" y={row.y + 18} fontSize="5" fill="#64748b">28/04/2026</text>
            <rect x="120" y={row.y + 6} width="60" height="3" rx="1" fill="#94a3b8" />
            <rect x="120" y={row.y + 13} width="40" height="3" rx="1" fill="#cbd5e1" />
            <rect x={188} y={row.y + 6} width={50} height="10" rx="5" fill={row.bg} />
            <text x={213} y={row.y + 13} fontSize="5" fontWeight="700" fill={row.color} textAnchor="middle">{row.status}</text>
          </g>
        ))}
        {/* Stats footer */}
        <rect x="52" y="148" width="216" height="14" rx="4" fill="#f1f5f9" />
        <text x="60" y="158" fontSize="5" fontWeight="700" fill="#16a34a">✓ 2 đã giao</text>
        <text x="120" y="158" fontSize="5" fontWeight="700" fill="#f59e0b">⏱ 1 đang xử lý</text>
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#8b5cf6" textAnchor="middle">6</text>
      </g>
    </Frame>
  </div>
);

/* ─────────── SELLER ─────────── */

export const SellerStep1Kyc: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#f59e0b" gradientTo="#ef4444">
      <g filter="url(#soft-shadow)">
        <rect x="60" y="40" width="200" height="120" rx="12" fill="white" />
        {/* ID card */}
        <rect x="74" y="56" width="172" height="86" rx="8" fill="#fef3c7" />
        <rect x="86" y="68" width="50" height="62" rx="4" fill="#f59e0b" opacity="0.3" />
        <circle cx="111" cy="92" r="10" fill="#f59e0b" />
        <path d="M99 110c0-7 6-12 12-12s12 5 12 12" fill="#f59e0b" />
        {/* Info lines */}
        <rect x="146" y="72" width="80" height="4" rx="1" fill="#92400e" />
        <rect x="146" y="82" width="60" height="3" rx="1" fill="#b45309" />
        <rect x="146" y="92" width="70" height="3" rx="1" fill="#b45309" />
        <rect x="146" y="102" width="50" height="3" rx="1" fill="#b45309" />
        {/* Verified stamp */}
        <circle cx="226" cy="126" r="14" fill="#16a34a" />
        <path d="M220 126 L224 130 L232 122" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#f59e0b" textAnchor="middle">1</text>
      </g>
    </Frame>
  </div>
);

export const SellerStep2Bank: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#3b82f6" gradientTo="#6366f1">
      <g filter="url(#soft-shadow)">
        {/* Bank card */}
        <rect x="60" y="50" width="200" height="110" rx="12" fill="url(#card-grad)" />
        <defs>
          <linearGradient id="card-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
        </defs>
        {/* Chip */}
        <rect x="76" y="78" width="24" height="18" rx="3" fill="#fbbf24" />
        <line x1="80" y1="83" x2="96" y2="83" stroke="#92400e" strokeWidth="0.5" />
        <line x1="80" y1="87" x2="96" y2="87" stroke="#92400e" strokeWidth="0.5" />
        <line x1="80" y1="91" x2="96" y2="91" stroke="#92400e" strokeWidth="0.5" />
        {/* Number */}
        <text x="76" y="120" fontSize="9" fontWeight="700" fill="white" letterSpacing="2">**** **** **** 6868</text>
        {/* Name */}
        <text x="76" y="138" fontSize="6" fill="#cbd5e1" letterSpacing="1">CHỦ THẺ</text>
        <text x="76" y="148" fontSize="7" fontWeight="700" fill="white" letterSpacing="1">NGUYỄN VĂN A</text>
        {/* Bank logo */}
        <text x="244" y="74" fontSize="9" fontWeight="800" fill="white" textAnchor="end">VCB</text>
        {/* Linked check */}
        <circle cx="244" cy="142" r="10" fill="#22c55e" />
        <path d="M239 142 L242 145 L249 138" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#3b82f6" textAnchor="middle">2</text>
      </g>
    </Frame>
  </div>
);

export const SellerStep3Telegram: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#0ea5e9" gradientTo="#0284c7">
      <g filter="url(#soft-shadow)">
        {/* Phone frame */}
        <rect x="120" y="30" width="80" height="140" rx="12" fill="#0f172a" />
        <rect x="126" y="40" width="68" height="120" rx="6" fill="white" />
        {/* Status bar */}
        <rect x="126" y="40" width="68" height="14" rx="6" fill="#0ea5e9" />
        <text x="160" y="50" fontSize="6" fontWeight="800" fill="white" textAnchor="middle">@KhomanguonBot</text>
        {/* Message bubbles */}
        <rect x="132" y="60" width="48" height="14" rx="6" fill="#e0f2fe" />
        <text x="156" y="69" fontSize="5" fontWeight="600" fill="#0c4a6e" textAnchor="middle">/start</text>
        <rect x="138" y="80" width="54" height="20" rx="6" fill="#0ea5e9" />
        <text x="165" y="88" fontSize="4.5" fontWeight="700" fill="white" textAnchor="middle">Đã liên kết!</text>
        <text x="165" y="95" fontSize="4" fill="white" opacity="0.9" textAnchor="middle">Token: ABC123...</text>
        {/* New order notification */}
        <rect x="132" y="106" width="56" height="36" rx="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="0.5" />
        <text x="160" y="116" fontSize="5" fontWeight="800" fill="#92400e" textAnchor="middle">📦 ĐƠN MỚI!</text>
        <text x="160" y="125" fontSize="4" fill="#78350f" textAnchor="middle">Đơn #1024 vừa được</text>
        <text x="160" y="131" fontSize="4" fill="#78350f" textAnchor="middle">đặt. Kiểm tra ngay.</text>
        <rect x="148" y="135" width="24" height="5" rx="2.5" fill="#f59e0b" />
        {/* Home button */}
        <circle cx="160" cy="166" r="3" fill="#475569" />
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#0ea5e9" textAnchor="middle">3</text>
      </g>
    </Frame>
  </div>
);

export const SellerStep4Upload: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#06b6d4" gradientTo="#0ea5e9">
      <g filter="url(#soft-shadow)">
        <rect x="40" y="30" width="240" height="140" rx="12" fill="white" />
        <text x="52" y="48" fontSize="8" fontWeight="800" fill="#0f172a">ĐĂNG SẢN PHẨM MỚI</text>
        {/* Image upload */}
        <rect x="52" y="58" width="60" height="48" rx="6" fill="#f0fdfa" stroke="#06b6d4" strokeDasharray="3 2" />
        <circle cx="82" cy="78" r="6" fill="#06b6d4" />
        <line x1="82" y1="74" x2="82" y2="82" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="78" y1="78" x2="86" y2="78" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <text x="82" y="98" fontSize="5" fontWeight="700" fill="#0e7490" textAnchor="middle">Tải ảnh</text>
        {/* Form fields */}
        <text x="124" y="68" fontSize="5" fontWeight="700" fill="#475569">TÊN SẢN PHẨM</text>
        <rect x="124" y="72" width="142" height="12" rx="3" fill="#f1f5f9" />
        <rect x="128" y="76" width="80" height="4" rx="1" fill="#0f172a" />
        <text x="124" y="94" fontSize="5" fontWeight="700" fill="#475569">DANH MỤC</text>
        <rect x="124" y="98" width="68" height="12" rx="3" fill="#06b6d4" />
        <text x="158" y="106" fontSize="5" fontWeight="700" fill="white" textAnchor="middle">Mã nguồn</text>
        <rect x="198" y="98" width="68" height="12" rx="3" fill="#f1f5f9" />
        <text x="232" y="106" fontSize="5" fontWeight="600" fill="#64748b" textAnchor="middle">+ chọn</text>
        {/* Price */}
        <text x="52" y="124" fontSize="5" fontWeight="700" fill="#475569">GIÁ BÁN</text>
        <rect x="52" y="128" width="100" height="14" rx="4" fill="#f1f5f9" />
        <text x="58" y="138" fontSize="7" fontWeight="800" fill="#06b6d4">499,000đ</text>
        {/* CTA */}
        <rect x="180" y="128" width="86" height="14" rx="4" fill="#06b6d4" />
        <text x="223" y="137" fontSize="6" fontWeight="800" fill="white" textAnchor="middle">ĐĂNG NGAY</text>
        {/* Status */}
        <rect x="52" y="150" width="60" height="12" rx="6" fill="#dcfce7" />
        <circle cx="60" cy="156" r="2" fill="#16a34a" />
        <text x="68" y="158" fontSize="5" fontWeight="700" fill="#166534">Đã duyệt</text>
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#06b6d4" textAnchor="middle">4</text>
      </g>
    </Frame>
  </div>
);

export const SellerStep5OrderIn: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#f97316" gradientTo="#ef4444">
      <g filter="url(#soft-shadow)">
        <rect x="40" y="30" width="240" height="140" rx="12" fill="white" />
        {/* Header with badge */}
        <text x="52" y="48" fontSize="8" fontWeight="800" fill="#0f172a">ĐƠN CẦN TRẢ</text>
        <rect x="120" y="40" width="60" height="14" rx="7" fill="#ef4444" />
        <circle cx="130" cy="47" r="3" fill="white" />
        <text x="155" y="49" fontSize="6" fontWeight="800" fill="white" textAnchor="middle">3 mới</text>
        {/* Order rows */}
        {[
          { y: 64, hot: true, name: "Source Code Web Bán Hàng", price: "499K" },
          { y: 96, hot: true, name: "Tài khoản ChatGPT Plus", price: "299K" },
          { y: 128, hot: false, name: "Template Landing Page", price: "199K" },
        ].map((order, i) => (
          <g key={i}>
            <rect x="52" y={order.y} width="216" height="26" rx="6" fill={order.hot ? "#fff7ed" : "#f8fafc"} stroke={order.hot ? "#fdba74" : "transparent"} />
            <rect x="58" y={order.y + 5} width="16" height="16" rx="3" fill="#f97316" opacity="0.3" />
            <rect x="62" y={order.y + 9} width="8" height="8" rx="1" fill="#f97316" />
            <text x="80" y={order.y + 12} fontSize="6" fontWeight="700" fill="#0f172a">#{1024 + i}</text>
            <text x="80" y={order.y + 19} fontSize="5" fill="#64748b">{order.name}</text>
            <text x="218" y={order.y + 12} fontSize="7" fontWeight="800" fill="#f97316">{order.price}</text>
            {order.hot ? (
              <g>
                <rect x={208} y={order.y + 16} width="50" height="6" rx="3" fill="#ef4444" />
                <text x={233} y={order.y + 20.5} fontSize="4" fontWeight="700" fill="white" textAnchor="middle">CÒN 23h 42p</text>
              </g>
            ) : (
              <text x="248" y={order.y + 20} fontSize="5" fill="#64748b" textAnchor="end">Còn 2 ngày</text>
            )}
          </g>
        ))}
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#f97316" textAnchor="middle">5</text>
      </g>
    </Frame>
  </div>
);

export const SellerStep6Fulfill: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#10b981" gradientTo="#059669">
      <g filter="url(#soft-shadow)">
        <rect x="50" y="30" width="220" height="140" rx="12" fill="white" />
        <text x="62" y="48" fontSize="8" fontWeight="800" fill="#0f172a">BÀN GIAO ĐƠN #1024</text>
        {/* Username */}
        <text x="62" y="64" fontSize="5" fontWeight="700" fill="#475569">USERNAME</text>
        <rect x="62" y="68" width="196" height="16" rx="4" fill="#f1f5f9" />
        <text x="68" y="78" fontSize="6" fontFamily="monospace" fill="#0f172a">customer@email.com</text>
        {/* Password */}
        <text x="62" y="94" fontSize="5" fontWeight="700" fill="#475569">PASSWORD</text>
        <rect x="62" y="98" width="196" height="16" rx="4" fill="#f1f5f9" />
        <text x="68" y="108" fontSize="6" fontFamily="monospace" fill="#0f172a">••••••••••••</text>
        {/* 2FA optional */}
        <text x="62" y="124" fontSize="5" fontWeight="700" fill="#475569">MÃ 2FA (TÙY CHỌN)</text>
        <rect x="62" y="128" width="80" height="16" rx="4" fill="#f1f5f9" />
        {/* CTA */}
        <rect x="160" y="128" width="98" height="16" rx="4" fill="#10b981" />
        <path d="M170 136 L174 140 L182 132" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <text x="220" y="138" fontSize="6" fontWeight="800" fill="white" textAnchor="middle">XÁC NHẬN TRẢ</text>
        {/* Earning preview */}
        <rect x="62" y="150" width="196" height="14" rx="4" fill="#dcfce7" />
        <text x="160" y="160" fontSize="6" fontWeight="700" fill="#166534" textAnchor="middle">+499.000đ vào ví sau khi trả thành công</text>
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#10b981" textAnchor="middle">6</text>
      </g>
    </Frame>
  </div>
);

export const SellerStep7Wallet: React.FC<IllProps> = ({ className }) => (
  <div className={className}>
    <Frame gradientFrom="#8b5cf6" gradientTo="#ec4899">
      <g filter="url(#soft-shadow)">
        <rect x="40" y="30" width="240" height="140" rx="12" fill="white" />
        {/* Wallet header */}
        <rect x="52" y="42" width="216" height="56" rx="8" fill="url(#wallet-grad)" />
        <defs>
          <linearGradient id="wallet-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <text x="62" y="58" fontSize="5" fontWeight="700" fill="white" opacity="0.85">SỐ DƯ KHẢ DỤNG</text>
        <text x="62" y="80" fontSize="14" fontWeight="800" fill="white">2.450.000đ</text>
        <rect x="200" y="50" width="60" height="20" rx="10" fill="white" opacity="0.25" />
        <text x="230" y="63" fontSize="6" fontWeight="800" fill="white" textAnchor="middle">+ NẠP</text>
        <rect x="200" y="74" width="60" height="20" rx="10" fill="white" />
        <text x="230" y="87" fontSize="6" fontWeight="800" fill="#0f766e" textAnchor="middle">RÚT TIỀN</text>
        {/* Transaction list */}
        {[
          { y: 108, label: "+ Trả đơn #1024", amt: "+499K", color: "#16a34a", bg: "#dcfce7" },
          { y: 128, label: "+ Trả đơn #1023", amt: "+299K", color: "#16a34a", bg: "#dcfce7" },
          { y: 148, label: "− Rút về VCB", amt: "−500K", color: "#dc2626", bg: "#fee2e2" },
        ].map((tx, i) => (
          <g key={i}>
            <circle cx="62" cy={tx.y + 4} r="4" fill={tx.bg} />
            <text x="74" y={tx.y + 7} fontSize="6" fontWeight="600" fill="#0f172a">{tx.label}</text>
            <text x="258" y={tx.y + 7} fontSize="6" fontWeight="800" fill={tx.color} textAnchor="end">{tx.amt}</text>
          </g>
        ))}
      </g>
      <g>
        <circle cx="40" cy="40" r="18" fill="white" opacity="0.95" />
        <text x="40" y="44" fontSize="14" fontWeight="800" fill="#8b5cf6" textAnchor="middle">7</text>
      </g>
    </Frame>
  </div>
);
