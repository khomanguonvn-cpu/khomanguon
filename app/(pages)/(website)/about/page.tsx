export const runtime = 'edge';

import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Zap, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Giới thiệu - KHOMANGUON.IO.VN",
  description: "Tìm hiểu về KHOMANGUON.IO.VN - Nền tảng marketplace sản phẩm số hàng đầu Việt Nam",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
            Về chúng tôi
          </h1>
          <p className="text-lg text-slate-500">
            KHOMANGUON.IO.VN - Chợ sản phẩm số hàng đầu Việt Nam
          </p>
        </div>

        <div className="prose prose-lg mx-auto text-slate-600">
          <p>
            <strong>KHOMANGUON.IO.VN</strong> là nền tảng marketplace chuyên cung cấp các sản phẩm số chất lượng cao bao gồm: tài khoản, mã nguồn, AI tools, SaaS, và các công cụ MMO.
          </p>
          <p>
            Chúng tôi cam kết mang đến trải nghiệm mua sắm an toàn, nhanh chóng với hệ thống giao hàng tự động 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: ShieldCheck, title: "Bảo mật", desc: "Thanh toán được mã hóa và bảo vệ" },
            { icon: Zap, title: "Tự động", desc: "Giao hàng tự động 24/7" },
            { icon: Star, title: "Chất lượng", desc: "Sản phẩm được kiểm duyệt kỹ" },
          ].map((item, i) => (
            <div key={i} className="text-center p-6 rounded-xl bg-slate-50 border border-slate-200">
              <item.icon className="h-10 w-10 text-primary-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/contact" className="text-primary-600 font-medium hover:underline">
            Liên hệ với chúng tôi →
          </Link>
        </div>
      </div>
    </div>
  );
}