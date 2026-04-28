
import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, FileText, Eye } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách bảo mật - KHOMANGUON.IO.VN",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-extrabold text-slate-900">Chính sách bảo mật</h1>
        </div>

        <div className="prose prose-lg text-slate-600 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Thu thập thông tin</h2>
            <p>Chúng tôi thu thập thông tin cá nhân của bạn khi bạn đăng ký tài khoản, đặt hàng hoặc liên hệ với chúng tôi. Thông tin này bao gồm: tên, email, số điện thoại và địa chỉ giao hàng.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Sử dụng thông tin</h2>
            <p>Thông tin của bạn được sử dụng để xử lý đơn hàng, cung cấp hỗ trợ khách hàng và cải thiện dịch vụ. Chúng tôi không chia sẻ thông tin cá nhân với bên thứ ba trừ khi được yêu cầu bởi pháp luật.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Bảo mật thanh toán</h2>
            <p>Tất cả giao dịch thanh toán được mã hóa bằng công nghệ SSL/TLS. Chúng tôi không lưu trữ thông tin thẻ tín dụng của bạn trên máy chủ.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Quyền của bạn</h2>
            <p>Bạn có quyền truy cập, chỉnh sửa hoặc xóa thông tin cá nhân của mình. Để thực hiện, vui lòng liên hệ <Link href="/contact" className="text-primary-600 hover:underline">chúng tôi</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}