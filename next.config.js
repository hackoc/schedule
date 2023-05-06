/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    images: {
      allowFutureImage: true,
    },
  },
  rewrites: async () => [
    {
      source: '/',
      destination: '/schedule'
    }
  ]
};

module.exports = nextConfig;
