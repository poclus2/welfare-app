const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.thewelfare.store" },
      { protocol: "https", hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
