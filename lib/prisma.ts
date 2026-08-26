import "dotenv/config";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prismaCheckout: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Ensure .env exists and the app loads dotenv (npm run dev via server.ts).",
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma =
  globalForPrisma.prismaCheckout ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaCheckout = prisma;
}

export default prisma;
