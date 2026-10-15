/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  webpack: (config, { isServer }) => {
    // The diagnostic PDF is drawn in the browser only. On the server Next externalises react-pdf and,
    // preloading the pages at start-up, loaded its Node build (which fails on missing pdfkit files).
    // An empty object stands in for it there (Next's externals run before aliases, hence this rule first).
    if (isServer) {
      config.externals = [
        ({ request }, callback) => (request === '@react-pdf/renderer' ? callback(null, 'var {}') : callback()),
        ...[].concat(config.externals || []),
      ];
    }
    return config;
  },
};

export default nextConfig;
