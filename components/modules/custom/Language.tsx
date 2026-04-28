import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";
import React from "react";

export default function Language({
  languages,
  handleLanguage,
}: {
  languages: string;
  handleLanguage: (value: string) => void;
}) {
  return (
    <Select onValueChange={handleLanguage}>
      <SelectTrigger className="border-0 bg-transparent text-white text-xs font-medium hover:text-white/80 focus:ring-0 focus:ring-offset-0 h-auto p-1 min-w-[40px]">
        <div className="flex items-center gap-1">
          <Languages className="h-3.5 w-3.5" />
          <SelectValue placeholder={languages}>
            <span className="text-xs font-medium">{languages}</span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="vi">Tiếng Việt</SelectItem>
          <SelectItem value="en">English</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
