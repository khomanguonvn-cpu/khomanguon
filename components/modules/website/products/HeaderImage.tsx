import { Slide } from "@/types";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function HeaderImage({ slug }: { slug?: string }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);

  // get api
  useEffect(() => {
    const getSlides = async () => {
      setLoading(true);
      await axios
        .get(process.env.NEXT_PUBLIC_API_URL + "/api/slides")
        .then((response) => {
          const item = response.data.data.filter(
            (item: Slide) => item.slug === "banner-category"
          );
          setSlides(item);
        })
        .catch(() => {
          // Lỗi tải dữ liệu
        })
        .finally(() => {
          setLoading(false);
        });
    };
    getSlides();
  }, []);

  return (
    <>
      {!loading ? (
        <div>
          <div
            className="flex w-full rounded-lg bg-cover justify-center h-[200px] sm:h-[300px] lg:h-[350px] items-center"
            style={{
              backgroundImage: `url(${slides[0]?.image})`,
            }}
          >
            <h1
              className={cn(
                "text-lg sm:text-xl lg:text-4xl uppercase text-black backdrop font-extrabold tracking-wider px-4 text-center"
              )}
            >
              {slug}
            </h1>
          </div>
        </div>
      ) : (
        <Skeleton className={cn("h-[325] w-full rounded-xl")} />
      )}
    </>
  );
}
