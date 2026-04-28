import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-semibold",
    "rounded-xl",
    "ring-offset-white",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50",
    "active:scale-[0.97]",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-b from-slate-800 to-slate-900 text-white",
          "shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "hover:from-slate-700 hover:to-slate-800",
          "hover:shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]",
          "hover:-translate-y-[1px]",
        ].join(" "),
        primary: [
          "bg-gradient-to-b from-primary-500 to-primary-600 text-white",
          "shadow-[0_1px_3px_rgba(99,102,241,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:from-primary-400 hover:to-primary-500",
          "hover:shadow-[0_4px_14px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:-translate-y-[1px]",
        ].join(" "),
        destructive: [
          "bg-gradient-to-b from-red-500 to-red-600 text-white",
          "shadow-[0_1px_3px_rgba(239,68,68,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:from-red-400 hover:to-red-500",
          "hover:shadow-[0_4px_14px_rgba(239,68,68,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:-translate-y-[1px]",
        ].join(" "),
        outline: [
          "border border-slate-200 bg-white text-slate-700",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          "hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
          "hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]",
          "hover:-translate-y-[1px]",
        ].join(" "),
        secondary: [
          "bg-slate-100 text-slate-700",
          "hover:bg-slate-200 hover:text-slate-900",
          "hover:-translate-y-[1px]",
        ].join(" "),
        ghost: [
          "text-slate-600",
          "hover:bg-slate-100 hover:text-slate-900",
        ].join(" "),
        link: [
          "text-primary-600 underline-offset-4",
          "hover:underline hover:text-primary-700",
        ].join(" "),
        success: [
          "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white",
          "shadow-[0_1px_3px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:from-emerald-400 hover:to-emerald-500",
          "hover:shadow-[0_4px_14px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:-translate-y-[1px]",
        ].join(" "),
        accent: [
          "bg-gradient-to-b from-orange-500 to-orange-600 text-white",
          "shadow-[0_1px_3px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:from-orange-400 hover:to-orange-500",
          "hover:shadow-[0_4px_14px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:-translate-y-[1px]",
        ].join(" "),
        "glass": [
          "bg-white/80 backdrop-blur-md text-slate-800",
          "border border-white/40",
          "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
          "hover:bg-white/95 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
          "hover:-translate-y-[1px]",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-9 px-3.5 py-2 text-xs",
        lg: "h-12 px-7 py-3 text-base",
        xl: "h-14 px-10 py-4 text-base font-bold",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0 text-xs",
        "icon-lg": "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
