import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',  // Adjust this value based on your needs
      allowedOrigins: ["*"]   // Be more restrictive in production
    }
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { bufferutil: 'bufferutil', 'utf-8-validate': 'utf-8-validate' }];
    return config;
  },
};

export default nextConfig;