import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/account/",
        "/checkout",
        "/order/",
        "/cart",
      ],
    },
    sitemap: "https://khomanguon.io.vn/sitemap.xml",
  };
}
