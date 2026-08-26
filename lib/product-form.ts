export const PRODUCT_CATEGORIES = ["Polish", "Foreign"] as const;

export type ProductFormInput = {
  name: string;
  slug: string;
  category: string;
  brand: string;
  description: string;
  stock: number;
  price: string;
  images: string[];
  isFeatured: boolean;
  banner: string | null;
};

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function parseProductForm(formData: FormData): ProductFormInput {
  const image1 = String(formData.get("image1") ?? "").trim();
  const image2 = String(formData.get("image2") ?? "").trim();
  const bannerRaw = String(formData.get("banner") ?? "").trim();

  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    stock: Number.parseInt(String(formData.get("stock") ?? ""), 10),
    price: String(formData.get("price") ?? "").trim().replace(",", "."),
    images: [image1, image2].filter(Boolean),
    isFeatured: formData.get("isFeatured") === "on",
    banner: bannerRaw || null,
  };
}

function parsePrice(value: string): string | null {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return null;
  return num.toFixed(2);
}

export function toProductDbData(data: ProductFormInput) {
  const price = parsePrice(data.price);
  if (!price) throw new Error("Invalid price");

  return {
    name: data.name,
    slug: data.slug,
    category: data.category,
    brand: data.brand,
    description: data.description,
    stock: data.stock,
    price,
    images: data.images,
    isFeatured: data.isFeatured,
    banner: data.isFeatured ? data.banner : null,
  };
}
