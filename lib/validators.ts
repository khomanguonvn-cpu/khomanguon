import { z } from "zod";

export const couponApplySchema = z.object({
  coupon: z.string().trim().min(1, "Mã giảm giá là bắt buộc"),
  user: z.coerce.number().int().positive("Người dùng không hợp lệ"),
});

const shippingAddressShape = {
  firstName: z.string().trim().default(""),
  lastName: z.string().trim().default(""),
  phoneNumber: z.string().trim().default(""),
  state: z.string().trim().default(""),
  city: z.string().trim().default(""),
  zipCode: z.string().trim().default(""),
  address: z.string().trim().default(""),
  country: z.string().trim().default(""),
  deliveryInfo: z.string().trim().default(""),
};

const accountVariantSchema = z.object({
  type: z.string().trim().min(1, "Loại tài khoản không hợp lệ"),
  durationDays: z.coerce
    .number()
    .int("Số ngày sử dụng phải là số nguyên")
    .positive("Số ngày sử dụng phải lớn hơn 0"),
  label: z.string().trim().optional().default(""),
});

const orderProductSchema = z
  .object({
    _uid: z.string().trim().min(1, "Thiếu mã định danh biến thể sản phẩm"),
    product: z.union([z.string(), z.number()]).transform(String).default(""),
    sellerProductId: z.coerce
      .number()
      .int("sellerProductId không hợp lệ")
      .positive("sellerProductId không hợp lệ"),
    name: z.string().trim().min(1, "Tên sản phẩm là bắt buộc"),
    sku: z.string().trim().default(""),
    option: z.string().trim().default(""),
    qty: z.coerce.number().int().positive("Số lượng sản phẩm phải lớn hơn 0"),
    price: z.coerce.number().nonnegative("Giá sản phẩm không hợp lệ"),
    productType: z
      .enum(["physical", "digital", "ai_account", "service", "source_code"])
      .optional()
      .default("digital"),
    selectedVariantId: z.string().trim().min(1, "Thiếu biến thể đã chọn"),
    accountVariant: accountVariantSchema.optional(),
  })
  .passthrough()
  .superRefine((product, ctx) => {
    if (product.productType === "ai_account" && !product.accountVariant) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accountVariant"],
        message:
          "Sản phẩm tài khoản AI bắt buộc có thông tin biến thể (loại tài khoản, số ngày)",
      });
    }
  });

export const shippingCreateSchema = z.object({
  shipping: z.object(shippingAddressShape),
  user_id: z.coerce.number().int().positive("user_id không hợp lệ"),
});

export const orderCreateSchema = z.object({
  user: z.coerce.number().int().positive("user không hợp lệ"),
  products: z
    .array(orderProductSchema)
    .min(1, "Đơn hàng phải có ít nhất 1 sản phẩm")
    .default([]),
  shippingAddress: z.object(shippingAddressShape).optional(),
  deliveryInfo: z.string().trim().default(""),
  paymentMethod: z.string().trim().min(1, "paymentMethod là bắt buộc"),
  total: z.coerce.number().nonnegative("total không hợp lệ"),
  totalBeforeDiscount: z.coerce
    .number()
    .nonnegative("totalBeforeDiscount không hợp lệ"),
  couponApplied: z.string().trim().optional().nullable(),
  shippingStatus: z.string().trim().default("pending_handover"),
  shippingTimes: z.string().trim().default(""),
  shippingPrice: z.coerce.number().nonnegative().default(0),
  idempotencyKey: z.string().trim().min(1, "idempotencyKey là bắt buộc"),
});

const sellerVariantValueSchema = z.object({
  key: z.string().trim().min(1, "Thiếu key thuộc tính biến thể"),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const sellerProductVariantSchema = z.object({
  id: z.string().trim().min(1, "Thiếu id biến thể"),
  label: z.string().trim().min(1, "Thiếu tên biến thể"),
  price: z.coerce.number().nonnegative("Giá biến thể không hợp lệ"),
  stock: z.coerce.number().int().nonnegative("Tồn kho biến thể không hợp lệ"),
  attributes: z.array(sellerVariantValueSchema).default([]),
});

const safeUrlSchema = z
  .string()
  .trim()
  .url("URL không hợp lệ")
  .refine((value) => /^https?:\/\//i.test(value), "URL phải bắt đầu bằng http:// hoặc https://");

export const sellerProductAssetSchema = z.object({
  type: z.literal("image"),
  url: safeUrlSchema,
  label: z.string().trim().max(120).optional().default(""),
});

export const sellerAccountCredentialSchema = z.object({
  id: z.string().trim().min(1, "Thiếu ID tài khoản"),
  accountType: z.string().trim().min(1, "Thiếu loại tài khoản"),
  username: z.string().trim().min(1, "Thiếu tên đăng nhập"),
  password: z.string().trim().min(1, "Thiếu mật khẩu"),
  note: z.string().trim().max(500).optional().default(""),
});

export const sellerSourceDownloadSchema = z.object({
  id: z.string().trim().min(1, "Thiếu ID link tải"),
  label: z.string().trim().min(1, "Thiếu tên hiển thị link"),
  url: safeUrlSchema,
  note: z.string().trim().max(500).optional().default(""),
  passwordHint: z.string().trim().max(200).optional().default(""),
});

export const sellerSecureDeliverySchema = z.object({
  accountCredentials: z.array(sellerAccountCredentialSchema).max(500).default([]),
  sourceDownloads: z.array(sellerSourceDownloadSchema).max(500).default([]),
});

const sellerProductBaseSchema = z.object({
  categorySlug: z.string().trim().min(1, "Thiếu danh mục cha"),
  subcategorySlug: z.string().trim().min(1, "Thiếu danh mục con"),
  name: z.string().trim().min(3, "Tên sản phẩm quá ngắn"),
  description: z.string().trim().min(10, "Mô tả sản phẩm quá ngắn"),
  deliveryMethod: z
    .enum(["manual", "digital", "ai_account", "source_code", "service"])
    .default("digital"),
  stock: z.coerce.number().int().nonnegative("Tồn kho không hợp lệ"),
  basePrice: z.coerce.number().nonnegative("Giá gốc không hợp lệ"),
  variants: z
    .array(sellerProductVariantSchema)
    .min(1, "Phải khai báo ít nhất 1 biến thể"),
  assets: z.array(sellerProductAssetSchema).max(30).default([]),
  secureDelivery: sellerSecureDeliverySchema.default({
    accountCredentials: [],
    sourceDownloads: [],
  }),
});

export const sellerProductCreateSchema = sellerProductBaseSchema;

export const sellerProductUpdateSchema = sellerProductBaseSchema.partial();

export const sellerProductStatusSchema = z.object({
  status: z.enum(["active", "draft", "hidden"]),
});

export const sellerProductBulkDeleteSchema = z.object({
  ids: z
    .array(z.coerce.number().int().positive("id sản phẩm không hợp lệ"))
    .min(1, "Cần ít nhất 1 sản phẩm để xóa"),
});

export const sellerProductBulkStatusSchema = z.object({
  ids: z
    .array(z.coerce.number().int().positive("id sản phẩm không hợp lệ"))
    .min(1, "Cần ít nhất 1 sản phẩm để cập nhật trạng thái"),
  status: z.enum(["active", "draft", "hidden"]),
});

export const otpSendSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  purpose: z
    .enum([
      "email_verify",
      "password_reset",
      "change_password",
      "bank_link",
      "withdraw_request",
    ])
    .optional()
    .default("email_verify"),
});

export const otpVerifySchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  code: z.string().trim().min(4, "OTP không hợp lệ"),
  purpose: z
    .enum([
      "email_verify",
      "password_reset",
      "change_password",
      "bank_link",
      "withdraw_request",
    ])
    .optional()
    .default("email_verify"),
});

export const passwordResetSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  code: z.string().trim().min(4, "OTP không hợp lệ"),
  newPassword: z
    .string()
    .trim()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,
      "Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
    ),
});

export function zodDetails(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

export const fulfillAccountSchema = z.object({
  orderItemId: z.coerce.number().int().positive("orderItemId không hợp lệ"),
  username: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().trim().min(1, "Vui lòng nhập mật khẩu"),
  twoFactorCode: z.string().trim().optional().default(""),
});

export const fulfillSourceCodeSchema = z.object({
  orderItemId: z.coerce.number().int().positive("orderItemId không hợp lệ"),
  url: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập URL")
    .url("URL không hợp lệ")
    .refine(
      (value) => /^https?:\/\//i.test(value),
      "URL phải bắt đầu bằng http:// hoặc https://"
    ),
});
