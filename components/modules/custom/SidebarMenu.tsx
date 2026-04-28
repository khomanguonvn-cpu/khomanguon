import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { CiMenuBurger } from "react-icons/ci";
import Loading from "./Loading";
import { Category, SubCategory } from "@/types";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SidebarMenu() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  useEffect(() => {
    const getCategories = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/categories");
        setCategories(response.data.data || []);
      } catch {
        // Lỗi tải dữ liệu
      } finally {
        setLoading(false);
      }
    };

    getCategories();
  }, []);

  return (
    <Sheet>
      <SheetTrigger>
        <div className="lg:hidden">
          <span className="flex cursor-pointer lg:hidden">
            <CiMenuBurger className="h-8 w-8 font-thin text-base" />
          </span>
        </div>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Menu chính</SheetTitle>
          <SheetDescription>Chọn một danh mục</SheetDescription>
        </SheetHeader>

        <div className="mt-10">
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Link
              href="/tin-tuc"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700"
            >
              Tin tức
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700"
            >
              Liên hệ
            </Link>
          </div>

          <Tabs defaultValue="category" className="max-w-[400px]">
            <TabsList>
              <TabsTrigger value="category">Danh mục</TabsTrigger>
            </TabsList>

            <TabsContent value="category">
              <div>
                {loading && <Loading isLoading={loading} />}

                {categories.length > 0 &&
                  categories.map((item: Category, idx: number) => {
                    const hasSubmenu = Boolean(item?.submenu?.length);

                    return (
                      <div key={item._id || item.link || idx} className="py-1">
                        <button
                          type="button"
                          className="group inline-flex w-full items-center gap-4 rounded-lg px-3 py-2 capitalize text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
                          onClick={() => router.push(`/categories/${item.link}/products`)}
                        >
                          <span>{item.name}</span>
                          {hasSubmenu && <ChevronRight className="ms-auto h-4 w-4" />}
                        </button>

                        {hasSubmenu && (
                          <div className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-3">
                            {item.submenu?.map((item2: SubCategory, subIdx: number) => (
                              <Link
                                key={item2._id || item2.link || subIdx}
                                href={`/categories/${item2.link}/products`}
                                className="block rounded-md px-2 py-1.5 text-sm text-slate-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
                              >
                                {item2.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
