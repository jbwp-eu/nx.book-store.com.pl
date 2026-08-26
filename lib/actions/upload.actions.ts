"use server";

import { auth } from "@/lib/auth";
import { deleteBlobByUrl, uploadImageToBlob } from "@/lib/azure-blob";
import type { Locale } from "@/lib/i18n";

type UploadResult = { url: string | null; error: string | null };

function message(lang: Locale, en: string, pl: string) {
  return lang === "en" ? en : pl;
}

export async function uploadProductImage(
  lang: Locale,
  formData: FormData,
): Promise<UploadResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return {
      url: null,
      error: message(lang, "Unauthorized", "Brak uprawnień"),
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return {
      url: null,
      error: message(lang, "Choose an image file", "Wybierz plik obrazu"),
    };
  }

  try {
    const url = await uploadImageToBlob(file);
    return { url, error: null };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Upload failed";
    return {
      url: null,
      error:
        detail === "Unsupported file type"
          ? message(
              lang,
              "Use JPEG, PNG, WebP or GIF",
              "Użyj JPEG, PNG, WebP lub GIF",
            )
          : detail === "File is too large (max 4 MB)"
            ? message(
                lang,
                "File is too large (max 4 MB)",
                "Plik jest za duży (max 4 MB)",
              )
            : detail === "AZURE_STORAGE_CONNECTION_STRING is not set"
              ? message(
                  lang,
                  "Azure Blob is not configured in .env",
                  "Azure Blob nie jest skonfigurowany w .env",
                )
              : message(
                  lang,
                  "Could not upload image",
                  "Nie udało się przesłać obrazu",
                ),
    };
  }
}

export async function deleteProductImage(
  lang: Locale,
  url: string,
): Promise<{ error: string | null }> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return {
      error: message(lang, "Unauthorized", "Brak uprawnień"),
    };
  }

  if (!url) return { error: null };

  await deleteBlobByUrl(url);
  return { error: null };
}
