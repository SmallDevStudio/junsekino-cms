/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  images: {
    localPatterns: [
      {
        pathname: "/api/public/v1/companies/**/media/**",
      },
    ],
  },
};

export default nextConfig;
