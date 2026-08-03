/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isProd ? '/Amar_Aroth-' : '',
  assetPrefix: isProd ? '/Amar_Aroth-/' : '',
};

export default nextConfig;
