import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Apex first: mrdoctor.com.bd. Local dev ONLY via *.localhost.
     Tunnel URLs (trycloudflare.com) allowed so Cloudflare Tunnel testing works. */
  allowedDevOrigins: [
    "mrdoctor.com.bd",
    "*.mrdoctor.com.bd",
    "*.localhost",
    "localhost",
    "*.lvh.me",
    "*.nip.io",
    "*.sslip.io",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
