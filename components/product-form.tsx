"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import ImageUploadField from "@/components/image-upload-field";
import { createProduct, updateProduct } from "@/lib/actions/product.actions";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n";
import { PRODUCT_CATEGORIES, slugify } from "@/lib/product-form";

const fieldClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";

type ProductFormValues = {
  id?: string;
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

export default function ProductForm({
  lang,
  dictionary,
  mode,
  product,
  blobConfigured,
}: {
  lang: Locale;
  dictionary: Dictionary;
  mode: "create" | "update";
  product?: ProductFormValues | null;
  blobConfigured: boolean;
}) {
  const text = dictionary.create_update_product_text;
  const action =
    mode === "create"
      ? createProduct.bind(null, lang)
      : updateProduct.bind(null, lang, product?.id ?? "");

  const [state, formAction, pending] = useActionState(action, {
    error: null,
  });

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [category, setCategory] = useState(
    product?.category ?? PRODUCT_CATEGORIES[0],
  );
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [image1, setImage1] = useState(product?.images[0] ?? "");
  const [image2, setImage2] = useState(product?.images[1] ?? "");
  const [banner, setBanner] = useState(product?.banner ?? "");

  const submitLabel =
    mode === "create"
      ? `${text.create} ${text.product_text}`
      : `${text.update} ${text.product_text}`;

  const optionalHint = lang === "en" ? "optional" : "opcjonalnie";

  return (
    <form action={formAction} className="mx-auto mt-6 max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm">
            {text.name}
          </label>
          <input
            id="name"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={text.enter_product_name}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm">
            {text.slug}
          </label>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder={text.enter_slug}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => setSlug(slugify(name))}
            className="mt-2 rounded-md border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
          >
            {text.generate}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="text-sm">{text.category}</legend>
          <div className="mt-2 flex flex-wrap gap-4 rounded-md border border-zinc-300 p-3 dark:border-zinc-700">
            {PRODUCT_CATEGORIES.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="category"
                  value={value}
                  checked={category === value}
                  onChange={() => setCategory(value)}
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="brand" className="block text-sm">
            {text.brand}
          </label>
          <input
            id="brand"
            name="brand"
            required
            defaultValue={product?.brand ?? ""}
            placeholder={text.enter_brand}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="block text-sm">
            {text.price}
          </label>
          <input
            id="price"
            name="price"
            required
            inputMode="decimal"
            defaultValue={product?.price ?? ""}
            placeholder={text.enter_product_price}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="stock" className="block text-sm">
            {text.stock}
          </label>
          <input
            id="stock"
            name="stock"
            required
            type="number"
            min={0}
            defaultValue={product?.stock ?? 0}
            placeholder={text.enter_stock}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm font-medium">{text.images_text}</p>
        {blobConfigured ? (
          <>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {lang === "en"
                ? "Upload cover images to Azure Blob (max 4 MB, JPEG/PNG/WebP/GIF)."
                : "Prześlij okładki do Azure Blob (max 4 MB, JPEG/PNG/WebP/GIF)."}
            </p>
            <ImageUploadField
              name="image1"
              label="1"
              lang={lang}
              defaultUrl={product?.images[0] ?? ""}
              required
            />
            <ImageUploadField
              name="image2"
              label="2"
              lang={lang}
              defaultUrl={product?.images[1] ?? ""}
              optionalHint={optionalHint}
            />
          </>
        ) : (
          <>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {lang === "en"
                ? "Azure Blob not configured — paste image URLs for now."
                : "Azure Blob nie skonfigurowany — na razie wklej URL obrazów."}
            </p>
            <div>
              <label htmlFor="image1" className="block text-sm">
                1
              </label>
              <input
                id="image1"
                name="image1"
                required
                value={image1}
                onChange={(event) => setImage1(event.target.value)}
                placeholder="/images/sample-products/italia-1.jpg"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="image2" className="block text-sm">
                2
              </label>
              <input
                id="image2"
                name="image2"
                value={image2}
                onChange={(event) => setImage2(event.target.value)}
                placeholder={optionalHint}
                className={fieldClass}
              />
            </div>
            {(image1 || image2) && (
              <div className="flex flex-wrap gap-3 pt-2">
                {[image1, image2].filter(Boolean).map((src) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    width={80}
                    height={112}
                    className="h-28 w-20 rounded object-cover"
                    unoptimized
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm font-medium">{text.featured_product}</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
          />
          {text.is_Featured}
        </label>
        {isFeatured ? (
          blobConfigured ? (
            <ImageUploadField
              name="banner"
              label="Banner"
              lang={lang}
              defaultUrl={product?.banner ?? ""}
              optionalHint={optionalHint}
            />
          ) : (
            <div>
              <label htmlFor="banner" className="block text-sm">
                Banner URL
              </label>
              <input
                id="banner"
                name="banner"
                value={banner}
                onChange={(event) => setBanner(event.target.value)}
                placeholder="/images/sample-products/italia-3.jpg"
                className={fieldClass}
              />
              {banner ? (
                <Image
                  src={banner}
                  alt=""
                  width={640}
                  height={240}
                  className="mt-3 h-auto w-full max-w-md rounded object-cover"
                  unoptimized
                />
              ) : null}
            </div>
          )
        ) : null}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm">
          {text.description}
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          defaultValue={product?.description ?? ""}
          placeholder={text.enter_product_description}
          className={`${fieldClass} resize-none`}
        />
      </div>

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? text.submitting : submitLabel}
      </button>
    </form>
  );
}
