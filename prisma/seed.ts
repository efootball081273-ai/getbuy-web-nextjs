import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const categorySeeds = [
  {
    name: "Electronics",
    slug: "electronics",
    description: "Phones, computing, audio, and everyday tech.",
  },
  {
    name: "Fashion",
    slug: "fashion",
    description: "Contemporary clothing, footwear, and accessories.",
  },
  {
    name: "Home and Living",
    slug: "home-and-living",
    description: "Furniture, kitchen, decor, and household essentials.",
  },
];

const productSeeds = [
  { name: "Samsung Galaxy A55", slug: "samsung-galaxy-a55", category: "electronics", price: 48500000, stock: 18, sku: "ELEC-SGA55", featured: true, description: "A polished 5G smartphone with a vivid AMOLED display, capable cameras, and dependable all-day battery life." },
  { name: "Apple iPhone 15", slug: "apple-iphone-15", category: "electronics", price: 125000000, salePrice: 119500000, stock: 10, sku: "ELEC-IP15", featured: true, description: "The iPhone 15 combines elegant design, the Dynamic Island, advanced cameras, and fast USB-C charging." },
  { name: "Sony WH-1000XM5", slug: "sony-wh-1000xm5", category: "electronics", price: 62000000, salePrice: 58900000, stock: 14, sku: "ELEC-WHXM5", featured: false, description: "Premium wireless headphones with industry-leading noise cancellation and long listening time." },
  { name: "HP Pavilion 15 Laptop", slug: "hp-pavilion-15-laptop", category: "electronics", price: 78000000, stock: 8, sku: "ELEC-HPP15", featured: true, description: "A versatile everyday laptop for study, work, entertainment, and productive multitasking." },
  { name: "Classic Ankara Print Dress", slug: "classic-ankara-print-dress", category: "fashion", price: 3850000, salePrice: 3250000, stock: 24, sku: "FASH-ANK01", featured: true, description: "A vibrant Ankara print dress with a flattering silhouette and comfortable everyday fit." },
  { name: "Nike Air Force 1", slug: "nike-air-force-1", category: "fashion", price: 9500000, stock: 16, sku: "FASH-NAF1", featured: true, description: "An iconic low-top sneaker in durable leather with a crisp, versatile finish." },
  { name: "Men's Tailored Linen Shirt", slug: "mens-tailored-linen-shirt", category: "fashion", price: 2700000, stock: 32, sku: "FASH-LIN01", featured: false, description: "A breathable tailored shirt made for warm weather and polished everyday styling." },
  { name: "Minimal Leather Tote", slug: "minimal-leather-tote", category: "fashion", price: 6800000, salePrice: 6100000, stock: 12, sku: "FASH-TOT01", featured: false, description: "A structured leather-look tote with an organised interior and modern proportions." },
  { name: "Nordic Lounge Chair", slug: "nordic-lounge-chair", category: "home-and-living", price: 14500000, stock: 7, sku: "HOME-NLC01", featured: true, description: "A compact lounge chair with supportive cushioning and warm, minimalist lines." },
  { name: "Electric Blender 1.5L", slug: "electric-blender-15l", category: "home-and-living", price: 4200000, salePrice: 3690000, stock: 20, sku: "HOME-BLD15", featured: false, description: "A powerful kitchen blender for smoothies, soups, sauces, and everyday food preparation." },
  { name: "Premium 8-Piece Bedding Set", slug: "premium-8-piece-bedding-set", category: "home-and-living", price: 7800000, stock: 15, sku: "HOME-BED08", featured: true, description: "A soft, complete bedding set designed for comfort and an elegant bedroom finish." },
  { name: "Modern Table Lamp", slug: "modern-table-lamp", category: "home-and-living", price: 3400000, stock: 26, sku: "HOME-LMP01", featured: false, description: "A refined metal table lamp that provides warm ambient lighting with a contemporary profile." },
];

const productImages: Record<string, string> = {
  "samsung-galaxy-a55": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85",
  "apple-iphone-15": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=85",
  "sony-wh-1000xm5": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=1200&q=85",
  "hp-pavilion-15-laptop": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85",
  "classic-ankara-print-dress": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85",
  "nike-air-force-1": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
  "mens-tailored-linen-shirt": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85",
  "minimal-leather-tote": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85",
  "nordic-lounge-chair": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85",
  "electric-blender-15l": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=1200&q=85",
  "premium-8-piece-bedding-set": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85",
  "modern-table-lamp": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85",
};

async function main() {
  for (const category of categorySeeds) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        isVisible: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        isVisible: true,
      },
    });
  }

  for (const product of productSeeds) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: product.category },
    });

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice ?? null,
        stock: product.stock,
        sku: product.sku,
        isFeatured: product.featured,
        isPublished: true,
        categoryId: category.id,
        images: JSON.stringify([
          productImages[product.slug],
        ]),
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice ?? null,
        stock: product.stock,
        sku: product.sku,
        isFeatured: product.featured,
        isPublished: true,
        categoryId: category.id,
        images: JSON.stringify([
          productImages[product.slug],
        ]),
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim();

  if (!adminEmail || !adminPassword || !adminName) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set before seeding",
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "GETBUY",
      deliveryFee: 250000,
    },
  });

  console.log("Seeded 3 categories, 12 products, and the administrator.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
