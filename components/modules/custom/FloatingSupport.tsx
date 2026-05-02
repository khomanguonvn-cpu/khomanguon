"use client";

import React, { useEffect, useState } from "react";
import { Facebook, Send } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingSupport() {
  const [facebookUrl, setFacebookUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const res = await fetch("/api/site-config");
        const json = await res.json();
        if (json.success && json.data) {
          setFacebookUrl(json.data.facebookUrl || "");
          setTelegramUrl(json.data.telegramUrl || "");
        }
      } catch (err) {
        console.error("Failed to load site config for floating support");
      }
    })();
  }, []);

  if (!mounted || (!facebookUrl && !telegramUrl)) return null;

  return (
    <div className="fixed left-0 top-[60%] -translate-y-1/2 z-[60] flex flex-col gap-3 p-3">
      {facebookUrl && (
        <div 
          className="relative flex items-center"
          onMouseEnter={() => setIsHovered("fb")}
          onMouseLeave={() => setIsHovered(null)}
        >
          <Link
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 hover:scale-110 transition-transform z-10"
          >
            <Facebook className="w-6 h-6 fill-current" />
          </Link>
          <AnimatePresence>
            {isHovered === "fb" && (
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-[52px] bg-white px-3 py-1.5 rounded-lg shadow-xl border border-slate-100 whitespace-nowrap font-medium text-sm text-slate-700"
              >
                Hỗ trợ Facebook
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {telegramUrl && (
        <div 
          className="relative flex items-center"
          onMouseEnter={() => setIsHovered("tg")}
          onMouseLeave={() => setIsHovered(null)}
        >
          <Link
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-[#0088cc] rounded-full flex items-center justify-center text-white shadow-lg shadow-sky-500/30 hover:scale-110 transition-transform z-10"
          >
            <Send className="w-5 h-5 ml-[-2px] mt-[2px] fill-current" />
          </Link>
          <AnimatePresence>
            {isHovered === "tg" && (
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-[52px] bg-white px-3 py-1.5 rounded-lg shadow-xl border border-slate-100 whitespace-nowrap font-medium text-sm text-slate-700"
              >
                Hỗ trợ Telegram
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
