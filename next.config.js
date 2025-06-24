// import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  env: {
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
    LIVEKIT_URL: process.env.LIVEKIT_URL,
  },
  images: {
    domains: [
      "thbiefglqtjxmrtrqmhq.supabase.co",
      "images.unsplash.com",
      "xcemffhlylyipmuxlujn.supabase.co"
    ],
  },
};

module.exports = nextConfig;
