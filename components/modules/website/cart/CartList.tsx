"use client";
import React, { useEffect, useState } from "react";
import Container from "../../custom/Container";
import CartHeader from "./CartHeader";
import { CartItem as TCartItem } from "@/types";
import { useDispatch, useSelector } from "react-redux";
import { IRootState } from "@/store";
import Checkout from "./Checkout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Toast from "../../custom/Toast";
import axios from "axios";
import { createOrder } from "@/store/orderSlice";
import CartItem from "./CartItem";
import Loading from "../../custom/Loading";
import { t } from "@/lib/i18n";
import { getClientErrorMessage } from "@/lib/client-error";
import { m } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import CurrencyFormat from "../../custom/CurrencyFormat";
import { ShieldCheck } from "lucide-react";

export default function CartList() {
  const { cart, order } = useSelector((state: IRootState) => ({ ...state }));
  const { language } = useSelector((state: IRootState) => state.settings);

  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const subtotal = cart.cartItems.reduce(
    (accumulateur: number, currentValue: TCartItem) =>
      accumulateur + currentValue.price * currentValue.qty,
    0
  );
  const dispatch = useDispatch();
  const tax = 0;
  const shippingFee = 0;
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(subtotal + shippingFee + tax);
  }, [subtotal, shippingFee, tax]);

  const addToCartHandler = async () => {
    setLoading(true);
    if (order.orderDetails.length > 0) {
      toast.custom(
        <Toast message={t(language, "cartOrderExists")} status="success" />
      );

      router.push("/checkout");
      setLoading(false);
      return;
    } else {
      if (cart.cartItems.length === 0) {
        toast.custom(
          <Toast
            message={t(language, "cartEmptyGoToStore")}
            status="success"
            link="/products"
          />
        );
        setLoading(false);
        return;
      }

      if (status === "authenticated") {
        const cartTotal = cart.cartItems.reduce(
          (sum: number, item: TCartItem) => sum + item.price * item.qty,
          0
        );

        const data = {
          products: cart.cartItems,
          cart_total: cartTotal,
          user_id: session?.user?.id,
        };

        axios
          .post("/api/cart", data)
          .then((response) => {
            const payload = response.data;
            if (payload?.success === false) {
              toast.custom(
                <Toast message={payload?.message || t(language, "cartSaveError")} status="error" />
              );
              return;
            }

            dispatch(createOrder({ order: data.products }));
            toast.custom(
              <Toast message={t(language, "cartOrderSuccess")} status="success" />
            );
          })
          .catch((error) => {
            const errMsg = getClientErrorMessage(error, t(language, "cartSaveError"));
            toast.custom(<Toast message={errMsg} status="error" />);
          })
          .finally(() => {
            router.push("/checkout");
          });
      } else {
        router.push("/signin");
      }
    }
  };

  return (
    <section className="min-h-screen pb-32 sm:pb-8 xl:pb-8">
      <Container>
        {loading && <Loading isLoading={loading} />}
        <CartHeader active="cart" />
        <m.div
          className="flex flex-col gap-4 sm:gap-6 xl:grid xl:grid-cols-3 xl:gap-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Cart items — full width */}
          <div className="xl:order-1 xl:col-span-2">
            <div className="space-y-3 sm:space-y-4 max-h-[600px] overflow-auto pr-0.5 scrollbar-hide">
              <AnimatePresence>
                {cart.cartItems.map((item: TCartItem, idx: number) => (
                  <m.div
                    key={item._uid}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.3 }}
                  >
                    <CartItem item={item} />
                  </m.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Checkout Summary — sticky right column on xl+, hidden on smaller screens (replaced by sticky bar) */}
          <div className="hidden xl:block xl:order-2 xl:col-span-1">
            <div className="xl:sticky xl:top-6">
              <Checkout
                className="w-full"
                subtotal={subtotal}
                shippingFee={shippingFee}
                tax={tax}
                total={total}
                addToCartHandler={addToCartHandler}
                loading={loading}
              />
            </div>
          </div>
        </m.div>

        {/* Mobile / Tablet Sticky Checkout Bar — hidden on xl+ (replaced by sidebar panel) */}
        <div className="xl:hidden fixed bottom-16 sm:bottom-20 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-[51] shadow-[0_-4px_20px_rgba(0,0,0,0.12)]" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-slate-500 font-medium">{t(language, "checkoutTotal")}</span>
              <span className="text-lg font-extrabold text-slate-900 leading-tight">
                <CurrencyFormat value={total} />
              </span>
            </div>
            <button
              onClick={addToCartHandler}
              disabled={loading}
              className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-wait"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  {t(language, "checkoutPlaceOrder")}
                </>
              )}
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

