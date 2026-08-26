"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calcPrice, type CartItem } from "@/lib/cart";
import type { Locale } from "@/lib/i18n";

function messages(lang: Locale) {
  const en = lang === "en";
  return {
    noSession: en ? "Cart session not found" : "Brak sesji koszyka",
    noProduct: en ? "Product not found" : "Brak produktu",
    noStock: en ? "Not enough stock" : "Brak w magazynie",
    noCart: en ? "Cart not found" : "Koszyk nie został znaleziony",
    noItem: en ? "Item not found" : "Produkt nie został znaleziony",
  };
}

async function sessionId() {
  const cookieStore = await cookies();
  return cookieStore.get("sessionCartId")?.value;
}

function toCartView(cart: {
  id: string;
  sessionCartId: string;
  items: unknown;
  itemsPrice: { toString(): string };
  totalPrice: { toString(): string };
  shippingPrice: { toString(): string };
  taxPrice: { toString(): string };
}) {
  return {
    id: cart.id,
    sessionCartId: cart.sessionCartId,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  };
}

export async function getMyCart() {
  const session = await auth();
  const userId = session?.user?.id;
  const sessionCartId = await sessionId();
  if (!userId && !sessionCartId) return null;

  const cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionCartId },
  });
  if (!cart) return null;
  return toCartView(cart);
}

export async function addItemToCart(data: CartItem, lang: Locale) {
  const t = messages(lang);
  const session = await auth();
  const sessionCartId = await sessionId();
  if (!sessionCartId) return { success: false, message: t.noSession };

  const product = await prisma.product.findFirst({
    where: { id: data.productId },
  });
  if (!product) return { success: false, message: t.noProduct };

  const item: CartItem = {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    qty: 1,
    image: product.images[0] ?? "/images/no-image.png",
    price: product.price.toString(),
  };

  const cart = await getMyCart();

  if (!cart) {
    if (product.stock < 1) return { success: false, message: t.noStock };
    await prisma.cart.create({
      data: {
        sessionCartId,
        userId: session?.user?.id,
        items: [item],
        ...calcPrice([item]),
      },
    });
  } else {
    const items = [...cart.items];
    const existing = items.find((x) => x.productId === item.productId);

    if (existing) {
      if (product.stock < existing.qty + 1) {
        return { success: false, message: t.noStock };
      }
      existing.qty += 1;
    } else {
      if (product.stock < 1) return { success: false, message: t.noStock };
      items.push(item);
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items,
        ...calcPrice(items),
      },
    });
  }

  revalidatePath(`/${lang}/product/${product.slug}`);
  revalidatePath(`/${lang}/cart`);
  return { success: true, message: null };
}

export async function removeItemFromCart(productId: string, lang: Locale) {
  const t = messages(lang);
  const sessionCartId = await sessionId();
  if (!sessionCartId) return { success: false, message: t.noSession };

  const product = await prisma.product.findFirst({
    where: { id: productId },
  });
  if (!product) return { success: false, message: t.noItem };

  const cart = await getMyCart();
  if (!cart) return { success: false, message: t.noCart };

  const existing = cart.items.find((x) => x.productId === product.id);
  if (!existing) return { success: false, message: t.noItem };

  const items =
    existing.qty === 1
      ? cart.items.filter((x) => x.productId !== existing.productId)
      : cart.items.map((x) =>
          x.productId === existing.productId ? { ...x, qty: x.qty - 1 } : x,
        );

  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      items,
      ...calcPrice(items),
    },
  });

  revalidatePath(`/${lang}/product/${product.slug}`);
  revalidatePath(`/${lang}/cart`);
  return { success: true, message: null };
}
