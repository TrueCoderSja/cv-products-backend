import { prisma } from "../src/lib/prisma";

// 🧠 Word banks for semi-real product names
const ADJECTIVES = [
  "Smart",
  "Ultra",
  "Pro",
  "Eco",
  "Compact",
  "Wireless",
  "Advanced",
  "Portable",
  "Premium",
  "Essential",
];

const PRODUCTS = [
  "Headphones",
  "Backpack",
  "Mixer",
  "Watch",
  "Laptop",
  "Shoes",
  "Lamp",
  "Keyboard",
  "Camera",
  "Bottle",
  "Chair",
  "Phone Case",
  "Tablet",
  "Microwave",
  "Jacket",
  "Drone",
];

// 🎲 Helpers
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 🎯 Bias toward recent dates (last ~2 years)
function randomDateBiasedRecent(): Date {
  const now = Date.now();
  const twoYears = 1000 * 60 * 60 * 24 * 365 * 2;

  const skew = Math.pow(Math.random(), 2);
  const offset = Math.floor(skew * twoYears);

  return new Date(now - offset);
}

function generateProductName(): string {
  const adj = pick(ADJECTIVES);
  const product = pick(PRODUCTS);

  const model =
    Math.random() > 0.7
      ? ` ${Math.floor(100 + Math.random() * 900)}`
      : "";

  return `${adj} ${product}${model}`;
}

// ⚡ Config
const TOTAL = 200_000;
const BATCH_SIZE = 2_000;

// 🧠 Fixed category seeds
const CATEGORY_NAMES = [
  "electronics",
  "fashion",
  "home",
  "books",
  "sports",
  "beauty",
  "toys",
  "automotive",
  "grocery",
];

async function main() {
  console.log("🌱 Starting relational seed...");

  // ---------------------------------------------------------------------------
  // 1. SEED CATEGORIES FIRST
  // ---------------------------------------------------------------------------
  console.log("📦 Seeding categories...");

  await prisma.category.createMany({
    data: CATEGORY_NAMES.map((name) => ({
      name,
    })),
    skipDuplicates: true,
  });

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  const categoryMap = new Map(
    categories.map((c) => [c.name, c.id])
  );

  console.log("✅ Categories ready");

  // ---------------------------------------------------------------------------
  // 2. SEED PRODUCTS
  // ---------------------------------------------------------------------------
  console.log("🛍️ Seeding products...");

  let created = 0;

  while (created < TOTAL) {
    const batch = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const categoryName =
        CATEGORY_NAMES[
          Math.floor(Math.random() * CATEGORY_NAMES.length)
        ];

      batch.push({
        name: generateProductName(),
        categoryId: categoryMap.get(categoryName)!,
        createdAt: randomDateBiasedRecent(),
      });
    }

    await prisma.product.createMany({
      data: batch,
    });

    created += BATCH_SIZE;

    console.log(`⚡ Inserted ${created}/${TOTAL} products`);
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });