import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false, // VUL-12: Disable X-Powered-By header
  experimental: {
    // Reduce JS de cliente de librerías con imports amplios.
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
