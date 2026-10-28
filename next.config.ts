import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Tree-shake lucide-react: chỉ bundle icon thực sự dùng
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
