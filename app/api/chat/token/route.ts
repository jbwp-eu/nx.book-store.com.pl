import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createSocketToken } from "@/lib/chat-auth";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headerList = await headers();
  const limited = rateLimit({
    key: clientKeyFromHeaders(headerList, `chat-token:${session.user.id}`),
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const token = await createSocketToken({
    userId: session.user.id,
    role: session.user.role ?? "user",
  });

  return Response.json({ token });
}
