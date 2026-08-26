import { BlobServiceClient } from "@azure/storage-blob";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 4 * 1024 * 1024;

export function isAzureBlobConfigured() {
  return Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING);
}

function getContainerName() {
  return process.env.AZURE_STORAGE_CONTAINER_NAME?.trim() || "products";
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || "image.jpg";
}

function getContainerClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) return null;

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  return blobServiceClient.getContainerClient(getContainerName());
}

export function isAzureBlobUrl(url: string) {
  if (!url.startsWith("http")) return false;

  const hostname = getAzureBlobHostname();
  if (!hostname) return false;

  try {
    return new URL(url).hostname === hostname;
  } catch {
    return false;
  }
}

export function getBlobNameFromUrl(url: string) {
  if (!isAzureBlobUrl(url)) return null;

  try {
    const pathname = new URL(url).pathname;
    const prefix = `/${getContainerName()}/`;
    if (!pathname.startsWith(prefix)) return null;

    return decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

export async function deleteBlobByUrl(url: string) {
  if (!isAzureBlobConfigured()) return false;

  const blobName = getBlobNameFromUrl(url);
  if (!blobName) return false;

  const containerClient = getContainerClient();
  if (!containerClient) return false;

  try {
    await containerClient.getBlockBlobClient(blobName).deleteIfExists();
    return true;
  } catch {
    return false;
  }
}

export async function deleteBlobsByUrls(urls: string[]) {
  const uniqueAzureUrls = [
    ...new Set(urls.filter((url) => url && isAzureBlobUrl(url))),
  ];
  await Promise.all(uniqueAzureUrls.map((url) => deleteBlobByUrl(url)));
}

export function getProductMediaUrls(product: {
  images: string[];
  banner: string | null;
}) {
  const urls = [...product.images];
  if (product.banner) urls.push(product.banner);

  return urls.filter((url) => isAzureBlobUrl(url));
}

export function getRemovedMediaUrls(
  previous: { images: string[]; banner: string | null },
  next: { images: string[]; banner: string | null },
) {
  const nextUrls = new Set(
    [...next.images, next.banner].filter(Boolean) as string[],
  );

  return getProductMediaUrls(previous).filter((url) => !nextUrls.has(url));
}

export async function uploadImageToBlob(file: File) {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported file type");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("File is too large (max 4 MB)");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const blobName = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

  const containerClient = getContainerClient();
  if (!containerClient) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
  }

  await containerClient.createIfNotExists({ access: "blob" });

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(bytes, {
    blobHTTPHeaders: { blobContentType: file.type },
  });

  return blockBlobClient.url;
}

export function getAzureBlobHostname() {
  const account = process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim();
  if (account) return `${account}.blob.core.windows.net`;

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? "";
  const match = connectionString.match(/AccountName=([^;]+)/i);
  return match ? `${match[1]}.blob.core.windows.net` : null;
}
