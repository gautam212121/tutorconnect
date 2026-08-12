/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://51.21.255.194:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;