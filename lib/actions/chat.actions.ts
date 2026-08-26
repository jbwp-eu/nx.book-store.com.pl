"use server";

import { auth } from "@/lib/auth";
import {
  canAccessOrderChat,
  getChatMessagesForOrder,
  type OrderChatMessage,
} from "@/lib/chat";

export async function getOrderChatMessages(orderId: string): Promise<
  | { messages: OrderChatMessage[] }
  | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const allowed = await canAccessOrderChat(
    session.user.id,
    session.user.role ?? "user",
    orderId,
  );
  if (!allowed) {
    return { error: "Forbidden" };
  }

  const messages = await getChatMessagesForOrder(orderId);
  return { messages };
}
