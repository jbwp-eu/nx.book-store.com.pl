import prisma from "@/lib/prisma";

export type OrderChatMessage = {
  id: string;
  orderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
};

export async function canAccessOrderChat(
  userId: string,
  role: string,
  orderId: string,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  });

  if (!order) {
    return false;
  }

  return role === "admin" || order.userId === userId;
}

export async function getChatMessagesForOrder(
  orderId: string,
): Promise<OrderChatMessage[]> {
  const rows = await prisma.chatMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    sender: row.sender,
  }));
}

export async function createChatMessage(params: {
  orderId: string;
  senderId: string;
  content: string;
}): Promise<OrderChatMessage> {
  const row = await prisma.chatMessage.create({
    data: {
      orderId: params.orderId,
      senderId: params.senderId,
      content: params.content.trim(),
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return {
    id: row.id,
    orderId: row.orderId,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    sender: row.sender,
  };
}
