"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Loading from "../../custom/Loading";
import { Category, SubCategory } from "@/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CategoryList({ className }: { className: string }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // get api
  useEffect(() => {
    const getCategories = async () => {
      setLoading(true);
      await axios
        .get("/api/categories")
        .then((response) => {
          setCategories(response.data.data);
        })
        .catch(() => {
          // Lỗi tải dữ liệu
        })
        .finally(() => {
          setLoading(false);
        });
    };
    getCategories();
  }, []);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback((key: string) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setActiveCategory(key);
  }, []);

  const handleMouseLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 150);
  }, []);

  return (
    <div id="categoryList" className={`flex flex-col gap-1 p-3 ${className}`}>
      {loading && <Loading isLoading={loading} />}

      {!loading &&
        categories &&
        categories.map((item: Category) => {
          const key = item._id || item.link;
          const hasSubmenu = Boolean(item.submenu && item.submenu.length > 0);
          const isActive = activeCategory === key;
          return (
            <div
              key={key}
              onMouseEnter={() => handleMouseEnter(key)}
              onMouseLeave={handleMouseLeave}
              className="relative w-full"
            >
              <button
                type="button"
                onClick={() => router.push(`/categories/${item.link}/products`)}
                className="inline-flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium capitalize text-slate-700 transition-all hover:bg-primary-50 hover:text-primary-700"
              >
                <span>{item.name}</span>
                {hasSubmenu && <ChevronRight className="ms-auto h-4 w-4" />}
              </button>

              {hasSubmenu && (
                <>
                  {/* Invisible bridge to prevent gap between parent and submenu */}
                  <div
                    className={`absolute left-full top-0 z-40 h-full w-3 ${
                      isActive ? "block" : "hidden"
                    }`}
                  />
                  <div
                    onMouseEnter={() => handleMouseEnter(key)}
                    onMouseLeave={handleMouseLeave}
                    className={`absolute left-[calc(100%+8px)] top-0 z-50 grid w-[430px] grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-150 ${
                      isActive
                        ? "visible translate-x-0 opacity-100"
                        : "invisible -translate-x-1 opacity-0 pointer-events-none"
                    }`}
                  >
                    {item.submenu?.map((item2: SubCategory) => (
                      <Link
                        href={`/categories/${item2.link}/products`}
                        key={item2._id || item2.link}
                        className="min-w-40 rounded-md px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
                      >
                        {item2.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
    </div>
  );
}
