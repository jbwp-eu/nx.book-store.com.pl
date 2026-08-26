"use server";

import bcrypt from "bcryptjs";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn, signOut, unstable_update } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";
import {
  parseShippingAddress,
  type ShippingAddress,
} from "@/lib/shipping";
import { PAGE_SIZE } from "@/lib/constants";
import {
  firstZodMessage,
  forgotPasswordSchema,
  paymentMethodSchema,
  resetPasswordSchema,
  shippingAddressSchema,
  signInSchema,
  signUpSchema,
  updateAdminUserSchema,
  updateProfileSchema,
} from "@/lib/validators";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

type AuthState = { error: string | null };
type FormState = { error: string | null; message?: string | null };

function invalid(lang: Locale): AuthState {
  return {
    error:
      lang === "en"
        ? "Invalid email or password"
        : "Nieprawidłowy adres e-mail lub hasło",
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

export async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function getAdminUsers(page = 1, limit = PAGE_SIZE) {
  const [users, count] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.count(),
  ]);

  return {
    data: users,
    totalPages: Math.ceil(count / limit),
  };
}

export async function getAdminUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export async function updateAdminUser(
  lang: Locale,
  userId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const denied = await requireAdminMutation(lang);
  if (denied) return denied;

  const parsed = updateAdminUserSchema(lang).safeParse({
    name: String(formData.get("name") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim(),
  });
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error, lang) };
  }

  const { name, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return {
      error:
        lang === "en" ? "User not found" : "Użytkownik nie został znaleziony",
    };
  }

  const session = await auth();
  if (
    session?.user?.id === userId &&
    existing.role === "admin" &&
    role !== "admin"
  ) {
    return {
      error:
        lang === "en"
          ? "You cannot remove your own admin role"
          : "Nie możesz odebrać sobie roli administratora",
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name, role },
  });

  revalidatePath(`/${lang}/admin/users`);
  redirect(`/${lang}/admin/users`);
}

export async function deleteAdminUser(lang: Locale, userId: string) {
  const denied = await requireAdminMutation(lang);
  if (denied) return denied;

  const session = await auth();
  if (session?.user?.id === userId) {
    return {
      error:
        lang === "en"
          ? "You cannot delete your own account"
          : "Nie możesz usunąć własnego konta",
    };
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return {
      error:
        lang === "en" ? "User not found" : "Użytkownik nie został znaleziony",
    };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath(`/${lang}/admin/users`);
    return {
      error: null,
      message:
        lang === "en"
          ? "User deleted successfully"
          : "Użytkownik został usunięty",
    };
  } catch {
    return {
      error:
        lang === "en"
          ? "Could not delete user"
          : "Nie udało się usunąć użytkownika",
    };
  }
}

export async function updateProfile(
  lang: Locale,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: lang === "en" ? "Please sign in" : "Zaloguj się",
    };
  }

  const parsed = updateProfileSchema(lang).safeParse({
    name: String(formData.get("name") ?? "").trim(),
  });
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error, lang) };
  }

  const { name } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  await unstable_update({ user: { name } });
  revalidatePath(`/${lang}/user/profile`);
  revalidatePath(`/${lang}`);

  return {
    error: null,
    message:
      lang === "en"
        ? "Profile updated successfully"
        : "Profil został zaktualizowany",
  };
}

export async function signInWithCredentials(
  lang: Locale,
  callbackUrl: string | undefined,
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema(lang).safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return invalid(lang);
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl || `/${lang}`,
    });
    return { error: null };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return invalid(lang);
  }
}

export async function signUpUser(
  lang: Locale,
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema(lang).safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error, lang) };
  }

  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return {
      error:
        lang === "en"
          ? "An account with this email already exists"
          : "Konto z tym adresem e-mail już istnieje",
    };
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: `/${lang}`,
    });
    return { error: null };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return invalid(lang);
  }
}

export async function signOutUser(lang: Locale) {
  await signOut({ redirectTo: `/${lang}` });
}

export async function requestPasswordReset(
  lang: Locale,
  _prev: AuthState & { success?: boolean },
  formData: FormData,
): Promise<AuthState & { success?: boolean }> {
  const parsed = forgotPasswordSchema(lang).safeParse({
    email: String(formData.get("email") ?? "").trim(),
  });
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error, lang) };
  }

  const limited = rateLimit({
    key: `password-reset:${parsed.data.email.toLowerCase()}`,
    limit: 3,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    return {
      error:
        lang === "en"
          ? "Too many requests. Try again later."
          : "Zbyt wiele prób. Spróbuj ponownie później.",
    };
  }

  const genericSuccess = {
    error: null,
    success: true as const,
  };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) return genericSuccess;

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: tokenHash,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      token,
      lang,
    });
  } catch {
    return {
      error:
        lang === "en"
          ? "Could not send email. Check SMTP settings."
          : "Nie udało się wysłać e-maila. Sprawdź ustawienia SMTP.",
    };
  }

  return genericSuccess;
}

export async function resetPasswordWithToken(
  lang: Locale,
  _prev: AuthState & { success?: boolean },
  formData: FormData,
): Promise<AuthState & { success?: boolean }> {
  const parsed = resetPasswordSchema(lang).safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error, lang) };
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: tokenHash,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return {
      error:
        lang === "en"
          ? "This link is invalid or has expired"
          : "Link jest nieprawidłowy lub wygasł",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(parsed.data.password, 10),
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return { error: null, success: true };
}

export async function updateUserAddress(
  lang: Locale,
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: lang === "en" ? "Please sign in" : "Zaloguj się",
    };
  }

  const parsed = shippingAddressSchema(lang).safeParse(
    parseShippingAddress(formData),
  );
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error, lang) };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { address: parsed.data },
  });

  redirect(`/${lang}/payment-method`);
}

export async function updateUserPaymentMethod(
  lang: Locale,
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: lang === "en" ? "Please sign in" : "Zaloguj się",
    };
  }

  const parsed = paymentMethodSchema(lang).safeParse({
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
  });
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error, lang) };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { paymentMethod: parsed.data.paymentMethod },
  });

  redirect(`/${lang}/place-order`);
}

export type { ShippingAddress };
