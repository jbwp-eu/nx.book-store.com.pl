"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type CarouselProduct = {
  id: string;
  slug: string;
  name: string;
  banner: string | null;
};

export default function ProductCarousel({
  data,
  lang,
}: {
  data: CarouselProduct[];
  lang: Locale;
}) {
  const [loaded, setLoaded] = useState<Set<number>>(new Set());

  const handleLoad = (index: number) => {
    setLoaded((prev) => new Set(prev).add(index));
  };

  return (
    <Carousel
      className="mx-auto mb-12 w-8/9 sm:w-19/20 md:w-full"
      opts={{ loop: true }}
      plugins={[
        Autoplay({
          delay: 7000,
          stopOnInteraction: true,
          stopOnMouseEnter: true,
        }),
      ]}
    >
      <CarouselContent>
        {data.map((product, index) => (
          <CarouselItem key={product.id}>
            <Link href={`/${lang}/product/${product.slug}`}>
              <div
                className={cn(
                  "relative mx-auto aspect-[1200/210] w-full overflow-hidden",
                  product.banner && !loaded.has(index) && "min-h-[80px]",
                )}
              >
                {product.banner ? (
                  <>
                    {!loaded.has(index) ? (
                      <Skeleton className="absolute inset-0 z-10 rounded-none" />
                    ) : null}
                    <Image
                      src={product.banner}
                      alt={product.name}
                      fill
                      fetchPriority={index === 0 ? "high" : "low"}
                      loading={index === 0 ? "eager" : "lazy"}
                      priority={index === 0}
                      sizes="100vw"
                      className={cn(
                        "object-cover object-center transition-opacity duration-300",
                        loaded.has(index) ? "opacity-100" : "opacity-0",
                      )}
                      onLoad={() => handleLoad(index)}
                    />
                  </>
                ) : (
                  <div className="bg-muted min-h-[80px] w-full" />
                )}
                <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
                  <h2 className="bg-gray-900 px-2 text-base font-bold text-white opacity-70 sm:text-xl md:text-2xl">
                    {product.name}
                  </h2>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-9" />
      <CarouselNext className="-right-9" />
    </Carousel>
  );
}
