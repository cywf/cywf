/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/cywf',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
