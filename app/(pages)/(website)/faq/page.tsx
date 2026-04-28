import { Metadata } from "next";
import { HelpCircle, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ - KHOMANGUON.IO.VN",
};

const faqs = [
  { q: "Sản phẩm số được giao như thế nào?", a: "Sau khi thanh toán thành công, sản phẩm sẽ được giao tự động qua email hoặc hiển thị ngay trên trang tài khoản của bạn." },
  { q: "Tôi có thể hoàn tiền không?", a: "Bạn có thể yêu cầu hoàn tiền nếu sản phẩm bị lỗi hoặc không đúng như mô tả. Vui lòng báo cáo trong 24 giờ." },
  { q: "Thanh toán có an toàn không?", a: "Tất cả giao dịch được mã hóa SSL và xử lý qua cổng thanh toán được chứng nhận (Stripe, PayPal, PayOS)." },
  { q: "Tôi cần hỗ trợ, liên hệ ở đâu?", a: "Bạn có thể liên hệ qua email contact@khoinguon.io.vn hoặc sử dụng chat trực tuyến trên website." },
  { q: "Tài khoản có được bảo hành không?", a: "Tùy thuộc vào loại sản phẩm. Vui lòng đọc mô tả sản phẩm để biết chính sách bảo hành cụ thể." },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <HelpCircle className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Câu hỏi thường gặp</h1>
          <p className="text-slate-500">Các câu hỏi phổ biến về dịch vụ của KHOMANGUON.IO.VN</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-6 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
              <p className="text-sm text-slate-600">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center p-6 rounded-xl bg-primary-50 border border-primary-100">
          <p className="text-slate-600 mb-3">Không tìm thấy câu trả lời?</p>
          <a href="/contact" className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:underline">
            <MessageCircle className="h-4 w-4" />
            Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </div>
  );
}