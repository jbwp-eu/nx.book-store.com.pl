"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";
import {
  firstZodMessage,
  insertReviewSchema,
  type InsertReview,
} from "@/lib/validators";

export type ReviewView = {
  id: string;
  title: string;
  description: string;
  rating: number;
  createdAt: Date;
  user: { name: string } | null;
};

export async function createUpdateReview(data: InsertReview, lang: Locale) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false as const,
        message:
          lang === "en"
            ? "User is not authenticated"
            : "Użytkownik nie jest uwierzytelniony",
      };
    }

    const parsed = insertReviewSchema(lang).safeParse({
      ...data,
      userId: session.user.id,
    });
    if (!parsed.success) {
      return {
        success: false as const,
        message: firstZodMessage(parsed.error, lang),
      };
    }
    const review = parsed.data;

    const product = await prisma.product.findFirst({
      where: { id: review.productId },
    });
    if (!product) {
      return {
        success: false as const,
        message: lang === "en" ? "Product not found" : "Brak produktu",
      };
    }

    const reviewExists = await prisma.review.findFirst({
      where: {
        productId: review.productId,
        userId: review.userId,
      },
    });

    await prisma.$transaction(async (tx) => {
      if (reviewExists) {
        await tx.review.update({
          where: { id: reviewExists.id },
          data: {
            title: review.title,
            description: review.description,
            rating: review.rating,
          },
        });
      } else {
        await tx.review.create({ data: review });
      }

      const averageRating = await tx.review.aggregate({
        _avg: { rating: true },
        where: { productId: review.productId },
      });

      const numReviews = await tx.review.count({
        where: { productId: review.productId },
      });

      await tx.product.update({
        where: { id: review.productId },
        data: {
          rating: averageRating._avg.rating || 0,
          numReviews,
        },
      });
    });

    revalidatePath(`/${lang}/product/${product.slug}`);
    revalidatePath(`/${lang}`);
    revalidatePath(`/${lang}/search`);

    return {
      success: true as const,
      message:
        lang === "en"
          ? "Review updated successfully"
          : "Recenzja została pomyślnie zaktualizowana",
    };
  } catch (error) {
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : lang === "en"
            ? "Could not save review"
            : "Nie udało się zapisać recenzji",
    };
  }
}

export async function getReviews({
  productId,
}: {
  productId: string;
}): Promise<{ data: ReviewView[] }> {
  const data = await prisma.review.findMany({
    where: { productId },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data };
}

export async function getReviewByProductId({
  productId,
}: {
  productId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.review.findFirst({
    where: {
      productId,
      userId: session.user.id,
    },
  });
}
