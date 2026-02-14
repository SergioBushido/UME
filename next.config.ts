import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set Turbopack root to this project directory so Turbopack
  // doesn't pick a parent folder when multiple lockfiles exist on disk.
  // Use '.' to indicate the current workspace/project folder.
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
  turbopack: {
    root: '.',
  },
};

export default nextConfig;
