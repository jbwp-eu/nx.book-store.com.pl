"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getUserById } from "@/lib/actions/user.actions";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { CartItem } from "@/lib/cart";
import { defaultLocale, type Locale } from "@/lib/i18n";
import { paypal } from "@/lib/paypal";
import type { ShippingAddress } from "@/lib/shipping";
import { PAGE_SIZE } from "@/lib/constants";
import { sendOrderStatusEmail } from "@/lib/email";

async function requireOrderForUser(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
  });
}

export async function createOrder(lang: Locale): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${lang}/sign-in?callbackUrl=/${lang}/place-order`);
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    redirect(`/${lang}/sign-in?callbackUrl=/${lang}/place-order`);
  }

  const cart = await getMyCart();
  if (!cart || cart.items.length === 0) {
    redirect(`/${lang}/cart`);
  }

  if (!user.address) {
    redirect(`/${lang}/shipping-address`);
  }

  if (!user.paymentMethod) {
    redirect(`/${lang}/payment-method`);
  }

  const cartItems = cart.items as CartItem[];
  const products = await prisma.product.findMany({
    where: { id: { in: cartItems.map((item) => item.productId) } },
    select: { id: true, stock: true },
  });
  const stockByProductId = new Map(products.map((p) => [p.id, p.stock]));

  for (const item of cartItems) {
    const stock = stockByProductId.get(item.productId);
    if (stock == null || stock < item.qty) {
      redirect(`/${lang}/cart`);
    }
  }

  const orderId = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId: user.id,
        shippingAddress: user.address as ShippingAddress,
        paymentMethod: user.paymentMethod!,
        itemsPrice: cart.itemsPrice,
        shippingPrice: cart.shippingPrice,
        taxPrice: cart.taxPrice,
        totalPrice: cart.totalPrice,
      },
    });

    for (const item of cartItems) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          name: item.name,
          slug: item.slug,
          image: item.image,
        },
      });
    }

    await tx.cart.update({
      where: { id: cart.id },
      data: {
        items: [],
        itemsPrice: 0,
        shippingPrice: 0,
        taxPrice: 0,
        totalPrice: 0,
      },
    });

    return order.id;
  });

  redirect(`/${lang}/order/${orderId}`);
}

export async function getOrderById(
  orderId: string,
  userId: string,
  options?: { asAdmin?: boolean },
) {
  const order = await prisma.order.findFirst({
    where: options?.asAdmin ? { id: orderId } : { id: orderId, userId },
    include: {
      orderItems: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!order) return null;

  return {
    ...order,
    shippingAddress: order.shippingAddress as ShippingAddress,
    itemsPrice: order.itemsPrice.toString(),
    shippingPrice: order.shippingPrice.toString(),
    taxPrice: order.taxPrice.toString(),
    totalPrice: order.totalPrice.toString(),
    orderItems: order.orderItems.map((item) => ({
      ...item,
      price: item.price.toString(),
    })),
  };
}

export async function getMyOrders(page = 1, limit = PAGE_SIZE) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: [], totalPages: 0 };
  }

  const where = { userId: session.user.id };
  const [orders, count] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      totalPrice: order.totalPrice.toString(),
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt,
      paymentMethod: order.paymentMethod,
    })),
    totalPages: Math.ceil(count / limit),
  };
}

export async function updateOrderToPaid(
  orderId: string,
  lang: Locale = defaultLocale,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      orderItems: true,
      user: { select: { email: true } },
    },
  });
  if (!order) throw new Error("Order not found");

  const newlyPaid = await prisma.$transaction(async (tx) => {
    const markedPaid = await tx.order.updateMany({
      where: { id: orderId, isPaid: false },
      data: { isPaid: true, paidAt: new Date() },
    });
    if (markedPaid.count === 0) return false;

    for (const item of order.orderItems) {
      const decremented = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.qty } },
        data: { stock: { decrement: item.qty } },
      });
      if (decremented.count === 0) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    return true;
  });

  if (!newlyPaid) return;

  if (order.user?.email) {
    await sendOrderStatusEmail({
      to: order.user.email,
      orderId,
      status: "paid",
      lang,
      totalPrice: order.totalPrice.toString(),
    });
  }
}

export async function createPayPalOrder(orderId: string, lang: Locale) {
  try {
    const order = await requireOrderForUser(orderId);
    if (!order) {
      return {
        success: false as const,
        message:
          lang === "en" ? "Order not found" : "Zamówienie nie zostało znalezione",
      };
    }
    if (order.isPaid) {
      return {
        success: false as const,
        message:
          lang === "en" ? "Order is already paid" : "Zamówienie już opłacone",
      };
    }
    if (order.paymentMethod !== "PayPal") {
      return {
        success: false as const,
        message:
          lang === "en"
            ? "Order is not a PayPal payment"
            : "To zamówienie nie jest płatnością PayPal",
      };
    }

    const paypalOrder = await paypal.createOrder(Number(order.totalPrice));
    return {
      success: true as const,
      data: paypalOrder.id as string,
      message: null,
    };
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : "PayPal error",
    };
  }
}

export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string },
  lang: Locale,
) {
  try {
    const order = await requireOrderForUser(orderId);
    if (!order) {
      return {
        success: false as const,
        message:
          lang === "en" ? "Order not found" : "Zamówienie nie zostało znalezione",
      };
    }
    if (order.isPaid) {
      return {
        success: true as const,
        message:
          lang === "en"
            ? "Your order has been paid (demo — not a real confirmation)"
            : "Twoje zamówienie zostało opłacone (demo — to nie jest prawdziwe potwierdzenie)",
      };
    }

    const captureData = await paypal.capturePayment(data.orderID);
    if (!captureData || captureData.status !== "COMPLETED") {
      return {
        success: false as const,
        message:
          lang === "en" ? "Error in PayPal payment" : "Błąd w płatności PayPal",
      };
    }

    const captured =
      captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
    if (
      captured != null &&
      Number(captured).toFixed(2) !== Number(order.totalPrice).toFixed(2)
    ) {
      return {
        success: false as const,
        message:
          lang === "en"
            ? "PayPal amount mismatch"
            : "Niezgodna kwota płatności PayPal",
      };
    }

    await updateOrderToPaid(order.id, lang);
    revalidatePath(`/${lang}/order/${order.id}`);

    return {
      success: true as const,
      message:
        lang === "en"
          ? "Your order has been paid (demo — not a real confirmation)"
          : "Twoje zamówienie zostało opłacone (demo — to nie jest prawdziwe potwierdzenie)",
    };
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : "PayPal error",
    };
  }
}

export async function getAllOrdersAdmin(page = 1, limit = PAGE_SIZE) {
  const [orders, count] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.order.count(),
  ]);

  return {
    data: orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      totalPrice: order.totalPrice.toString(),
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt,
      paymentMethod: order.paymentMethod,
      userName: order.user?.name ?? order.user?.email ?? null,
    })),
    totalPages: Math.ceil(count / limit),
  };
}

export async function deliverOrder(orderId: string, lang: Locale) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return {
      success: false as const,
      message: lang === "en" ? "Unauthorized" : "Brak uprawnień",
    };
  }

  const order = await prisma.order.findFirst({ where: { id: orderId } });
  if (!order) {
    return {
      success: false as const,
      message:
        lang === "en" ? "Order not found" : "Zamówienie nie zostało znalezione",
    };
  }
  if (!order.isPaid) {
    return {
      success: false as const,
      message:
        lang === "en" ? "Order is not paid" : "Zamówienie nie jest opłacone",
    };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { isDelivered: true, deliveredAt: new Date() },
  });

  const user = await prisma.user.findUnique({
    where: { id: order.userId },
    select: { email: true },
  });
  if (user?.email) {
    await sendOrderStatusEmail({
      to: user.email,
      orderId,
      status: "delivered",
      lang,
      totalPrice: order.totalPrice.toString(),
    });
  }

  revalidatePath(`/${lang}/admin/orders`);
  revalidatePath(`/${lang}/order/${orderId}`);

  return {
    success: true as const,
    message:
      lang === "en"
        ? "Order marked delivered (demo — for testing only, not a real shipment)"
        : "Zamówienie oznaczone jako dostarczone (demo — wyłącznie do testów, nie jest to prawdziwa wysyłka)",
  };
}

export async function deleteOrder(lang: Locale, orderId: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return {
      error: lang === "en" ? "Unauthorized" : "Brak uprawnień",
    };
  }

  const order = await prisma.order.findFirst({ where: { id: orderId } });
  if (!order) {
    return {
      error:
        lang === "en" ? "Order not found" : "Zamówienie nie zostało znalezione",
    };
  }

  try {
    await prisma.order.delete({ where: { id: orderId } });
    revalidatePath(`/${lang}/admin/orders`);
    revalidatePath(`/${lang}/admin/overview`);
    revalidatePath(`/${lang}/user/orders`);
    return {
      error: null,
      message:
        lang === "en"
          ? "Order deleted successfully"
          : "Zamówienie zostało usunięte",
    };
  } catch {
    return {
      error:
        lang === "en"
          ? "Could not delete order"
          : "Nie udało się usunąć zamówienia",
    };
  }
}

export async function getAdminOverview() {
  const [products, orders, users, paidOrders, recent, salesDataRaw] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.findMany({
        where: { isPaid: true },
        select: { totalPrice: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.$queryRaw<Array<{ month: string; totalSales: Prisma.Decimal }>>`
        SELECT to_char("createdAt", 'MM/YY') as "month",
               sum("totalPrice") as "totalSales"
        FROM "Order"
        GROUP BY to_char("createdAt", 'MM/YY')
      `,
    ]);

  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice),
    0,
  );

  const salesData = salesDataRaw.map((entry) => ({
    month: entry.month,
    totalSales: Number(entry.totalSales),
  }));

  return {
    products,
    orders,
    users,
    revenue: revenue.toFixed(2),
    salesData,
    recent: recent.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      totalPrice: order.totalPrice.toString(),
      userName: order.user?.name ?? order.user?.email ?? null,
    })),
  };
}
