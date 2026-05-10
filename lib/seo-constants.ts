/**
 * SEO Constants – Single Source of Truth
 *
 * Tất cả title, description fallback phải lấy từ đây.
 * Khi admin chưa cấu hình hoặc database chậm/lỗi,
 * hệ thống sẽ dùng các giá trị này thay thế.
 *
 * ĐỂ ĐỒNG BỘ: chỉ cần sửa ở file này, toàn bộ hệ thống sẽ theo.
 */

export const SEO_SITE_NAME = "KHOMANGUON.IO.VN";

export const SEO_DEFAULT_TITLE =
  "KHOMANGUON.IO.VN - Chợ Mua Bán Mã Nguồn & Tài Khoản Số";

export const SEO_TITLE_TEMPLATE = `%s | ${SEO_SITE_NAME}`;

export const SEO_DEFAULT_DESCRIPTION =
  "Nền tảng mua bán mã nguồn, tài khoản số, công cụ AI, SaaS, game MMO - Giao dịch an toàn, thanh toán tự động";

export const SEO_DEFAULT_KEYWORDS = [
  "khomanguon",
  "mã nguồn",
  "source code",
  "tài khoản số",
  "digital products",
  "AI tools",
  "MMO",
  "SaaS",
  "mua bán mã nguồn",
  "chợ sản phẩm số",
  "template",
  "game account",
  "phần mềm",
  "công cụ AI",
];

export const SEO_DEFAULT_BASE_URL = "https://khomanguon.io.vn";

export const SEO_DEFAULT_OG_IMAGE_PATH = "/assets/images/og.png";
export const SEO_DEFAULT_FAVICON_PATH = "/assets/images/logo.svg";
export const SEO_DEFAULT_LOGO_PATH = "/assets/images/logo.svg";

export function getSeoBaseUrl() {
  const fromEnv = String(process.env.NEXT_PUBLIC_SERVER_URL || "").trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  return SEO_DEFAULT_BASE_URL;
}
