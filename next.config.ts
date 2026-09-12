import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Subdomain testing (*.localhost / *.lvh.me) needs no extra config,
     but allow them explicitly as dev origins. */
  allowedDevOrigins: ["*.localhost", "*.lvh.me", "*.nip.io", "*.sslip.io"],
};

export default nextConfig;
