"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "../../custom/Logo";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Youtube,
  MessageCircle,
  Send,
  ShieldCheck,
  Truck,
  Headphones,
  Zap,
} from "lucide-react";
import { Category } from "@/types";
import axios from "axios";
import dynamic from "next/dynamic";

const VisitorCounter = dynamic(() => import("./VisitorCounter"), { ssr: false });

export default function Footer() {
  const { language } = useSelector((state: IRootState) => state.settings);
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const getCategories = async () => {
      try {
        const response = await axios.get("/api/categories");
        setCategories(response.data.data || []);
      } catch {
        // Lỗi tải dữ liệu
      }
    };
    getCategories();
  }, []);

  const txt = language === "vi" ? {
    brand: "KHOMANGUON.IO.VN",
    tagline: "Chợ sản phẩm số hàng đầu Việt Nam",
    description: "Nền tảng marketplace chuyên cung cấp các sản phẩm số chất lượng cao với giao hàng tự động 24/7.",
    products: "Sản phẩm",
    support: "Hỗ trợ",
    company: "Công ty",
    newsletter: "Đăng ký nhận tin",
    newsletterDesc: "Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt",
    subscribeBtn: "Đăng ký",
    paymentMethods: "Phương thức thanh toán",
    copyright: `© ${currentYear} KHOMANGUON.IO.VN — Bảo lưu mọi quyền.`,
    about: "Giới thiệu",
    privacy: "Chính sách bảo mật",
    terms: "Điều khoản sử dụng",
    refund: "Chính sách hoàn tiền",
    faq: "Câu hỏi thường gặp",
    contactUs: "Liên hệ",
    emailPlaceholder: "Nhập email của bạn...",
    autoDelivery: "Giao hàng tự động",
    securePayment: "Thanh toán bảo mật",
    support247: "Hỗ trợ 24/7",
    viewAll: "Xem tất cả",
    // Additional footer links
    accountLicense: "Tài khoản & License",
    sourceCode: "Mã nguồn",
    aiTools: "AI Tools",
    saas: "SaaS",
    gameMmo: "Game & MMO",
    templates: "Templates",
    userGuide: "Hướng dẫn sử dụng",
    news: "Tin tức",
  } : {
    brand: "KHOMANGUON.IO.VN",
    tagline: "Vietnam's Leading Digital Marketplace",
    description: "Premium digital marketplace offering high-quality products with 24/7 automated delivery.",
    products: "Products",
    support: "Support",
    company: "Company",
    newsletter: "Newsletter",
    newsletterDesc: "Get updates on new products and exclusive deals",
    subscribeBtn: "Subscribe",
    paymentMethods: "Payment Methods",
    copyright: `© ${currentYear} KHOMANGUON.IO.VN — All rights reserved.`,
    about: "About Us",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    refund: "Refund Policy",
    faq: "FAQ",
    contactUs: "Contact Us",
    emailPlaceholder: "Enter your email...",
    autoDelivery: "Auto Delivery",
    securePayment: "Secure Payment",
    support247: "24/7 Support",
    viewAll: "View all",
    // Additional footer links
    accountLicense: "Accounts & License",
    sourceCode: "Source Code",
    aiTools: "AI Tools",
    saas: "SaaS",
    gameMmo: "Game & MMO",
    templates: "Templates",
    userGuide: "User Guide",
    news: "News",
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmail("");
  };

  const trustItems = [
    { icon: Zap, label: txt.autoDelivery, color: "text-amber-500" },
    { icon: ShieldCheck, label: txt.securePayment, color: "text-green-500" },
    { icon: Headphones, label: txt.support247, color: "text-blue-500" },
  ];

  // Build category links from API data
  const categoryLinks = categories.length > 0
    ? categories.slice(0, 6).map((cat) => ({
        label: cat.name,
        href: `/categories/${cat.slug}/products`,
      }))
    : [
        { label: txt.accountLicense, href: "/products" },
        { label: txt.sourceCode, href: "/products" },
        { label: txt.aiTools, href: "/products" },
        { label: txt.saas, href: "/products" },
        { label: txt.gameMmo, href: "/products" },
        { label: txt.templates, href: "/products" },
      ];

  const companyLinks = [
    { label: txt.about, href: "/about" },
    { label: txt.privacy, href: "/privacy" },
    { label: txt.terms, href: "/terms" },
    { label: txt.refund, href: "/refund" },
  ];

  const supportLinks = [
    { label: txt.news, href: "/tin-tuc" },
    { label: txt.faq, href: "/faq" },
    { label: txt.userGuide, href: "/guide" },
    { label: txt.contactUs, href: "/contact" },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Trust Badges */}
      <div className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className={`${item.color} flex-shrink-0`}>
                  <item.icon className="h-8 w-8" />
                </div>
                <p className="text-white font-semibold text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <Logo isDark />
            <p className="text-slate-400 text-sm leading-relaxed">{txt.description}</p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 text-slate-400 hover:bg-primary-600 hover:text-white transition-all">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white transition-all">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="https://zalo.me" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 text-slate-400 hover:bg-blue-500 hover:text-white transition-all">
                <MessageCircle className="h-4 w-4" />
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 text-slate-400 hover:bg-primary-600 hover:text-white transition-all">
                <Send className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold text-base mb-4">{txt.products}</h3>
            <ul className="space-y-2.5">
              {categoryLinks.map((link, i) => (
                <li key={i}>
                  <Link href={link.href}
                    className="text-sm text-slate-400 hover:text-primary-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company + Support */}
          <div className="grid grid-cols-2 gap-6 lg:col-span-3">
            <div>
              <h3 className="text-white font-semibold text-base mb-4">{txt.company}</h3>
              <ul className="space-y-2.5">
                {companyLinks.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href}
                      className="text-sm text-slate-400 hover:text-primary-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-base mb-4">{txt.support}</h3>
              <ul className="space-y-2.5">
                {supportLinks.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href}
                      className="text-sm text-slate-400 hover:text-primary-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter + Contact */}
          <div className="sm:col-span-2 lg:col-span-3">
            <h3 className="text-white font-semibold text-base mb-4">{txt.newsletter}</h3>
            <p className="text-slate-400 text-sm mb-4">{txt.newsletterDesc}</p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={txt.emailPlaceholder}
                className="min-w-0 flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:border-primary-500 focus:outline-none transition-all"
              />
              <button type="submit"
                className="shrink-0 whitespace-nowrap px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
                {txt.subscribeBtn}
              </button>
            </form>
            <div className="mt-6 space-y-3">
              <a href="mailto:contact@khoinguon.io.vn"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary-400 transition-colors">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>contact@khoinguon.io.vn</span>
              </a>
              <a href="tel:+84868686868"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary-400 transition-colors">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>0868 686 868</span>
              </a>
            </div>
          </div>

          {/* Visitor Counter */}
          <div className="sm:col-span-2 lg:col-span-12">
            <VisitorCounter />
          </div>
        </div>

        {/* Payment + Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{txt.paymentMethods}</span>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {["Visa", "Mastercard", "PayPal", "Chuyển khoản"].map((method) => (
                <div key={method}
                  className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-400 font-medium">
                  {method}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-sm">{txt.copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
