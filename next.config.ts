import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function getBlobHostname() {
  const account = process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim();
  if (account) return `${account}.blob.core.windows.net`;

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? "";
  const match = connectionString.match(/AccountName=([^;]+)/i);
  return match?.[1] ? `${match[1]}.blob.core.windows.net` : null;
}

const blobHostname = getBlobHostname();

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Upload okładek przez Server Action (domyślny limit Next to 1 MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: blobHostname
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: blobHostname,
            pathname: "/**",
          },
        ],
      }
    : undefined,
};

export default nextConfig;
