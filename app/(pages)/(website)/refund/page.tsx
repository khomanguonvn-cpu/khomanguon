
import { Metadata } from "next";
import Link from "next/link";
import { RotateCcw, Clock, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách hoàn tiền - KHOMANGUON.IO.VN",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <RotateCcw className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Chính sách hoàn tiền</h1>
          <p className="text-slate-500">Chính sách hoàn tiền cho sản phẩm số tại KHOMANGUON.IO.VN</p>
        </div>

        <div className="space-y-8">
          <div className="flex gap-4 p-6 rounded-xl bg-green-50 border border-green-200">
            <ShieldCheck className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Đủ điều kiện hoàn tiền</h3>
              <p className="text-sm text-slate-600">Sản phẩm bị lỗi không thể sử dụng, mã không hoạt động, hoặc không đúng như mô tả.</p>
            </div>
          </div>

          <div className="flex gap-4 p-6 rounded-xl bg-slate-50 border border-slate-200">
            <Clock className="h-6 w-6 text-slate-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Thời hạn yêu cầu</h3>
              <p className="text-sm text-slate-600">Bạn cần báo cáo vấn đề trong vòng 24 giờ kể từ khi nhận được sản phẩm.</p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Quy trình hoàn tiền</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
              <li>Liên hệ hỗ trợ qua <Link href="/contact" className="text-primary-600 hover:underline">trang liên hệ</Link></li>
              <li>Cung cấp mô tả chi tiết vấn đề và mã sản phẩm</li>
              <li>Chờ đội ngũ kiểm tra trong 24 giờ</li>
              <li>Hoàn tiền qua phương thức thanh toán ban đầu</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}