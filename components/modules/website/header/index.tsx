"use client";
import React from "react";
import TopBar from "./TopBar";
import Main from "./Main";
import Navigation from "./Navigation";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 shadow-sm">
      {/* Top Bar - Contact info, language, auth */}
      <TopBar />
      {/* Main - Logo, search, icons */}
      <Main />
      {/* Navigation - Category dropdown + nav links */}
      <Navigation />
    </header>
  );
}
