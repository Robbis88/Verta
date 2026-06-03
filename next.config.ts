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
};

export default nextConfig;
