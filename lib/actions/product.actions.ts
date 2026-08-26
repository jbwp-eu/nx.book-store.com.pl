"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  deleteBlobsByUrls,
  getProductMediaUrls,
  getRemovedMediaUrls,
} from "@/lib/azure-blob";
import prisma from "@/lib/prisma";
import { Prisma, type Product } from "@/lib/generated/prisma/client";
import type { Locale } from "@/lib/i18n";
import { parseProductForm, toProductDbData } from "@/lib/product-form";
import { firstZodMessage, productFormSchema } from "@/lib/validators";
import { PAGE_SIZE } from "@/lib/constants";

const LATEST_PRODUCTS_LIMIT = 4;

type FormState = { error: string | null };

function toProductView(p: Product) {
  return {
    ...p,
    price: p.price.toString(),
    rating: p.rating.toString(),
  };
}

async function requireAdminMutation(lang: Locale): Promise<FormState | null> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return {
      error: lang === "en" ? "Unauthorized" : "Brak uprawnień",
    };
  }
  return null;
}

function revalidateProductPaths(lang: Locale, slug?: string) {
  revalidatePath(`/${lang}/admin/products`);
  revalidatePath(`/${lang}`);
  revalidatePath(`/${lang}/search`);
  if (slug) revalidatePath(`/${lang}/product/${slug}`);
}

export async function getLatestProducts() {
  const products = await prisma.product.findMany({
    take: LATEST_PRODUCTS_LIMIT,
    orderBy: { createdAt: "desc" },
  });

  return products.map(toProductView);
}

export async function getProductSlugs(): Promise<
  { slug: string; createdAt: Date }[]
> {
  return prisma.product.findMany({
    select: { slug: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return products.map(toProductView);
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug },
  });
  if (!product) return null;
  return toProductView(product);
}

export async function getProductById(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId },
  });
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    brand: product.brand,
    description: product.description,
    stock: product.stock,
    images: product.images,
    isFeatured: product.isFeatured,
    banner: product.banner,
    price: product.price.toString(),
  };
}

export async function getAllCategories() {
  return prisma.product.groupBy({
    by: ["category"],
    _count: true,
  });
}

export async function getAllProducts({
  query,
  category,
  price,
  rating,
  stock,
  sort,
  page = 1,
  limit = PAGE_SIZE,
}: {
  query?: string;
  category?: string;
  price?: string;
  rating?: string;
  stock?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const queryFilter: Prisma.ProductWhereInput =
    query && query !== "all"
      ? {
          name: {
            contains: query,
            mode: "insensitive",
          },
        }
      : {};

  const categoryFilter: Prisma.ProductWhereInput =
    category && category !== "all" ? { category } : {};

  const priceFilter: Prisma.ProductWhereInput =
    price && price !== "all"
      ? {
          price: {
            gte: Number(price.split("-")[0]),
            lte: Number(price.split("-")[1]),
          },
        }
      : {};

  const ratingFilter: Prisma.ProductWhereInput =
    rating && rating !== "all"
      ? {
          rating: {
            gte: Number(rating),
          },
        }
      : {};

  const stockFilter: Prisma.ProductWhereInput =
    stock === "in-stock" ? { stock: { gt: 0 } } : {};

  const where: Prisma.ProductWhereInput = {
    ...queryFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
    ...stockFilter,
  };

  const [products, count] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy:
        sort === "lowest"
          ? { price: "asc" }
          : sort === "highest"
            ? { price: "desc" }
            : sort === "rating"
              ? { rating: "desc" }
              : { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products.map(toProductView),
    totalPages: Math.ceil(count / limit),
  };
}

export async function getAdminProducts(page = 1, limit = PAGE_SIZE) {
  const [products, count] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.product.count(),
  ]);

  return {
    data: products.map(toProductView),
    totalPages: Math.ceil(count / limit),
  };
}

export async function createProduct(
  lang: Locale,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const denied = await requireAdminMutation(lang);
  if (denied) return denied;

  const parsed = productFormSchema(lang).safeParse(parseProductForm(formData));
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error, lang) };
  }

  try {
    const data = toProductDbData(parsed.data);
    await prisma.product.create({ data });
    revalidateProductPaths(lang, data.slug);
    redirect(`/${lang}/admin/products`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error:
          lang === "en"
            ? "A product with this slug already exists"
            : "Produkt z tym slugiem już istnieje",
      };
    }
    return {
      error:
        lang === "en"
          ? "Could not create product"
          : "Nie udało się utworzyć produktu",
    };
  }
}

export async function updateProduct(
  lang: Locale,
  productId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const denied = await requireAdminMutation(lang);
  if (denied) return denied;

  const existing = await prisma.product.findFirst({ where: { id: productId } });
  if (!existing) {
    return {
      error:
        lang === "en" ? "Product not found" : "Produkt nie został znaleziony",
    };
  }

  const parsed = productFormSchema(lang).safeParse(parseProductForm(formData));
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error, lang) };
  }

  try {
    const data = toProductDbData(parsed.data);
    await prisma.product.update({
      where: { id: productId },
      data,
    });
    await deleteBlobsByUrls(
      getRemovedMediaUrls(
        { images: existing.images, banner: existing.banner },
        { images: data.images, banner: data.banner },
      ),
    );
    revalidateProductPaths(lang, data.slug);
    if (existing.slug !== data.slug) {
      revalidatePath(`/${lang}/product/${existing.slug}`);
    }
    redirect(`/${lang}/admin/products`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error:
          lang === "en"
            ? "A product with this slug already exists"
            : "Produkt z tym slugiem już istnieje",
      };
    }
    return {
      error:
        lang === "en"
          ? "Could not update product"
          : "Nie udało się zaktualizować produktu",
    };
  }
}

export async function deleteProduct(lang: Locale, productId: string) {
  const denied = await requireAdminMutation(lang);
  if (denied) return denied;

  const product = await prisma.product.findFirst({ where: { id: productId } });
  if (!product) {
    return {
      error:
        lang === "en" ? "Product not found" : "Produkt nie został znaleziony",
    };
  }

  try {
    await prisma.product.delete({ where: { id: productId } });
    await deleteBlobsByUrls(getProductMediaUrls(product));
    revalidateProductPaths(lang, product.slug);
    return {
      error: null,
      message:
        lang === "en"
          ? "Product deleted successfully"
          : "Produkt został usunięty",
    };
  } catch {
    return {
      error:
        lang === "en"
          ? "Could not delete product"
          : "Nie udało się usunąć produktu",
    };
  }
}
