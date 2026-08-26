"use client";

import { io, type Socket } from "socket.io-client";

let socketSingleton: Socket | null = null;

export function getSocket() {
  if (socketSingleton) {
    return socketSingleton;
  }

  socketSingleton = io({
    path: "/socket.io",
    autoConnect: false,
    transports: ["websocket"],
  });

  return socketSingleton;
}

export async function connectSocketWithAuth() {
  const response = await fetch("/api/chat/token", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unauthorized");
  }

  const data = (await response.json()) as { token?: string };
  if (!data.token) {
    throw new Error("Missing socket token");
  }

  const socket = getSocket();
  socket.auth = { token: data.token };
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}
