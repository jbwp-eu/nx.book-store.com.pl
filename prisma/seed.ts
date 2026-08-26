import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: "Nieodnaleziona",
    slug: "nieodnaleziona",
    category: "Polish",
    description: "Jej zaginięcie to dopiero początek...",
    images: [
      "/images/sample-products/nieodnaleziona-1.jpg",
      "/images/sample-products/nieodnaleziona-2.jpg",
    ],
    price: 39.9,
    brand: "Literary fiction",
    rating: 0,
    numReviews: 0,
    stock: 2,
    isFeatured: false,
    banner: null,
  },
  {
    name: "Italia",
    slug: "italia",
    category: "Foreign",
    description:
      "Pełne zapachów, smaków i sztuki historie, które zabierają nas do najpiękniejszych włoskich zakątków ...",
    images: [
      "/images/sample-products/italia-1.jpg",
      "/images/sample-products/italia-2.jpg",
    ],
    price: 44.9,
    brand: "Literary fiction",
    rating: 0,
    numReviews: 0,
    stock: 2,
    isFeatured: true,
    banner: "/images/sample-products/italia-3.jpg",
  },
  {
    name: "Zielona wyspa",
    slug: "zielona-wyspa",
    category: "Polish",
    description: "Literacka podróż.",
    images: ["/images/no-image.png"],
    price: 39.99,
    brand: "Literary fiction",
    rating: 0,
    numReviews: 0,
    stock: 4,
    isFeatured: true,
    banner: null,
  },
];

async function main() {
  await prisma.product.deleteMany();
  await prisma.product.createMany({ data: products });

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const plainPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!plainPassword) {
    throw new Error("Brak SEED_ADMIN_PASSWORD w .env");
  }

  const adminPassword = await bcrypt.hash(plainPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "admin",
      password: adminPassword,
      name: "Admin",
    },
    create: {
      name: "Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    },
  });

  console.log("Seed OK:", products.length, "products +", adminEmail);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
