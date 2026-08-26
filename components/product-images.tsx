"use client";

import { useState } from "react";
import ProductImage from "@/components/product-image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FALLBACK = "/images/no-image.png";

export default function ProductImages({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);
  const list = images.length > 0 ? images : [FALLBACK];
  const currentSrc = list[current] ?? FALLBACK;

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="relative aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900"
            aria-label={alt}
          >
            <ProductImage
              key={currentSrc}
              src={currentSrc}
              alt={alt}
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={current === 0}
              className="object-cover transition-opacity hover:opacity-90"
            />
          </button>
        </DialogTrigger>
        <DialogContent className="gap-0 border-0 p-2 sm:max-w-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{alt}</DialogTitle>
            <DialogDescription>{alt}</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
            <ProductImage
              key={`dialog-${currentSrc}`}
              src={currentSrc}
              alt={alt}
              sizes="(max-width: 640px) 90vw, 576px"
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      {list.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {list.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setCurrent(index)}
              className={`relative h-[112px] w-[75px] overflow-hidden rounded border bg-zinc-100 dark:bg-zinc-900 ${
                current === index
                  ? "border-orange-500"
                  : "border-zinc-200 hover:border-orange-600 dark:border-zinc-700"
              }`}
            >
              <ProductImage
                src={image}
                alt={`${alt} ${index + 1}`}
                sizes="75px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
