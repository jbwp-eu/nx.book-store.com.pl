import { z } from "zod";
import type { Locale } from "@/lib/i18n";
import { PRODUCT_CATEGORIES } from "@/lib/product-form";
import { PAYMENT_METHODS } from "@/lib/shipping";
import { USER_ROLES } from "@/lib/user-roles";

const msg = {
  en: {
    invalidData: "Invalid data",
    nameMin: "Name must be at least 3 characters",
    email: "Invalid email address",
    passwordMin: "Password must be at least 6 characters",
    passwordsMatch: "Passwords do not match",
    role: "Select a valid role",
    address: "Please fill in all address fields",
    paymentMethod: "Select a payment method",
    messageMin: "Message must be at least 3 characters",
    messageMax: "Message must be at most 200 characters",
    titleMin: "Title must be at least 3 characters",
    descriptionMin: "Description must be at least 3 characters",
    productRequired: "Product is required",
    userRequired: "User is required",
    rating: "Select a rating from 1 to 5",
    productNameMin: "Name must be at least 3 characters",
    slugMin: "Slug must be at least 3 characters",
    category: "Select a category",
    brandMin: "Brand must be at least 3 characters",
    productDescriptionMin: "Description must be at least 3 characters",
    stock: "Enter a valid stock",
    price: "Enter a valid price",
    images: "Add at least one product image",
  },
  pl: {
    invalidData: "Nieprawidłowe dane",
    nameMin: "Imię musi mieć min. 3 znaki",
    email: "Nieprawidłowy adres e-mail",
    passwordMin: "Hasło musi mieć min. 6 znaków",
    passwordsMatch: "Hasła nie są zgodne",
    role: "Wybierz poprawną rolę",
    address: "Uzupełnij wszystkie pola adresu",
    paymentMethod: "Wybierz metodę płatności",
    messageMin: "Wiadomość musi mieć min. 3 znaki",
    messageMax: "Wiadomość może mieć max. 200 znaków",
    titleMin: "Tytuł musi mieć min. 3 znaki",
    descriptionMin: "Opis musi mieć min. 3 znaki",
    productRequired: "Produkt jest wymagany",
    userRequired: "Użytkownik jest wymagany",
    rating: "Wybierz ocenę od 1 do 5",
    productNameMin: "Nazwa musi mieć min. 3 znaki",
    slugMin: "Slug musi mieć min. 3 znaki",
    category: "Wybierz kategorię",
    brandMin: "Marka musi mieć min. 3 znaki",
    productDescriptionMin: "Opis musi mieć min. 3 znaki",
    stock: "Podaj poprawny stan magazynowy",
    price: "Podaj poprawną cenę",
    images: "Dodaj co najmniej jeden obraz produktu",
  },
} as const;

export function firstZodMessage(error: z.ZodError, lang: Locale) {
  return error.issues[0]?.message ?? msg[lang].invalidData;
}

export function insertEmailMessageSchema(lang: Locale) {
  const t = msg[lang];
  return z.object({
    email: z.email(t.email),
    message: z.string().min(3, t.messageMin).max(200, t.messageMax),
  });
}

export type InsertEmailMessage = z.infer<
  ReturnType<typeof insertEmailMessageSchema>
>;

export function insertReviewSchema(lang: Locale) {
  const t = msg[lang];
  return z.object({
    title: z.string().min(3, t.titleMin),
    description: z.string().min(3, t.descriptionMin),
    productId: z.string().min(1, t.productRequired),
    userId: z.string().min(1, t.userRequired),
    rating: z.number().int().min(1, t.rating).max(5, t.rating),
  });
}

export type InsertReview = z.infer<ReturnType<typeof insertReviewSchema>>;

export function signInSchema(lang: Locale) {
  const t = msg[lang];
  return z.object({
    email: z.email(t.email),
    password: z.string().min(6, t.passwordMin),
  });
}

export function signUpSchema(lang: Locale) {
  const t = msg[lang];
  return z
    .object({
      name: z.string().trim().min(3, t.nameMin),
      email: z.email(t.email),
      password: z.string().min(6, t.passwordMin),
      confirmPassword: z.string().min(6, t.passwordMin),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.passwordsMatch,
      path: ["confirmPassword"],
    });
}

export function forgotPasswordSchema(lang: Locale) {
  const t = msg[lang];
  return z.object({
    email: z.email(t.email),
  });
}

export function resetPasswordSchema(lang: Locale) {
  const t = msg[lang];
  return z
    .object({
      token: z.string().min(1, t.invalidData),
      password: z.string().min(6, t.passwordMin),
      confirmPassword: z.string().min(6, t.passwordMin),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.passwordsMatch,
      path: ["confirmPassword"],
    });
}

export type SignUpInput = z.infer<ReturnType<typeof signUpSchema>>;

export function updateProfileSchema(lang: Locale) {
  const t = msg[lang];
  return z.object({
    name: z.string().trim().min(3, t.nameMin),
  });
}

export type UpdateProfileInput = z.infer<
  ReturnType<typeof updateProfileSchema>
>;

export function updateAdminUserSchema(lang: Locale) {
  const t = msg[lang];
  return z.object({
    name: z.string().trim().min(3, t.nameMin),
    role: z.enum(USER_ROLES, { error: t.role }),
  });
}

export function shippingAddressSchema(lang: Locale) {
  const t = msg[lang];
  return z.object({
    fullName: z.string().trim().min(1, t.address),
    streetAddress: z.string().trim().min(1, t.address),
    city: z.string().trim().min(1, t.address),
    postalCode: z.string().trim().min(1, t.address),
    country: z.string().trim().min(1, t.address),
  });
}

export type ShippingAddressInput = z.infer<
  ReturnType<typeof shippingAddressSchema>
>;

export function paymentMethodSchema(lang: Locale) {
  const t = msg[lang];
  return z.object({
    paymentMethod: z.enum(PAYMENT_METHODS, { error: t.paymentMethod }),
  });
}

function isValidPrice(value: string) {
  const num = Number(value);
  return value.length > 0 && !Number.isNaN(num) && num >= 0;
}

export function productFormSchema(lang: Locale) {
  const t = msg[lang];
  return z.object({
    name: z.string().trim().min(3, t.productNameMin),
    slug: z.string().trim().min(3, t.slugMin),
    category: z
      .string()
      .refine(
        (value): value is (typeof PRODUCT_CATEGORIES)[number] =>
          PRODUCT_CATEGORIES.includes(
            value as (typeof PRODUCT_CATEGORIES)[number],
          ),
        t.category,
      ),
    brand: z.string().trim().min(3, t.brandMin),
    description: z.string().trim().min(3, t.productDescriptionMin),
    stock: z.number().finite().int().min(0, t.stock),
    price: z.string().refine(isValidPrice, t.price),
    images: z.array(z.string().min(1)).min(1, t.images),
    isFeatured: z.boolean(),
    banner: z.string().nullable(),
  });
}
