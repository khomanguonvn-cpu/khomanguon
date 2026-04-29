"use client";

import { cn } from "@/lib/utils";
import { IRootState } from "@/store";
import { addToCart, emptyCart, updateCart } from "@/store/cartSlice";
import { createOrder } from "@/store/orderSlice";
import { CartItem, Product } from "@/types";
import { AnimatePresence, m } from "framer-motion";
import { Check, Minus, Plus, ShieldCheck, ShoppingBag, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { t } from "@/lib/i18n";
import Toast from "../../custom/Toast";

type ProductType = "physical" | "digital" | "ai_account" | "source_code" | "service";

export default function ProductQty({
  setLoading,
  active,
  optionActive,
  product,
}: {
  setLoading(value: boolean): void;
  active: number;
  optionActive: number;
  product: Product;
}) {
  const dispatch = useDispatch();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [buyingLoading, setBuyingLoading] = useState(false);
  const { cart } = useSelector((state: IRootState) => ({ ...state }));
  const { language } = useSelector((state: IRootState) => state.settings);
  const { data: session } = useSession();
  const router = useRouter();

  const labels =
    language === "vi"
      ? {
          quantity: "Số lượng",
          available: "có sẵn",
          addToCart: "Thêm vào giỏ",
          added: "Đã thêm",
          buyNow: "Mua ngay",
          processing: "Đang xử lý",
          outOfStock: "Hết hàng",
          safePayment: "Thanh toán an toàn",
          fastHandover: "Bàn giao sau thanh toán",
          support: "Hỗ trợ khi cần",
          decrease: "Giảm số lượng",
          increase: "Tăng số lượng",
        }
      : {
          quantity: "Quantity",
          available: "available",
          addToCart: "Add to cart",
          added: "Added",
          buyNow: "Buy now",
          processing: "Processing",
          outOfStock: "Out of stock",
          safePayment: "Secure payment",
          fastHandover: "Handover after payment",
          support: "Support when needed",
          decrease: "Decrease quantity",
          increase: "Increase quantity",
        };

  const selectedOption = product?.subProducts?.[active]?.options?.[optionActive];
  const stockLeft = Math.max(0, Number(selectedOption?.qty || 0));
  const isOutOfStock = !selectedOption || stockLeft === 0;
  const isLowStock = stockLeft > 0 && stockLeft <= 3;

  useEffect(() => {
    if (stockLeft > 0 && qty > stockLeft) {
      setQty(stockLeft);
    }
  }, [qty, stockLeft]);

  const updateQty = (value: "dec" | "inc") => {
    if (value === "dec") {
      if (qty === 1) {
        toast.custom(<Toast message={t(language, "productMinQty")} status="error" />);
        return;
      }
      setQty(qty - 1);
      return;
    }

    if (qty >= stockLeft) {
      toast.custom(
        <Toast
          message={
            stockLeft === 0
              ? t(language, "productOutOfStock")
              : t(language, "productStockLimit")
          }
          status="error"
        />
      );
      return;
    }

    if (qty >= 9) {
      toast.custom(<Toast message={t(language, "productMaxPerOrder")} status="error" />);
      return;
    }

    setQty(qty + 1);
  };

  const validateSelection = () => {
    if (!selectedOption) {
      toast.custom(<Toast message={t(language, "variantNotFound")} status="error" />);
      return null;
    }

    if (qty > stockLeft) {
      toast.custom(<Toast message={t(language, "stockLimitQty")} status="error" />);
      return null;
    }

    const sellerProductId = Number(product?.sellerProductId || product?._id || 0);
    const selectedVariantId = String(selectedOption.variantId || "");

    if (!Number.isFinite(sellerProductId) || sellerProductId <= 0 || !selectedVariantId) {
      toast.custom(
        <Toast message={t(language, "variantInvalidContactAdmin")} status="error" />
      );
      return null;
    }

    return {
      sellerProductId,
      selectedVariantId,
      uid: `${sellerProductId}_${selectedVariantId}`,
    };
  };

  const buildAccountVariant = () => {
    const productType = (product.productType as ProductType) || "digital";
    if (productType !== "ai_account" || !selectedOption) return undefined;

    const attrs = selectedOption.attributes || [];
    const typeAttr = attrs.find((attr: any) => {
      const key = String(attr.key || "").toLowerCase();
      return key.includes("loại") || key.includes("type") || key.includes("tài khoản");
    });
    const durationAttr = attrs.find((attr: any) => {
      const key = String(attr.key || "").toLowerCase();
      return key.includes("thời hạn") || key.includes("ngày") || key.includes("duration");
    });

    return {
      type: typeAttr ? String(typeAttr.value) : "Tài khoản AI",
      durationDays: durationAttr ? Number(durationAttr.value) || 30 : 30,
      label: selectedOption.option || product.name,
    };
  };

  const buildCartPayload = (
    sellerProductId: number,
    selectedVariantId: string,
    uid: string
  ) => {
    const productType = (product.productType as ProductType) || "digital";

    return {
      product: String(sellerProductId),
      sellerProductId,
      selectedVariantId,
      name: product.name,
      description: product.description,
      optionBefore: optionActive,
      option: selectedOption?.option,
      slug: product.slug,
      sku: product.subProducts?.[active]?.sku || `SP-${sellerProductId}`,
      shipping: "digital",
      images:
        selectedOption?.images?.length
          ? selectedOption.images
          : [`/assets/images/placeholders/${product?.category?.slug || "placeholder"}.png`],
      style: product.subProducts?.[active]?.style,
      price: Number(selectedOption?.price || 0),
      priceBefore: Number(selectedOption?.price || 0),
      qty,
      stock: Number(selectedOption?.qty || 0),
      brand: product.brand?.name || "KHOMANGUON",
      likes: [],
      _uid: uid,
      productType,
      attributes: selectedOption?.attributes || [],
      accountVariant: buildAccountVariant(),
    };
  };

  const addTocartHandler = async () => {
    if (isOutOfStock) {
      toast.custom(<Toast message={t(language, "productOutOfStock")} status="error" />);
      return;
    }

    setLoading(true);
    try {
      const selection = validateSelection();
      if (!selection) return;

      const payload = buildCartPayload(
        selection.sellerProductId,
        selection.selectedVariantId,
        selection.uid
      );
      const exist: CartItem | undefined = (cart.cartItems || []).find(
        (item: CartItem) => item._uid === selection.uid
      );

      if (exist) {
        const newCart = (cart.cartItems || []).map((item: CartItem) =>
          item._uid === selection.uid ? { ...item, qty } : item
        );
        dispatch(updateCart(newCart));
        toast.custom(<Toast message={t(language, "cartUpdateSuccess")} status="success" />);
      } else {
        dispatch(addToCart(payload));
        toast.custom(<Toast message={t(language, "cartAddSuccess")} status="success" />);
      }

      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 2000);
    } catch {
      toast.custom(<Toast message={t(language, "cartSaveError")} status="error" />);
    } finally {
      setLoading(false);
    }
  };

  const buyNowHandler = async () => {
    if (isOutOfStock) {
      toast.custom(<Toast message={t(language, "productOutOfStock")} status="error" />);
      return;
    }

    setBuyingLoading(true);
    try {
      const selection = validateSelection();
      if (!selection) return;

      const payload = buildCartPayload(
        selection.sellerProductId,
        selection.selectedVariantId,
        selection.uid
      );

      // Xóa giỏ hàng cũ và thêm sản phẩm mới cho luồng mua ngay.
      dispatch(emptyCart());
      dispatch(addToCart(payload));

      if (!session?.user?.id) {
        router.push("/signin");
        return;
      }

      const cartTotal = Number(selectedOption?.price || 0) * qty;
      const response = await axios.post("/api/cart", {
        products: [{ ...payload }],
        cart_total: cartTotal,
        user_id: session.user.id,
      });

      const resData = response.data;
      if (resData?.success === false) {
        toast.custom(
          <Toast message={resData?.message || t(language, "orderCreateError")} status="error" />
        );
        return;
      }

      dispatch(createOrder({ order: [{ ...payload }] }));
      router.push("/checkout");
    } catch {
      toast.custom(<Toast message={t(language, "generalError")} status="error" />);
    } finally {
      setBuyingLoading(false);
    }
  };

  return (
    <m.div
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-black text-slate-900">{labels.quantity}</span>
          <m.div
            className="flex h-12 items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            layout
          >
            <m.button
              type="button"
              onClick={() => updateQty("dec")}
              disabled={qty <= 1}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "flex h-12 w-12 items-center justify-center text-slate-700 transition-colors hover:bg-white",
                qty <= 1 && "cursor-not-allowed opacity-40"
              )}
              aria-label={labels.decrease}
            >
              <Minus className="h-4 w-4" />
            </m.button>
            <m.span
              key={qty}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-14 text-center text-lg font-black text-slate-950"
            >
              {qty}
            </m.span>
            <m.button
              type="button"
              onClick={() => updateQty("inc")}
              disabled={qty >= stockLeft || qty >= 9 || isOutOfStock}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "flex h-12 w-12 items-center justify-center text-slate-700 transition-colors hover:bg-white",
                (qty >= stockLeft || qty >= 9 || isOutOfStock) &&
                  "cursor-not-allowed opacity-40"
              )}
              aria-label={labels.increase}
            >
              <Plus className="h-4 w-4" />
            </m.button>
          </m.div>

          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
              isOutOfStock
                ? "bg-red-50 text-red-700"
                : isLowStock
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isOutOfStock
                  ? "bg-red-500"
                  : isLowStock
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              )}
            />
            {isOutOfStock ? labels.outOfStock : `${stockLeft} ${labels.available}`}
          </span>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:min-w-[420px]">
          <m.button
            type="button"
            onClick={addTocartHandler}
            disabled={isOutOfStock}
            whileHover={!isOutOfStock ? { y: -1 } : {}}
            whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
            className={cn(
              "flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-black transition-all duration-200",
              isOutOfStock
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : justAdded
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-primary-200 bg-white text-primary-700 hover:border-primary-400 hover:bg-primary-50"
            )}
          >
            <AnimatePresence mode="wait">
              {justAdded ? (
                <m.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {labels.added}
                </m.span>
              ) : (
                <m.span
                  key="cart"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {labels.addToCart}
                </m.span>
              )}
            </AnimatePresence>
          </m.button>

          <m.button
            type="button"
            onClick={buyNowHandler}
            disabled={isOutOfStock || buyingLoading}
            whileHover={!isOutOfStock ? { y: -1 } : {}}
            whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
            className={cn(
              "flex h-12 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black text-white shadow-sm transition-all duration-200",
              isOutOfStock || buyingLoading
                ? "cursor-not-allowed bg-slate-300 shadow-none"
                : "bg-slate-950 hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-600/20"
            )}
          >
            {buyingLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {labels.processing}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                {labels.buyNow}
              </span>
            )}
          </m.button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500 sm:grid-cols-3">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          {labels.safePayment}
        </span>
        <span className="inline-flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          {labels.fastHandover}
        </span>
        <span className="inline-flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-primary-600" />
          {labels.support}
        </span>
      </div>
    </m.div>
  );
}
