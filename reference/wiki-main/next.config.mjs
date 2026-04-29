/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  "devIndicators":false,
  async rewrites() {
    return [
      {
        source: "/:slug.md",
        destination: "/api/raw-markdown/:slug",
      },
    ];
  },
};

export default nextConfig;
