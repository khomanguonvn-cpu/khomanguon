"use client";
import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../custom/Loading";
import Container from "../../custom/Container";
import OrderProducts from "./OrderProducts";
import OrderSummary from "./OrderSummary";
import OrderHeader from "./OrderHeader";
import ShippingBillingAddress from "./ShippingBillingAddress";
import { Order } from "@/types";
import axios from "axios";
import toast from "react-hot-toast";
import Toast from "../../custom/Toast";
import { getClientErrorMessage } from "@/lib/client-error";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function OrderWrapper({
  id,
  paymentStatus,
}: {
  id: string;
  paymentStatus?: string;
}) {
  const [loading, setLoading] = useState(false);
  const { language } = useSelector((state: IRootState) => state.settings);

  const [order, setOrder] = useState<Order>();

  const normalizedPaymentStatus = useMemo(
    () => String(paymentStatus || "").toLowerCase(),
    [paymentStatus]
  );

  useEffect(() => {
    if (normalizedPaymentStatus === "paid" || normalizedPaymentStatus === "success") {
      toast.custom(
        <Toast message={t(language, "orderPaymentSuccess")} status="success" />
      );
    }

    if (
      normalizedPaymentStatus === "cancel" ||
      normalizedPaymentStatus === "cancelled" ||
      normalizedPaymentStatus === "failed"
    ) {
      toast.custom(
        <Toast message={t(language, "orderPaymentNotComplete")} status="error" />
      );
    }
  }, [normalizedPaymentStatus]);

  useEffect(() => {
    const getOrder = async () => {
      setLoading(true);
      await axios
        .get("/api/order", {
          params: { id: id },
        })
        .then((response) => {
          const data = response.data;

          if (data?.success === false) {
            toast.custom(
              <Toast
                message={data?.message || t(language, "orderLoadError")}
                status="error"
              />
            );
            return;
          }

          setOrder(data.data);
        })
        .catch((err) => {
          toast.custom(
            <Toast
              message={getClientErrorMessage(err, t(language, "orderLoadError"))}
              status="error"
            />
          );
        })
        .finally(() => {
          setLoading(false);
        });
    };
    getOrder();
  }, [id, language]);

  return (
    <section className="min-h-screen pb-20 sm:pb-8">
      {loading && <Loading isLoading={loading} />}

      <Container>
        <div>
          <div className="text-center sm:text-left">
            <h2 className="font-bold text-xl sm:text-2xl leading-tight text-black">
              {t(language, "orderDetailTitle")}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {t(language, "orderDetailDesc")}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:gap-6 mt-6 sm:mt-8">
            <OrderHeader order={order} />
            <OrderProducts order={order} />
            <OrderSummary order={order} />
            <ShippingBillingAddress order={order!} />
          </div>
        </div>
      </Container>
    </section>
  );
}
