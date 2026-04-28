import React from "react";
import { Product } from "@/types";
import Link from "next/link";
import { BsFacebook, BsLinkedin, BsTwitterX, BsWhatsapp } from "react-icons/bs";
import { usePathname } from "next/navigation";
import { Share2 } from "lucide-react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function AdditionnalDescription({
  product,
}: {
  product: Product;
  active: number;
}) {
  const pathname = usePathname();
  const { language } = useSelector((state: IRootState) => state.settings);
  const shareUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || ""}${pathname}`;

  const shareItems = [
    { Icon: BsTwitterX, href: `https://x.com/intent/post?url=${encodeURIComponent(shareUrl)}`, label: "Twitter" },
    { Icon: BsLinkedin, href: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, label: "LinkedIn" },
    { Icon: BsFacebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, label: "Facebook" },
    { Icon: BsWhatsapp, href: `https://wa.me/?text=${encodeURIComponent(shareUrl)}`, label: "WhatsApp" },
  ];

  return (
    <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
      {/* Category Tag */}
      <div className="flex items-center gap-2 flex-wrap">
        {product.subCategories.slice(0, 3).map((item, idx) => (
          <Link
            key={idx}
            href={`/categories/${item.slug}/products`}
            className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Share */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t(language, "shareLabel")}</span>
        </div>
        <div className="flex items-center gap-1">
          {shareItems.map(({ Icon, href, label }, idx) => (
            <Link
              key={idx}
              target="_blank"
              rel="noopener noreferrer"
              href={href}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
