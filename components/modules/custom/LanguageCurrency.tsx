"use client";
import { cn } from "@/lib/utils";
import React from "react";
import Currency from "./Currency";
import Language from "./Language";
import { useDispatch, useSelector } from "react-redux";
import { IRootState } from "@/store";
import { setCurrency, setLanguage, CurrencyCode, LanguageCode } from "@/store/settingsSlice";

export default function LanguageCurrency({
  className,
}: {
  className?: string;
}) {
  const dispatch = useDispatch();
  const { language, currency } = useSelector((state: IRootState) => state.settings);

  const languageLabel = language === "vi" ? "VI" : "EN";
  const currencyLabel = currency === "VND" ? "₫ VND" : "$ USD";

  const handleCurrency = (value: string) => {
    const selected = value as CurrencyCode;
    dispatch(setCurrency(selected));
    localStorage.setItem("kho_currency", selected);
  };

  const handleLanguage = (value: string) => {
    const selected = value as LanguageCode;
    dispatch(setLanguage(selected));
    localStorage.setItem("kho_language", selected);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Language languages={languageLabel} handleLanguage={handleLanguage} />
      <span className="text-white/40 text-xs">|</span>
      <Currency currency={currencyLabel} handleCurrency={handleCurrency} />
    </div>
  );
}
