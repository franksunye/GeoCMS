/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Optimize package imports
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig

