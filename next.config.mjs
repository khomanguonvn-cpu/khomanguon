/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://khomanguon.io.vn",
    AUTH_URL: process.env.AUTH_URL || "https://khomanguon.io.vn",
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || "https://khomanguon.io.vn",
    AUTH_SECRET: process.env.AUTH_SECRET || "814db8a19310de42cafc16ffa39526e5be5b384c99fa2f468a222f12ab8b6afe",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "814db8a19310de42cafc16ffa39526e5be5b384c99fa2f468a222f12ab8b6afe",
    AUTH_TRUST_HOST: "true"
  },

  serverExternalPackages: ["@libsql/isomorphic-ws"],

  outputFileTracingIncludes: {
    "/**": ["./node_modules/@libsql/isomorphic-ws/**/*"],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
