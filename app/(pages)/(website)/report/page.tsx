export const runtime = 'edge';

import { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Báo cáo sự cố - KHOMANGUON.IO.VN",
};

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Báo cáo sự cố</h1>
        <p className="text-slate-500 mb-8">
          Nếu bạn gặp vấn đề với sản phẩm đã mua, vui lòng liên hệ để được hỗ trợ nhanh nhất.
        </p>

        <div className="space-y-4">
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors">
            Liên hệ hỗ trợ
          </Link>
          <p className="text-sm text-slate-400">
            Hoặc email: contact@khoinguon.io.vn
          </p>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-amber-50 border border-amber-200 text-left">
          <h2 className="font-bold text-slate-900 mb-2">Khi báo cáo, vui lòng cung cấp:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
            <li>Mã đơn hàng (order ID)</li>
            <li>Mô tả chi tiết vấn đề</li>
            <li>Hình ảnh/video mô tả lỗi (nếu có)</li>
            <li>Ảnh chụp màn hình lỗi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}