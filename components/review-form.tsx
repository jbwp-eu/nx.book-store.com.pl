"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createUpdateReview,
  getReviewByProductId,
} from "@/lib/actions/review.actions";
import { reviewFormDefaultValues } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { insertReviewSchema, type InsertReview } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ReviewForm({
  userId,
  productId,
  lang,
  reviewFormText,
  onReviewSubmitted,
}: {
  userId: string;
  productId: string;
  lang: Locale;
  reviewFormText: Dictionary["review_form_text"];
  onReviewSubmitted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const text = reviewFormText;

  const form = useForm<InsertReview>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(insertReviewSchema(lang)) as any,
    defaultValues: {
      ...reviewFormDefaultValues,
      productId,
      userId,
    },
  });

  const handleOpenForm = async () => {
    form.setValue("productId", productId);
    form.setValue("userId", userId);

    const review = await getReviewByProductId({ productId });
    if (review) {
      form.setValue("title", review.title);
      form.setValue("description", review.description);
      form.setValue("rating", review.rating);
    } else {
      form.reset({
        ...reviewFormDefaultValues,
        productId,
        userId,
      });
    }

    setOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await createUpdateReview({ ...values, productId }, lang);
    if (!res.success) {
      toast.error(res.message);
      return;
    }

    setOpen(false);
    onReviewSubmitted();
    toast.success(res.message);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => void handleOpenForm()}>
        {text.button_title}
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{text.button_title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="review-title">{text.title_label}</Label>
            <Input
              id="review-title"
              placeholder={text.enter_title}
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-description">{text.description_label}</Label>
            <Textarea
              id="review-description"
              placeholder={text.enter_description}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-rating">{text.rating_label}</Label>
            <select
              id="review-rating"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              {...form.register("rating", { valueAsNumber: true })}
            >
              <option value={0} disabled>
                {text.select_a_rating}
              </option>
              {Array.from({ length: 5 }).map((_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1} ★
                </option>
              ))}
            </select>
            {form.formState.errors.rating ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.rating.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? text.submitting : text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
