/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Auto basePath/assetPrefix for GitHub Pages project sites
  basePath: process.env.GITHUB_PAGES === 'true'
    ? `/${(process.env.GITHUB_REPOSITORY || '').split('/')[1] || 'cywf'}`
    : '',
  assetPrefix: process.env.GITHUB_PAGES === 'true'
    ? `/${(process.env.GITHUB_REPOSITORY || '').split('/')[1] || 'cywf'}/`
    : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
