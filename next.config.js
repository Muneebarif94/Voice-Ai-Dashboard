/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['undici', 'firebase', '@firebase']
};

module.exports = nextConfig;
