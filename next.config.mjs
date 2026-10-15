/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/courses", destination: "/schools", permanent: true },
      { source: "/courses/:slug", destination: "/programmes/:slug", permanent: true },
      { source: "/pricing", destination: "/scholarship", permanent: true },
      { source: "/help", destination: "/faq", permanent: true },
    ];
  },
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.skillsair.com",
      },
      {
        protocol: "https",
        hostname: "kiwi.skillsair.com",
      },
      {
        protocol: "https",
        hostname: "media.skillsair.com",
      },
      {
        protocol: "https",
        hostname: "skillsair.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "*.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
