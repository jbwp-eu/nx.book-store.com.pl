"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  deleteProductImage,
  uploadProductImage,
} from "@/lib/actions/upload.actions";
import type { Locale } from "@/lib/i18n";

const fieldClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";

export default function ImageUploadField({
  name,
  label,
  lang,
  defaultUrl = "",
  required = false,
  optionalHint,
}: {
  name: string;
  label: string;
  lang: Locale;
  defaultUrl?: string;
  required?: boolean;
  optionalHint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <label htmlFor={`${name}-file`} className="block text-sm">
        {label}
        {optionalHint ? (
          <span className="text-zinc-500"> ({optionalHint})</span>
        ) : null}
      </label>
      <input type="hidden" name={name} value={url} required={required} />
      <input
        ref={inputRef}
        id={`${name}-file`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={isPending}
        className={`${fieldClass} file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-sm dark:file:bg-zinc-800`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;

          const formData = new FormData();
          formData.append("file", file);
          const previousUrl = url;

          startTransition(async () => {
            setError(null);
            const result = await uploadProductImage(lang, formData);
            if (result.error || !result.url) {
              setError(result.error);
              return;
            }
            setUrl(result.url);
            if (previousUrl && previousUrl !== result.url) {
              void deleteProductImage(lang, previousUrl);
            }
          });
        }}
      />
      {isPending ? (
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {lang === "en" ? "Uploading..." : "Przesyłanie..."}
        </p>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {url ? (
        <div className="mt-3 flex items-start gap-3">
          <Image
            src={url}
            alt=""
            width={80}
            height={112}
            className="h-28 w-20 rounded object-cover"
            unoptimized
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              const currentUrl = url;
              startTransition(async () => {
                setError(null);
                await deleteProductImage(lang, currentUrl);
                setUrl("");
                if (inputRef.current) inputRef.current.value = "";
              });
            }}
            className="text-xs underline disabled:opacity-60"
          >
            {lang === "en" ? "Remove" : "Usuń"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
