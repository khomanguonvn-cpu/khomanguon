"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Detail, Product } from "@/types";
import { Card } from "@/components/ui/card";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Strips dangerous tags and event handler attributes.
 */
function sanitizeHtml(input: string): string {
  let html = String(input || "");
  // Remove dangerous tags entirely
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  html = html.replace(/<object[\s\S]*?<\/object>/gi, "");
  html = html.replace(/<embed[\s\S]*?>/gi, "");
  html = html.replace(/<form[\s\S]*?<\/form>/gi, "");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<link[\s\S]*?>/gi, "");
  html = html.replace(/<meta[\s\S]*?>/gi, "");
  html = html.replace(/<base[\s\S]*?>/gi, "");
  // Remove event handlers (onclick, onerror, onload, etc.)
  html = html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  html = html.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");
  // Remove javascript: protocol in href/src/action
  html = html.replace(/(?:href|src|action)\s*=\s*["']?\s*javascript\s*:/gi, 'data-blocked="');
  return html;
}

export default function ProductSpecifications({
  product,
}: {
  product: Product;
}) {
  const { language } = useSelector((state: IRootState) => state.settings);

  return (
    <section className="my-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <Tabs defaultValue="desc" className="w-full">
            <TabsList className="grid w-fit grid-cols-2 mb-6 rounded-xl bg-slate-100 p-1">
              <TabsTrigger
                value="desc"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary-600"
              >
                {t(language, "productDescriptionTab")}
              </TabsTrigger>
              <TabsTrigger
                value="spec"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary-600"
              >
                {t(language, "productSpecsTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="desc" className="focus:outline-none focus-visible:ring-0">
              <Card className="p-6 md:p-8 rounded-xl border border-slate-200 bg-white">
                <div
                  className="prose prose-slate max-w-none text-sm md:text-base leading-relaxed text-slate-600"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.content) }}
                />
              </Card>
            </TabsContent>

            <TabsContent value="spec" className="focus:outline-none focus-visible:ring-0">
              <Card className="p-6 md:p-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {product.details.map((item: Detail, idx: number) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 first:pt-0 last:pb-0 ${
                        idx % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                      } px-4 -mx-4 md:-mx-8`}
                    >
                      <span className="font-semibold text-sm text-slate-700">
                        {item.name}
                      </span>
                      <span className="text-sm text-slate-600 sm:col-span-2">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}