/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: [
      'cdnticket.melon.co.kr',
      'ticketimage.interpark.com',
      'tkfile.yes24.com',
    ],
  },
}

module.exports = nextConfig 