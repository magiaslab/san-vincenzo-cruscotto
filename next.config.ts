import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // stemma locale in /public — nessun remote necessario
  },
  // Leaflet richiede accessori lato client
  transpilePackages: ["react-leaflet", "leaflet"],
};

export default nextConfig;
