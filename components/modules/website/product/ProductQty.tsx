"use client";
import { cn } from "@/lib/utils";
import { Minus, Plus, ShoppingBag, Zap, Check, ShieldCheck } from "lucide-react";
import React, { useState } from "react";
import Toast from "../../custom/Toast";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { CartItem, Product } from "@/types";
import { IRootState } from "@/store";
import { addToCart, updateCart, emptyCart } from "@/store/cartSlice";
import { t } from "@/lib/i18n";
import { m, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createOrder } from "@/store/orderSlice";

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

  const selectedOption =
    product?.subProducts?.[active]?.options?.[optionActive];
  const stockLeft = selectedOption?.qty ?? 0;
  const isOutOfStock = stockLeft === 0;
  const isLowStock = stockLeft > 0 && stockLeft <= 3;

  const updateQty = (value: string) => {
    if (value === "dec") {
      if (qty === 1) {
        toast.custom(<Toast message={t(language, "productMinQty")} status="error" />);
        return;
      }
      setQty(qty - 1);
    }
    if (value === "inc") {
      if (qty >= stockLeft) {
        toast.custom(
          <Toast
            message={stockLeft === 0 ? t(language, "productOutOfStock") : t(language, "productStockLimit")}
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
    }
  };

  const addTocartHandler = async () => {
    if (isOutOfStock) {
      toast.custom(<Toast message={t(language, "productOutOfStock")} status="error" />);
      return;
    }

    setLoading(true);
    try {
      if (!selectedOption) {
        toast.custom(
          <Toast message={t(language, "variantNotFound")} status="error" />
        );
        setLoading(false);
        return;
      }

      if (qty > stockLeft) {
        toast.custom(
          <Toast message={t(language, "stockLimitQty")} status="error" />
        );
        setLoading(false);
        return;
      }

      const sellerProductId = Number(product?.sellerProductId || product?._id || 0);
      const selectedVariantId = String(selectedOption.variantId || "");

      if (!Number.isFinite(sellerProductId) || sellerProductId <= 0 || !selectedVariantId) {
        toast.custom(
          <Toast message={t(language, "variantInvalidContactAdmin")} status="error" />
        );
        setLoading(false);
        return;
      }

      const _uid = `${sellerProductId}_${selectedVariantId}`;
      const exist: CartItem | undefined = cart.cartItems.find(
        (p: CartItem) => p._uid === _uid
      );

      const productType = (product.productType as "physical" | "digital" | "ai_account" | "source_code" | "service") || "digital";
      
      let accountVariant = undefined;
      if (productType === "ai_account") {
        const attrs = selectedOption.attributes || [];
        const typeAttr = attrs.find((a: any) => a.key?.toLowerCase()?.includes("loại") || String(a.key).includes("Type") || String(a.key).includes("Tài khoản"));
        const durationAttr = attrs.find((a: any) => a.key?.toLowerCase()?.includes("thời hạn") || a.key?.toLowerCase()?.includes("ngày") || String(a.key).includes("Duration"));
        
        accountVariant = {
          type: typeAttr ? String(typeAttr.value) : "Tài khoản AI",
          durationDays: durationAttr ? Number(durationAttr.value) || 30 : 30,
          label: selectedOption.option || product.name,
        };
      }

      const payload = {
        product: String(sellerProductId),
        sellerProductId,
        selectedVariantId,
        name: product.name,
        description: product.description,
        optionBefore: optionActive,
        option: selectedOption.option,
        slug: product.slug,
        sku: product.subProducts?.[active]?.sku || `SP-${sellerProductId}`,
        shipping: "digital",
        images: selectedOption.images || [`/assets/images/placeholders/${product?.category?.slug || "placeholder"}.png`],
        style: product.subProducts?.[active]?.style,
        price: Number(selectedOption.price || 0),
        priceBefore: Number(selectedOption.price || 0),
        qty,
        stock: Number(selectedOption.qty || 0),
        brand: product.brand?.name || "KHOMANGUON",
        likes: [],
        _uid,
        productType,
        attributes: selectedOption.attributes || [],
        accountVariant,
      };

      if (exist) {
        const newCart = cart.cartItems.map((p: CartItem) =>
          p._uid === _uid ? { ...p, qty } : p
        );
        dispatch(updateCart(newCart));
        toast.custom(<Toast message={t(language, "cartUpdateSuccess")} status="success" />);
      } else {
        dispatch(addToCart(payload));
        toast.custom(
          <Toast message={t(language, "cartAddSuccess")} status="success" />
        );
      }

      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
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
      if (!selectedOption) {
        toast.custom(<Toast message={t(language, "variantNotFound")} status="error" />);
        setBuyingLoading(false);
        return;
      }

      if (qty > stockLeft) {
        toast.custom(<Toast message={t(language, "stockLimitQty")} status="error" />);
        setBuyingLoading(false);
        return;
      }

      const sellerProductId = Number(product?.sellerProductId || product?._id || 0);
      const selectedVariantId = String(selectedOption.variantId || "");

      if (!Number.isFinite(sellerProductId) || sellerProductId <= 0 || !selectedVariantId) {
        toast.custom(<Toast message={t(language, "variantInvalidContactAdmin")} status="error" />);
        setBuyingLoading(false);
        return;
      }

      const _uid = `${sellerProductId}_${selectedVariantId}`;

      const productType = (product.productType as "physical" | "digital" | "ai_account" | "source_code" | "service") || "digital";
      
      let accountVariant = undefined;
      if (productType === "ai_account") {
        const attrs = selectedOption.attributes || [];
        const typeAttr = attrs.find((a: any) => a.key?.toLowerCase()?.includes("loại") || String(a.key).includes("Type") || String(a.key).includes("Tài khoản"));
        const durationAttr = attrs.find((a: any) => a.key?.toLowerCase()?.includes("thời hạn") || a.key?.toLowerCase()?.includes("ngày") || String(a.key).includes("Duration"));
        
        accountVariant = {
          type: typeAttr ? String(typeAttr.value) : "Tài khoản AI",
          durationDays: durationAttr ? Number(durationAttr.value) || 30 : 30,
          label: selectedOption.option || product.name,
        };
      }

      const payload = {
        product: String(sellerProductId),
        sellerProductId,
        selectedVariantId,
        name: product.name,
        description: product.description,
        optionBefore: optionActive,
        option: selectedOption.option,
        slug: product.slug,
        sku: product.subProducts?.[active]?.sku || `SP-${sellerProductId}`,
        shipping: "digital",
        images: selectedOption.images || [`/assets/images/placeholders/${product?.category?.slug || "placeholder"}.png`],
        style: product.subProducts?.[active]?.style,
        price: Number(selectedOption.price || 0),
        priceBefore: Number(selectedOption.price || 0),
        qty,
        stock: Number(selectedOption.qty || 0),
        brand: product.brand?.name || "KHOMANGUON",
        likes: [],
        _uid,
        productType,
        attributes: selectedOption.attributes || [],
        accountVariant,
      };

      // Xóa giỏ hàng cũ và thêm sản phẩm mới (mua ngay = 1 sản phẩm)
      dispatch(emptyCart());
      dispatch(addToCart(payload));

      // Chuyển hướng đến checkout
      if (session?.user?.id) {
        const cartTotal = Number(selectedOption.price || 0) * qty;
        const data = {
          products: [{ ...payload }],
          cart_total: cartTotal,
          user_id: session.user.id,
        };

        axios
          .post("/api/cart", data)
          .then((response) => {
            const resData = response.data;
            if (resData?.success === false) {
              toast.custom(<Toast message={resData?.message || t(language, "orderCreateError")} status="error" />);
              return;
            }
            dispatch(createOrder({ order: [{ ...payload }] }));
            router.push("/checkout");
          })
          .catch((error: unknown) => {
            const errMsg = (error instanceof Error ? error.message : String(error)) || t(language, "orderCreateError");
            toast.custom(<Toast message={errMsg} status="error" />);
          });
      } else {
        router.push("/signin");
      }
    } catch {
      toast.custom(<Toast message={t(language, "generalError")} status="error" />);
    } finally {
      setBuyingLoading(false);
    }
  };

  return (
    <m.div
      className="flex flex-wrap lg:flex-nowrap gap-5 my-8 w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
    >
      {/* Quantity Controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-slate-700">{t(language, "productQtyLabel")}</span>
        <m.div
          className="flex items-center border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm"
          layout
        >
          <m.button
            onClick={() => updateQty("dec")}
            disabled={qty <= 1}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "h-12 w-12 flex items-center justify-center hover:bg-slate-100 transition-colors",
              qty <= 1 && "opacity-40 cursor-not-allowed"
            )}
          >
            <Minus className="h-4 w-4 text-slate-700" />
          </m.button>
          <m.span
            key={qty}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-16 text-center text-xl font-extrabold text-slate-900"
          >
            {qty}
          </m.span>
          <m.button
            onClick={() => updateQty("inc")}
            disabled={qty >= stockLeft || qty >= 9 || isOutOfStock}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "h-12 w-12 flex items-center justify-center hover:bg-slate-100 transition-colors",
              (qty >= stockLeft || qty >= 9 || isOutOfStock) && "opacity-40 cursor-not-allowed"
            )}
          >
            <Plus className="h-4 w-4 text-slate-700" />
          </m.button>
        </m.div>

        {/* Stock Info */}
        {!isOutOfStock && stockLeft <= 10 && (
          <m.span
            key={stockLeft}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "text-xs font-semibold",
              isLowStock ? "text-orange-500" : "text-slate-500"
            )}
          >
            ({stockLeft} {t(language, "productsAvailable")})
          </m.span>
        )}
      </div>

      {/* Nút mua hàng */}
      <div className="w-full lg:flex-1 flex flex-col sm:flex-row gap-3">
        {/* Nút Thêm vào giỏ */}
        <m.button
          onClick={addTocartHandler}
          disabled={isOutOfStock}
          whileHover={!isOutOfStock ? { scale: 1.01 } : {}}
          whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg border-2",
            isOutOfStock
              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none"
              : justAdded
              ? "bg-green-50 text-green-600 border-green-200 shadow-green-500/10"
              : "bg-white text-primary-700 border-primary-300 hover:border-primary-500 hover:bg-primary-50 hover:shadow-xl hover:shadow-primary-500/10"
          )}
        >
          <AnimatePresence mode="wait">
            {justAdded ? (
              <m.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>{t(language, "addedToCart")}</span>
              </m.div>
            ) : (
              <m.div
                key="cart"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>{t(language, "cartButtonLabel")}</span>
              </m.div>
            )}
          </AnimatePresence>
        </m.button>

        {/* Nút Mua ngay */}
        <m.button
          onClick={buyNowHandler}
          disabled={isOutOfStock || buyingLoading}
          whileHover={!isOutOfStock ? { scale: 1.01 } : {}}
          whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg",
            isOutOfStock || buyingLoading
              ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-primary-500/20"
          )}
        >
          {buyingLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t(language, "processingLabel")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>{t(language, "buyNowLabel")}</span>
            </div>
          )}
        </m.button>
      </div>
    </m.div>
  );
}

