"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, User } from "lucide-react";
import {
  getReviews,
  type ReviewView,
} from "@/lib/actions/review.actions";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { formatDateTime } from "@/lib/utils";
import Rating from "@/components/rating";
import ReviewForm from "@/components/review-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReviewList({
  userId,
  productId,
  productSlug,
  lang,
  reviewsText,
  reviewFormText,
  initialReviews,
}: {
  userId?: string;
  productId: string;
  productSlug: string;
  lang: Locale;
  reviewsText: Dictionary["reviews_text"];
  reviewFormText: Dictionary["review_form_text"];
  initialReviews: ReviewView[];
}) {
  const [reviews, setReviews] = useState<ReviewView[]>(initialReviews);

  const reload = async () => {
    const res = await getReviews({ productId });
    setReviews(res.data);
  };

  return (
    <div className="space-y-4">
      {reviews.length === 0 ? <p>{reviewsText.no_reviews}</p> : null}

      {userId ? (
        <ReviewForm
          userId={userId}
          productId={productId}
          lang={lang}
          reviewFormText={reviewFormText}
          onReviewSubmitted={() => void reload()}
        />
      ) : (
        <p>
          {reviewsText.please}{" "}
          <Link
            className="px-1 text-blue-700 underline dark:text-blue-400"
            href={`/${lang}/sign-in?callbackUrl=/${lang}/product/${productSlug}`}
          >
            {reviewsText.sign_in}
          </Link>{" "}
          {reviewsText.to_write}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <CardTitle>{review.title}</CardTitle>
              <CardDescription>{review.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                <Rating value={review.rating} />
                <div className="flex items-center">
                  <User className="mr-1 h-3 w-3" />
                  {review.user?.name ?? reviewsText.user_fallback}
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {formatDateTime(review.createdAt).dateTime}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
