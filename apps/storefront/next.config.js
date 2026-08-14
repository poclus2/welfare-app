/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverActions: {
    bodySizeLimit: '15mb',
  },
};

export default nextConfig;
