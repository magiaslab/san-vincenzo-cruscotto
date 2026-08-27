import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // stemma locale in /public — nessun remote necessario
  },
  // Leaflet richiede accessori lato client
  transpilePackages: ["react-leaflet", "leaflet"],
  async redirects() {
    return [
      {
        source: "/supporter",
        destination: "/sostieni",
        permanent: false,
      },
      {
        source: "/infra",
        destination: "/mobilita",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
