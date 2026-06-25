/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      // Convex file storage delivery domain (adjust to your deployment if needed)
      { protocol: "https", hostname: "*.convex.cloud" }
    ]
  }
};

export default nextConfig;
