import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@ngrok/ngrok",
    "express",
    "retell-sdk",
    "nodemailer",
    "single-file-cli",
  ],
};

export default nextConfig;
