
import { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng - KHOMANGUON.IO.VN",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-extrabold text-slate-900">Điều khoản sử dụng</h1>
        </div>

        <div className="prose prose-lg text-slate-600 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Chấp nhận điều khoản</h2>
            <p>Bằng cách sử dụng KHOMANGUON.IO.VN, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Tài khoản người dùng</h2>
            <p>Bạn chịu trách nhiệm bảo mật thông tin tài khoản của mình. Mọi hoạt động dưới tài khoản của bạn đều là trách nhiệm của bạn.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Sản phẩm số</h2>
            <p>Các sản phẩm số được mua không hoàn tiền trừ khi có lỗi từ phía nhà cung cấp. Vui lòng đọc kỹ mô tả sản phẩm trước khi mua.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Liên hệ</h2>
            <p>Nếu có câu hỏi về điều khoản này, vui lòng <Link href="/contact" className="text-primary-600 hover:underline">liên hệ chúng tôi</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}