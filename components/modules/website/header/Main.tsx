"use client";
import React, { useState, useEffect } from "react";
import Container from "../../custom/Container";
import IconsGroup from "../../custom/IconsGroup";
import Logo from "../../custom/Logo";
import SearchMobile from "../../custom/SearchMobile";
import { cn } from "@/lib/utils";

export default function Main() {
  const [scrolled, setScrolled] = useState(false);
  const [openSearchMobile, setOpenSearchMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "w-full bg-white transition-all duration-300",
        scrolled ? "shadow-md" : "shadow-sm"
      )}
    >
      <Container className="h-16 lg:h-[72px]">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <Logo size="sm" />
          </div>

          {/* Search - hidden on mobile */}
          <div className="hidden lg:flex flex-1 max-w-xl">
            {/* SearchInput can be added here if needed */}
          </div>

          {/* Mobile Search */}
          <div className="flex lg:hidden shrink-0">
            <SearchMobile openSearchMobile={openSearchMobile} setOpenSearchMobile={setOpenSearchMobile} />
          </div>

          {/* Icons Group */}
          <div className="flex items-center gap-2 shrink-0">
            <IconsGroup />
          </div>
        </div>
      </Container>
    </div>
  );
}
