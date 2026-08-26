import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifySocketToken } from "@/lib/chat-auth";
import {
  canAccessOrderChat,
  createChatMessage,
  type OrderChatMessage,
} from "@/lib/chat";

type SocketAuthState = {
  userId: string;
  role: string;
};

const socketAuthState = new Map<string, SocketAuthState>();
const messageWindowBySocket = new Map<string, number[]>();

function roomForOrder(orderId: string) {
  return `order:${orderId}`;
}

function getSocketAuth(socketId: string) {
  return socketAuthState.get(socketId) ?? null;
}

export function attachSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const tokenFromAuth = socket.handshake.auth?.token;
    const tokenFromHeader =
      typeof socket.handshake.headers.authorization === "string"
        ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, "")
        : null;
    const token =
      typeof tokenFromAuth === "string" && tokenFromAuth.length > 0
        ? tokenFromAuth
        : tokenFromHeader;

    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    const payload = await verifySocketToken(token);
    if (!payload?.userId) {
      next(new Error("Unauthorized"));
      return;
    }

    socketAuthState.set(socket.id, payload);
    next();
  });

  io.on("connection", (socket) => {
    socket.on("chat:join", async (payload: { orderId?: string }) => {
      const authState = getSocketAuth(socket.id);
      const orderId = payload?.orderId;

      if (!authState || !orderId || typeof orderId !== "string") {
        socket.emit("chat:error", { message: "Invalid join request." });
        return;
      }

      const allowed = await canAccessOrderChat(
        authState.userId,
        authState.role,
        orderId,
      );
      if (!allowed) {
        socket.emit("chat:error", { message: "Forbidden." });
        return;
      }

      socket.join(roomForOrder(orderId));
    });

    socket.on(
      "chat:send",
      async (payload: {
        orderId?: string;
        content?: string;
        clientMessageId?: string;
      }) => {
        const authState = getSocketAuth(socket.id);
        const orderId = payload?.orderId;
        const rawContent = payload?.content;
        const content = typeof rawContent === "string" ? rawContent.trim() : "";

        if (!authState || !orderId || typeof orderId !== "string") {
          socket.emit("chat:error", { message: "Invalid message request." });
          return;
        }

        const allowed = await canAccessOrderChat(
          authState.userId,
          authState.role,
          orderId,
        );
        if (!allowed) {
          socket.emit("chat:error", { message: "Forbidden." });
          return;
        }

        if (!content || content.length > 1000) {
          socket.emit("chat:error", { message: "Message content is invalid." });
          return;
        }

        const now = Date.now();
        const timestamps = (messageWindowBySocket.get(socket.id) ?? []).filter(
          (timestamp) => now - timestamp < 60_000,
        );
        if (timestamps.length >= 20) {
          socket.emit("chat:error", { message: "Rate limit exceeded." });
          return;
        }
        timestamps.push(now);
        messageWindowBySocket.set(socket.id, timestamps);

        try {
          const message = await createChatMessage({
            orderId,
            senderId: authState.userId,
            content,
          });

          io.to(roomForOrder(orderId)).emit("chat:message", {
            ...message,
            clientMessageId:
              typeof payload?.clientMessageId === "string"
                ? payload.clientMessageId
                : null,
          } satisfies OrderChatMessage & { clientMessageId: string | null });
        } catch (error) {
          socket.emit("chat:error", {
            message:
              error instanceof Error ? error.message : "Failed to send message.",
          });
        }
      },
    );

    socket.on("disconnect", () => {
      socketAuthState.delete(socket.id);
      messageWindowBySocket.delete(socket.id);
    });
  });

  return io;
}
