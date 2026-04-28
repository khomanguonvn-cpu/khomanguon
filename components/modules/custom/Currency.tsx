import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CiMoneyBill } from "react-icons/ci";

export default function Currency({
  currency,
  handleCurrency,
}: {
  currency: string;
  handleCurrency: (value: string) => void;
}) {
  return (
    <Select onValueChange={handleCurrency}>
      <SelectTrigger className="border-0 bg-transparent text-white text-xs font-medium hover:text-white/80 focus:ring-0 focus:ring-offset-0 h-auto p-1 min-w-[60px]">
        <div className="flex items-center gap-1">
          <CiMoneyBill className="h-3.5 w-3.5" />
          <SelectValue placeholder={currency}>
            <span className="text-xs font-medium">{currency}</span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="VND">₫ VND</SelectItem>
          <SelectItem value="USD">$ USD</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
