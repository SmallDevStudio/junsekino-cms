/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  images: {
    localPatterns: [
      {
        pathname: "/api/public/v1/companies/**/media/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
