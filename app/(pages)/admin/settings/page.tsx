
import Link from "next/link";
import {
  Search,
  CreditCard,
  Shield,
  Image,
  FolderTree,
  Newspaper,
  Layout,
} from "lucide-react";

const settingSections = [
  {
    title: "Giao diện Website",
    description: "Cấu hình TopBar, Footer, mạng xã hội và thông tin liên hệ.",
    href: "/admin/site-config",
    icon: Layout,
    color: "from-teal-500 to-emerald-500",
  },
  {
    title: "SEO website",
    description: "Cấu hình title, meta description, schema và mạng xã hội.",
    href: "/admin/seo",
    icon: Search,
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Thanh toán PayOS",
    description: "Quản lý cấu hình cổng thanh toán và webhook PayOS.",
    href: "/admin/payos",
    icon: CreditCard,
    color: "from-emerald-500 to-green-500",
  },
  {
    title: "Đăng nhập OAuth",
    description: "Cấu hình xác thực OAuth và thông tin đăng nhập quản trị.",
    href: "/admin/auth",
    icon: Shield,
    color: "from-violet-500 to-purple-500",
  },
  {
    title: "Banner trang chủ",
    description: "Quản lý slide/banner hiển thị trên website.",
    href: "/admin/slides",
    icon: Image,
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Danh mục sản phẩm",
    description: "Tạo và cập nhật danh mục cha/con cho sản phẩm.",
    href: "/admin/categories",
    icon: FolderTree,
    color: "from-cyan-500 to-sky-500",
  },
  {
    title: "Tin tức",
    description: "Thiết lập chuyên mục và nội dung hiển thị ở trang tin tức.",
    href: "/admin/news",
    icon: Newspaper,
    color: "from-rose-500 to-pink-500",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Cấu hình hệ thống</h2>
        <p className="mt-1 text-sm text-slate-600">
          Chọn nhóm cấu hình bên dưới để quản lý nhanh toàn bộ thiết lập quản trị.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settingSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-600">{section.description}</p>
              </div>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${section.color} text-white shadow-sm`}
              >
                <section.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-sm font-medium text-primary-600 group-hover:text-primary-700">
              Vào cấu hình →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
