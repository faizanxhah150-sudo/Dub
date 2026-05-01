/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow large video file uploads through Next.js API routes (not used here,
  // but good practice to have set)
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
};

module.exports = nextConfig;
