/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { appDir: true },
  output: 'export',          // enable static export
  images: { unoptimized: true } // Next/Image in static mode
};
module.exports = nextConfig;
