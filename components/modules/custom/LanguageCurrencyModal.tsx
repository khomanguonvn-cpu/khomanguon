"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import React from "react";
import { CiGlobe } from "react-icons/ci";
import LanguageCurrency from "./LanguageCurrency";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function LanguageCurrencyModal({
  className,
}: {
  className?: string;
}) {
  const { language } = useSelector((state: IRootState) => state.settings);

  return (
    <Sheet>
      <SheetTrigger>
        <div className="lg:hidden">
          <span>
            <CiGlobe className={cn("h-8 w-8", className)} />
          </span>
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{t(language, "languageCurrencyTitle")}</SheetTitle>
          <SheetDescription>
            {t(language, "languageCurrencySelect")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-10">
          <LanguageCurrency className="px-8 flex justify-between items-center " />
        </div>
      </SheetContent>
    </Sheet>
  );
}

