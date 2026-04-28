"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { VIETNAM_BANKS, normalizeBankName } from "@/constants/vietnamBanks";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

type BankSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export default function BankSelect({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: BankSelectProps) {
  const { language } = useSelector((state: IRootState) => state.settings);
  const resolvedPlaceholder = placeholder ?? t(language, "selectBankPlaceholder");
  const selectedBank = useMemo(() => {
    const normalized = normalizeBankName(value);
    return VIETNAM_BANKS.find((bank) => bank.shortName === normalized) || null;
  }, [value]);

  const label = selectedBank?.shortName || value?.trim() || resolvedPlaceholder;

  return (
    <Select
      value={selectedBank?.code}
      onValueChange={(code) => {
        const nextBank = VIETNAM_BANKS.find((bank) => bank.code === code);
        if (nextBank) onChange(nextBank.shortName);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "h-12 rounded-xl border-slate-300 bg-white px-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0",
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {selectedBank ? (
            <Image
              src={selectedBank.logo}
              alt={selectedBank.shortName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-sm object-contain"
            />
          ) : (
            <Landmark className="h-5 w-5 text-slate-400" />
          )}
          <span
            className={cn(
              "truncate text-sm",
              selectedBank || value?.trim() ? "text-slate-900" : "text-slate-400"
            )}
          >
            {label}
          </span>
        </div>
      </SelectTrigger>

      <SelectContent className="max-h-80">
        {VIETNAM_BANKS.map((bank) => (
          <SelectItem key={bank.code} value={bank.code} className="py-2">
            <div className="flex items-center gap-3">
              <Image
                src={bank.logo}
                alt={bank.shortName}
                width={28}
                height={28}
                className="h-7 w-7 rounded-sm object-contain"
              />
              <span>{bank.shortName}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
