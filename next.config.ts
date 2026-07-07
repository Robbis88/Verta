import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Lås workspace-roten til denne mappa. Uten dette gjettet Next feil rot
  // fordi det finnes en package-lock.json i en overordnet mappe.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  experimental: {
    // Standardgrensen for Server Actions er 1 MB, som avviser vanlige
    // telefonbilder. Hev til 10 MB (uploadPropertyImage kapper selv på 8 MB).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
