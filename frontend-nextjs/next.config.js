/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Optimize package imports
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Allow images from DiceBear API
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig

