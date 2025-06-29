/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 타임아웃 설정
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // 빌드 최적화
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdnticket.melon.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'cdnimg.melon.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'ticketimage.interpark.com',
      },
      {
        protocol: 'https',
        hostname: 'tkfile.yes24.com',
      },
    ],
    // 이미지 최적화 설정
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  // 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 