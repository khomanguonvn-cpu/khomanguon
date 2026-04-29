"use client";
import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CiShoppingBasket } from "react-icons/ci";
import { ShoppingBasket, X } from "lucide-react";
import { User } from "lucide-react";
import CurrencyFormat from "./CurrencyFormat";
import { useSelector, useDispatch } from "react-redux";
import { IRootState } from "@/store";
import { CartItem } from "@/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IoCloseOutline } from "react-icons/io5";
import { updateCart } from "@/store/cartSlice";
import toast from "react-hot-toast";
import Toast from "./Toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createOrder } from "@/store/orderSlice";
import axios from "axios";
import Link from "next/link";
import QuantityCart from "./QuantityCart";
import Loading from "./Loading";
import { t } from "@/lib/i18n";
import { getClientErrorMessage } from "@/lib/client-error";
import Login from "../website/auth/Login";
import Register from "../website/auth/Register";

export default function IconsGroup() {
  const dispatch = useDispatch();
  const cart = useSelector((state: IRootState) => state.cart);
  const order = useSelector((state: IRootState) => state.order);
  const { language } = useSelector((state: IRootState) => state.settings);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { status, data: session } = useSession();

  // Listen for "open-auth-popup" event from TopBar
  useEffect(() => {
    const openAuthPopup = () => setAuthOpen(true);
    window.addEventListener("open-auth-popup", openAuthPopup);
    return () => window.removeEventListener("open-auth-popup", openAuthPopup);
  }, []);

  const handleRemoveItem = (item: CartItem) => {
    const newCart = cart.cartItems.filter((p: CartItem) => p._uid !== item._uid);
    dispatch(updateCart(newCart));
    toast.custom(
      <Toast
        message={t(language, "cartRemovedItem")}
        status="success"
      />
    );
  };

  const subtotal = cart.cartItems.reduce(
    (sum: number, item: CartItem) => sum + item.price * item.qty,
    0
  );

  const handleCheckout = async () => {
    if (cart.cartItems.length === 0) {
      toast.custom(
        <Toast message={t(language, "cartEmptyMsg")} status="error" link="/products" />
      );
      return;
    }

    if (status === "authenticated") {
      setLoading(true);
      try {
        const response = await axios.post(
          process.env.NEXT_PUBLIC_API_URL + "/api/cart",
          {
            products: cart.cartItems,
            cart_total: subtotal,
            user_id: session?.user?.id,
          }
        );
        if (response.data?.addCart) {
          dispatch(createOrder({ order: response.data.addCart }));
        }
        setCartOpen(false);
        router.push("/checkout");
      } catch (error) {
        const errMsg = getClientErrorMessage(error, t(language, "cartSaveError"));
        toast.custom(<Toast message={errMsg} status="error" />);
      } finally {
        setLoading(false);
      }
    } else {
      setCartOpen(false);
      setAuthOpen(true);
    }
  };

  return (
    <>
      {loading && <Loading isLoading={loading} />}

      {/* Auth Dialog */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl p-4 sm:max-w-lg sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl font-bold">
              {t(language, "authTitle")}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="signin" className="w-full min-w-0">
            <TabsList className="mb-3 grid w-full grid-cols-2 sm:mb-4">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-600">
                {t(language, "login")}
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-600">
                {t(language, "register")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-0">
              <Login mode="popup" onSuccess={() => setAuthOpen(false)} onNavigate={() => setAuthOpen(false)} />
            </TabsContent>
            <TabsContent value="register" className="mt-0">
              <Register mode="popup" onSuccess={() => setAuthOpen(false)} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        {/* Trigger - Cart icon button */}
        <SheetTrigger asChild>
          <button
            className="relative p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200"
            aria-label={t(language, "cart")}>
            <CiShoppingBasket className="h-7 w-7" />
            {cart.cartItems.length > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                {cart.cartItems.length > 99 ? "99+" : cart.cartItems.length}
              </span>
            )}
          </button>
        </SheetTrigger>

        <SheetContent className="p-0 flex flex-col" side="right">
          {/* Fixed Header */}
          <div className="sticky top-0 z-10 px-4 py-3 sm:py-4 bg-white border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShoppingBasket className="h-5 w-5 text-primary-600" />
              <SheetTitle className="text-base sm:text-lg font-bold text-slate-900 m-0">
                {t(language, "cartTitle")}
              </SheetTitle>
              {cart.cartItems.length > 0 && (
                <span className="text-xs text-slate-500">
                  ({cart.cartItems.length} {t(language, "cartItemsCount")})
                </span>
              )}
            </div>
            <SheetClose className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <X className="h-5 w-5" />
            </SheetClose>
          </div>

          {/* Cart Body */}
          <div className="flex-1 overflow-y-auto">
            {cart.cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-16 px-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                  <ShoppingBasket className="h-10 w-10 text-slate-300" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold text-slate-500">{t(language, "cartEmptyState")}</p>
                  <p className="text-sm text-slate-400">{t(language, "emptyCartExploreDesc")}</p>
                </div>
                <Button asChild className="bg-primary-600 hover:bg-primary-700 text-white h-12 px-8 rounded-xl font-bold">
                  <Link href="/products">
                    {t(language, "cartEmptyLink")}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {cart.cartItems.map((item: CartItem) => (
                  <div key={item._uid} className="flex gap-3 p-4 active:bg-slate-50 transition-colors">
                    {/* Product Image */}
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => setCartOpen(false)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={item.images?.[0] || "/assets/images/placeholders/placeholder.png"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setCartOpen(false)}
                          className="block text-sm font-semibold text-slate-800 hover:text-primary-600 line-clamp-2 transition-colors leading-snug"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm font-bold text-primary-600">
                          <CurrencyFormat value={item.price} />
                          {item.qty > 1 && (
                            <span className="text-[11px] text-slate-400 font-normal ml-1">
                              x{item.qty}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <QuantityCart item={item} />
                        <button
                          onClick={() => handleRemoveItem(item)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          aria-label={t(language, "cartRemoveBtn")}
                        >
                          <IoCloseOutline className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Footer - only show when cart has items */}
          {cart.cartItems.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-4 space-y-3 safe-bottom">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 font-medium">
                  {t(language, "subtotal")}
                </span>
                <span className="text-xl font-extrabold text-slate-900">
                  <CurrencyFormat value={subtotal} />
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 h-12 sm:h-11 rounded-xl font-bold border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  <Link
                    href="/cart"
                    onClick={() => setCartOpen(false)}
                  >
                    {t(language, "viewCart")}
                  </Link>
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="flex-1 h-12 sm:h-11 rounded-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white shadow-lg shadow-primary-500/20"
                >
                  {t(language, "checkout")}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
