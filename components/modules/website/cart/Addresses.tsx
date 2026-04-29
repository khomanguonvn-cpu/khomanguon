"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Cart, Payment } from "@/types";
import { payments } from "@/constants/index";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ClipLoader } from "react-spinners";
import Toast from "../../custom/Toast";
import { getClientErrorMessage } from "@/lib/client-error";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import CurrencyFormat from "../../custom/CurrencyFormat";
import { m } from "framer-motion";
import {
  CreditCard,
  ShieldCheck,
  Check,
  ChevronRight,
  Lock,
  Smartphone,
  Building2,
  Wallet,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

function normalizePaymentSlug(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "wallet_balance" || normalized === "walletbalance") {
    return "wallet";
  }
  return normalized;
}

const paymentIcons: Record<string, React.ElementType> = {
  payos: Smartphone,
  wallet: Wallet,
  bank: Building2,
};

export default function DigitalCheckout() {
  const { data: session } = useSession();
  const { language } = useSelector((state: IRootState) => state.settings);
  const router = useRouter();

  const [cart, setCart] = useState<Cart>();
  const [totalAfterDiscount, setTotalAfterDiscount] = useState(0);
  const [selectedPayment, setSelectedPayments] = useState<Payment>(payments[0]);
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    setLoading(true);
    axios
      .get("/api/cart", { params: { user_id: userId } })
      .then((response) => {
        setCart(response.data.data);
        setTotalAfterDiscount(response.data.data.cartTotal || 0);
      })
      .catch(() => {
        // Lỗi tải dữ liệu
      })
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  const applyCoupon = async () => {
    if (!coupon.trim() || !session?.user?.id) {
      return;
    }

    try {
      const response = await axios.post("/api/coupon", {
        coupon: coupon.trim(),
        user: session.user.id,
      });
      setTotalAfterDiscount(Number(response.data.discountPrice || totalAfterDiscount));
      toast.custom(<Toast message={t(language, "couponApplySuccess")} status="success" />);
    } catch (error) {
      toast.custom(
        <Toast
          message={getClientErrorMessage(error, t(language, "cartCouponInvalid"))}
          status="error"
        />
      );
    }
  };

  const placeOrderHandler = async () => {
    try {
      if (!cart || !selectedPayment || !session?.user?.id) {
        toast.error(t(language, "cartSelectPaymentDelivery"));
        return;
      }

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = `${session.user.id}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;
      }

      const normalizedProducts = (cart.products || []).map((item: any) => {
        const rawType = String(item.productType || item.deliveryMethod || "digital")
          .trim()
          .toLowerCase();
        const productType = (
          ["physical", "digital", "ai_account", "source_code", "service"] as const
        ).includes(rawType as "physical" | "digital" | "ai_account" | "source_code" | "service")
          ? rawType
          : "digital";

        const accountType = String(item?.accountVariant?.type || "").trim();
        const durationDays = Number(item?.accountVariant?.durationDays || 0);
        const accountLabel = String(item?.accountVariant?.label || "").trim();

        const accountVariant =
          productType === "ai_account" &&
          accountType &&
          Number.isFinite(durationDays) &&
          durationDays > 0
            ? {
                type: accountType,
                durationDays: Math.round(durationDays),
                label: accountLabel,
              }
            : undefined;

        return {
          _uid: String(item._uid || `${item.product || ""}_${item.selectedVariantId || ""}`),
          sellerProductId: Number(item.sellerProductId || item.product || 0),
          selectedVariantId: String(item.selectedVariantId || ""),
          qty: Number(item.qty || 0),
          price: Number(item.price || 0),
          name: String(item.name || ""),
          sku: String(item.sku || ""),
          option: String(item.option || ""),
          images: String(item?.images?.[0] || "/assets/images/logo.svg"),
          style:
            item?.style || {
              name: t(language, "defaultStyle"),
              color: "#111827",
              image: "/assets/images/logo.svg",
            },
          attributes: Array.isArray(item.attributes) ? item.attributes : [],
          productType,
          accountVariant,
          product: String(item.product || ""),
        };
      });

      const deliveryInfoValue = cart?.deliveryInfo ||
        cart?.shippingAddress?.deliveryInfo ||
        cart?.shippingAddress?.address ||
        `Email: ${session?.user?.email || ""}`;

      const payload = {
        products: normalizedProducts,
        paymentMethod: normalizePaymentSlug(selectedPayment.slug),
        total: totalAfterDiscount,
        user: session.user.id,
        totalBeforeDiscount: cart.cartTotal,
        couponApplied: coupon.trim() ? coupon.trim() : undefined,
        shippingStatus: "pending_handover",
        shippingTimes: t(language, "orderShippingMethod"),
        shippingPrice: 0,
        shippingAddress: {
          firstName: "",
          lastName: "",
          phoneNumber: "",
          state: "",
          city: "",
          zipCode: "",
          address: deliveryInfoValue,
          country: t(language, "orderDefaultCountry"),
          deliveryInfo: deliveryInfoValue,
        },
        deliveryInfo: deliveryInfoValue,
        idempotencyKey: idempotencyKeyRef.current,
      };

      setLoading(true);
      const response = await axios.post("/api/order", payload);
      const data = response.data;

      if (data?.success === false) {
        idempotencyKeyRef.current = null;
        toast.custom(
          <Toast message={data?.message || t(language, "orderCreateError")} status="error" />
        );
        return;
      }

      if (data.checkoutUrl) {
        idempotencyKeyRef.current = null;
        window.location.href = data.checkoutUrl;
        return;
      }

      idempotencyKeyRef.current = null;
      router.push(`order/${data.order_id}`);
      toast.custom(<Toast message={data.message} status="success" />);
    } catch (err) {
      idempotencyKeyRef.current = null;
      toast.custom(
        <Toast message={getClientErrorMessage(err, t(language, "orderCreateError"))} status="error" />
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3">
            <ClipLoader className="text-primary-600" size={32} />
            <p className="text-sm font-medium text-slate-600">{t(language, "checkoutProcessing")}</p>
          </div>
        </div>
      )}

      <div className="mt-4 sm:mt-6 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:items-start">
        {/* Left column - Payment */}
        <div className="flex-1 flex flex-col gap-4 sm:gap-5">
          {/* Payment Methods - Mobile Card Style */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-md shadow-primary-500/20">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{t(language, "paymentMethod")}</h2>
                <p className="text-xs text-slate-400">{t(language, "checkoutSelectPaymentMethod")}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {payments.map((item: Payment, idx: number) => {
                const Icon = paymentIcons[item.slug] || CreditCard;
                const isSelected = item.id == selectedPayment?.id;
                return (
                  <m.button
                    key={item.id}
                    onClick={() => setSelectedPayments(item)}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className={cn(
                      "relative rounded-xl border-2 p-3 sm:p-4 cursor-pointer transition-all duration-200 text-left",
                      isSelected
                        ? "border-primary-500 bg-gradient-to-br from-primary-50 to-indigo-50 shadow-md ring-2 ring-primary-500/15"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        isSelected ? "bg-primary-100" : "bg-slate-100"
                      )}>
                        <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", isSelected ? "text-primary-600" : "text-slate-500")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm sm:text-base">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                        isSelected ? "bg-primary-500 text-white scale-100" : "bg-slate-200 text-transparent scale-75"
                      )}>
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  </m.button>
                );
              })}
            </div>
          </m.div>

          {/* Order Items - Mobile Friendly List */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{t(language, "checkoutProductsOrdered")}</h2>
                <p className="text-xs text-slate-400">{cart?.products?.length || 0} {t(language, "checkoutProductsCount")}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {cart?.products?.map((item: any, idx: number) => (
                <m.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                    <Image
                      src={Array.isArray(item?.images) ? (item?.images[0] || "/assets/images/logo.svg") : (item?.images || "/assets/images/logo.svg")}
                      alt=""
                      className="w-full h-full object-cover"
                      width={56}
                      height={56}
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">
                      {item?.name}
                    </p>
                    {item?.option && (
                      <p className="text-xs text-slate-400 mt-0.5">{item.option}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">x{item?.qty || 1}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900">
                      <CurrencyFormat value={(item?.price || 0) * (item?.qty || 1)} />
                    </p>
                  </div>
                </m.div>
              ))}
            </div>
          </m.div>
        </div>

        {/* Right column - Summary Sidebar (Sticky on Desktop) */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="w-full lg:max-w-xs xl:max-w-sm flex-shrink-0 lg:sticky lg:top-4"
        >
          {/* Summary Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-4 sm:p-5">
              <div className="flex items-center gap-2.5 text-white">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-base sm:text-lg leading-tight">{t(language, "checkoutYourOrder")}</h3>
                  <p className="text-xs text-white/70 mt-0.5">
                    <Zap className="inline h-3 w-3 mr-0.5" />
                    {t(language, "checkoutInstantDelivery")}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              {/* Price lines */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t(language, "subtotal")}</span>
                  <span className="font-medium text-slate-700">
                    <CurrencyFormat value={cart?.cartTotal || 0} />
                  </span>
                </div>
                {coupon.trim() && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 font-medium">{t(language, "checkoutDiscount")}</span>
                    <span className="font-medium text-emerald-600">
                      <CurrencyFormat value={Math.max(0, (cart?.cartTotal || 0) - totalAfterDiscount)} />
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">{t(language, "totalPayable")}</span>
                  <m.span
                    key={totalAfterDiscount}
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    className="font-extrabold text-xl sm:text-2xl text-primary-600"
                  >
                    <CurrencyFormat value={totalAfterDiscount} />
                  </m.span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-slate-200" />

              {/* Trust badges - compact */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-50">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  <span className="text-[10px] font-medium text-emerald-700 text-center leading-tight">{t(language, "trustInstant")}</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-blue-50">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <span className="text-[10px] font-medium text-blue-700 text-center leading-tight">{t(language, "trustSecure")}</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-amber-50">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span className="text-[10px] font-medium text-amber-700 text-center leading-tight">{t(language, "trustSafe")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coupon Input */}
          <div className="mt-3 sm:mt-4 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
            <label className="text-xs sm:text-sm font-bold text-slate-700 mb-2 block">
              {t(language, "coupon")}
            </label>
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder={t(language, "couponPlaceholder")}
                className="flex-1 min-w-0 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 focus:outline-none bg-slate-50 transition-all"
              />
              <Button
                type="button"
                variant="outline"
                onClick={applyCoupon}
                className="rounded-xl font-bold px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
              >
                {t(language, "apply")}
              </Button>
            </div>
          </div>

          {/* Place Order Button */}
          <m.button
            onClick={placeOrderHandler}
            disabled={loading}
            whileTap={!loading ? { scale: 0.97 } : {}}
            className={cn(
              "mt-3 sm:mt-4 w-full flex items-center justify-center gap-2 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold transition-all duration-200 shadow-lg",
              "bg-gradient-to-r from-primary-600 to-indigo-600 text-white",
              "hover:shadow-xl hover:shadow-primary-500/20",
              "active:shadow-md active:scale-[0.98]",
              loading && "opacity-60 cursor-wait"
            )}
          >
            {loading ? (
              <m.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{t(language, "checkout")}</span>
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </>
            )}
          </m.button>

          {/* Trust note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-400 mt-2.5">
            <Lock className="h-3 w-3" />
            <span>{t(language, "checkoutTrustSSL")}</span>
          </div>
        </m.div>
      </div>
    </div>
  );
}
