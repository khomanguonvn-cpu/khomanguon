"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrency, setLanguage, CurrencyCode, LanguageCode } from "@/store/settingsSlice";

export default function SettingsHydrator() {
  const dispatch = useDispatch();

  useEffect(() => {
    const savedLanguage = localStorage.getItem("kho_language") as LanguageCode | null;
    const savedCurrency = localStorage.getItem("kho_currency") as CurrencyCode | null;

    if (savedLanguage === "vi" || savedLanguage === "en") {
      dispatch(setLanguage(savedLanguage));
    }

    if (savedCurrency === "VND" || savedCurrency === "USD") {
      dispatch(setCurrency(savedCurrency));
    }
  }, [dispatch]);

  return null;
}
