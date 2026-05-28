import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth',
        permanent: true, // Tells compilers and browsers to map it cleanly
      },
    ];
  },
};

export default nextConfig;
