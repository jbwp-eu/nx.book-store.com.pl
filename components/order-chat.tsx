"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getOrderChatMessages } from "@/lib/actions/chat.actions";
import type { OrderChatMessage } from "@/lib/chat";
import { connectSocketWithAuth } from "@/lib/socket-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type OrderChatLabels = {
  title: string;
  placeholder: string;
  send: string;
  empty: string;
  loading: string;
  login_required: string;
  admin_badge: string;
  load_failed: string;
};

export default function OrderChat({
  orderId,
  currentUserId,
  labels,
}: {
  orderId: string;
  currentUserId: string;
  labels: OrderChatLabels;
}) {
  const [messages, setMessages] = useState<OrderChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(
    () => draft.trim().length > 0 && draft.trim().length <= 1000 && !sending,
    [draft, sending],
  );

  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      try {
        const result = await getOrderChatMessages(orderId);
        if (!mounted) return;

        if ("error" in result) {
          setError(
            result.error === "Unauthorized"
              ? labels.login_required
              : labels.load_failed,
          );
          return;
        }

        setMessages(result.messages);
      } catch {
        if (mounted) {
          setError(labels.load_failed);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadMessages();
    return () => {
      mounted = false;
    };
  }, [orderId, labels.load_failed, labels.login_required]);

  useEffect(() => {
    let socket: Awaited<ReturnType<typeof connectSocketWithAuth>> | null = null;
    let mounted = true;

    const onMessage = (message: OrderChatMessage) => {
      if (message.orderId !== orderId) return;
      setMessages((prev) =>
        prev.some((item) => item.id === message.id) ? prev : [...prev, message],
      );
    };

    const onError = (payload: { message?: string }) => {
      if (payload?.message) {
        setError(payload.message);
      }
      setSending(false);
    };

    const connect = async () => {
      try {
        socket = await connectSocketWithAuth();
        if (!mounted) return;
        socket.on("chat:message", onMessage);
        socket.on("chat:error", onError);
        socket.emit("chat:join", { orderId });
      } catch {
        if (mounted) {
          setError(labels.login_required);
        }
      }
    };

    void connect();

    return () => {
      mounted = false;
      if (socket) {
        socket.off("chat:message", onMessage);
        socket.off("chat:error", onError);
      }
    };
  }, [orderId, labels.login_required]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || content.length > 1000) return;

    setSending(true);
    setError(null);

    try {
      const socket = await connectSocketWithAuth();
      socket.emit("chat:send", {
        orderId,
        content,
        clientMessageId: crypto.randomUUID(),
      });
      setDraft("");
    } catch {
      setError(labels.login_required);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
            <span className="sr-only">{labels.loading}</span>
          </div>
        ) : (
          <div
            ref={listRef}
            className="bg-muted/30 max-h-64 space-y-2 overflow-y-auto rounded-md border p-3"
          >
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-sm">{labels.empty}</p>
            ) : (
              messages.map((message) => {
                const own = message.sender.id === currentUserId;
                const isAdmin = message.sender.role === "admin";

                return (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      own
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted"
                    }`}
                  >
                    <p
                      className={`mb-1 text-xs ${
                        own ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {message.sender.name}
                      {isAdmin ? ` (${labels.admin_badge})` : ""}
                      {" · "}
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                    <p className="break-words whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={labels.placeholder}
            rows={2}
            maxLength={1000}
            disabled={loading || sending}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend || loading}
            className="self-end"
          >
            {sending ? labels.loading : labels.send}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
