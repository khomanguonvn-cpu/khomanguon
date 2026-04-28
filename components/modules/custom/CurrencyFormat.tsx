"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { NumericFormat } from "react-number-format";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";

export default function CurrencyFormat({
  className,
  value,
}: {
  className?: string;
  value: number;
}) {
  const { currency, vndToUsdRate } = useSelector((state: IRootState) => state.settings);

  const normalizedVnd = Number(value || 0);
  const usdValue = normalizedVnd / Number(vndToUsdRate || 25500);

  if (currency === "USD") {
    return (
      <NumericFormat
        className={cn(
          "inline-flex items-baseline whitespace-nowrap tracking-wider font-normal outline-none",
          className
        )}
        value={usdValue}
        displayType="text"
        thousandSeparator=","
        decimalSeparator="."
        decimalScale={2}
        prefix="$"
      />
    );
  }

  return (
    <NumericFormat
      className={cn(
        "inline-flex items-baseline whitespace-nowrap tracking-wider font-normal outline-none",
        className
      )}
      value={normalizedVnd}
      displayType="text"
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={0}
      suffix=" ₫"
    />
  );
}

