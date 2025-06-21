/** @type {import('next').NextConfig} */
// Temporarily disable PWA to debug loading issues
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   runtimeCaching: [
//     {
//       urlPattern: /^https:\/\/api\./,
//       handler: 'NetworkFirst',
//       options: {
//         cacheName: 'api-cache',
//         expiration: {
//           maxEntries: 100,
//           maxAgeSeconds: 60 * 60 * 24, // 24 hours
//         },
//       },
//     },
//   ],
// });

const nextConfig = {
  experimental: {
    appDir: true,
    serverActions: true,
  },
  images: {
    domains: ['supabase.co', 'lh3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

module.exports = nextConfig;