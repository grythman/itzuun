const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n.ts');
const devAssetPrefix =
  process.env.NODE_ENV !== "production" ? process.env.NEXT_DEV_ASSET_PREFIX || "" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // assetPrefix болон basePath-ийг бүрмөсөн устгасан!
  // Хэрэв /proxy/3000 дээр ажиллуулах шаардлагатай бол зөвхөн nginx/proxy дээр шийднэ.

  reactStrictMode: true,
  assetPrefix: devAssetPrefix || undefined,
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN || "http://127.0.0.1:8000";
    return [
      { source: "/api/v1/:path*", destination: `${backendOrigin}/api/v1/:path*` },
      { source: "/media/:path*", destination: `${backendOrigin}/media/:path*` },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
