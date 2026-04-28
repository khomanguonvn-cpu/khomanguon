import Link from "next/link";
import Image from "next/image";
import React from "react";

interface LogoProps {
  isDark?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ isDark = false, className = "", size = "md" }: LogoProps) {
  const sizeClass = {
    sm: "w-[132px] h-auto max-h-10 md:w-[160px] lg:w-[190px] lg:max-h-12",
    md: "w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20",
    lg: "w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32",
  }[size];

  return (
    <Link
      id="logo"
      href="/"
      className={`flex items-center justify-center w-max ${className}`}
    >
      <Image
        src="/assets/images/logo.svg"
        alt="KHOMANGUON.IO.VN"
        width={420}
        height={100}
        className={`${sizeClass} object-contain`}
        priority={size !== "lg"}
      />
    </Link>
  );
}
