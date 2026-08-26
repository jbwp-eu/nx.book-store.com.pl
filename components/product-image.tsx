import Image from "next/image";

const FALLBACK = "/images/no-image.png";

export default function ProductImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src || FALLBACK}
      alt={alt}
      fill
      sizes={sizes}
      className={className ?? "object-cover"}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
