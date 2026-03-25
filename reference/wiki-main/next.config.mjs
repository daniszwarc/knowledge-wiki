/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
