"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function requiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function wholeNairaToKobo(value: string, allowZero = true) {
  if (!/^\d+$/.test(value)) {
    throw new Error("Enter a whole amount in naira");
  }
  const amount = Number(value);
  if (
    !Number.isSafeInteger(amount) ||
    amount < (allowZero ? 0 : 1) ||
    amount > 1_000_000_000
  ) {
    throw new Error("Enter a valid amount in naira");
  }
  return amount * 100;
}

function nonNegativeInteger(value: string, field: string) {
  if (!/^\d+$/.test(value)) throw new Error(`${field} must be a whole non-negative number`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > 1_000_000) {
    throw new Error(`${field} is outside the allowed range`);
  }
  return parsed;
}

function imageList(value: string) {
  const urls = value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
  if (urls.length === 0) throw new Error("Add at least one product image URL");
  for (const url of urls) {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      (parsed.hostname !== "images.unsplash.com" && parsed.hostname !== "res.cloudinary.com")
    ) {
      throw new Error("Product images must use trusted HTTPS image URLs");
    }
  }
  return JSON.stringify(urls);
}

const productBase = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(5000),
  sku: z.string().trim().min(2).max(80),
  stock: z.number().int().min(0).max(1_000_000),
  categoryId: z.string().min(1),
});

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const parsed = productBase.parse({
    name: requiredText(formData, "name"),
    slug: requiredText(formData, "slug"),
    description: requiredText(formData, "description"),
    sku: requiredText(formData, "sku"),
    stock: nonNegativeInteger(requiredText(formData, "stock"), "Stock"),
    categoryId: requiredText(formData, "categoryId"),
  });
  const price = wholeNairaToKobo(requiredText(formData, "price"), false);
  const saleValue = requiredText(formData, "salePrice");
  const salePrice = saleValue ? wholeNairaToKobo(saleValue, false) : null;
  if (salePrice !== null && (salePrice <= 0 || salePrice >= price)) {
    throw new Error("Sale price must be greater than zero and lower than the regular price");
  }

  await prisma.product.create({
    data: {
      ...parsed,
      price,
      salePrice,
      images: imageList(requiredText(formData, "images")),
      isFeatured: formData.get("isFeatured") === "on",
      isPublished: formData.get("isPublished") === "on",
    },
  });
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  redirect("/admin/products?created=1");
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();
  const id = requiredText(formData, "id");
  const parsed = productBase.parse({
    name: requiredText(formData, "name"),
    slug: requiredText(formData, "slug"),
    description: requiredText(formData, "description"),
    sku: requiredText(formData, "sku"),
    stock: nonNegativeInteger(requiredText(formData, "stock"), "Stock"),
    categoryId: requiredText(formData, "categoryId"),
  });
  const price = wholeNairaToKobo(requiredText(formData, "price"), false);
  const saleValue = requiredText(formData, "salePrice");
  const salePrice = saleValue ? wholeNairaToKobo(saleValue, false) : null;
  if (salePrice !== null && (salePrice <= 0 || salePrice >= price)) {
    throw new Error("Sale price must be greater than zero and lower than the regular price");
  }

  await prisma.product.update({
    where: { id },
    data: {
      ...parsed,
      price,
      salePrice,
      images: imageList(requiredText(formData, "images")),
      isFeatured: formData.get("isFeatured") === "on",
      isPublished: formData.get("isPublished") === "on",
    },
  });
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
}

export async function archiveProduct(formData: FormData) {
  await requireAdmin();
  await prisma.product.update({
    where: { id: requiredText(formData, "id") },
    data: { isPublished: false },
  });
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
}

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(1000),
  image: z.union([z.literal(""), z.url().startsWith("https://")]),
});

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const parsed = categorySchema.parse({
    name: requiredText(formData, "name"),
    slug: requiredText(formData, "slug"),
    description: requiredText(formData, "description"),
    image: requiredText(formData, "image"),
  });
  await prisma.category.create({
    data: {
      ...parsed,
      image: parsed.image || null,
      isVisible: formData.get("isVisible") === "on",
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/categories");
  redirect("/admin/categories?created=1");
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();
  const id = requiredText(formData, "id");
  const parsed = categorySchema.parse({
    name: requiredText(formData, "name"),
    slug: requiredText(formData, "slug"),
    description: requiredText(formData, "description"),
    image: requiredText(formData, "image"),
  });
  await prisma.category.update({
    where: { id },
    data: {
      ...parsed,
      image: parsed.image || null,
      isVisible: formData.get("isVisible") === "on",
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = requiredText(formData, "id");
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new Error("This category still has products. Move or archive them before deleting it.");
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/categories");
}

export async function updateOrderStatus(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = requiredText(formData, "orderId");
  const status = z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]).parse(requiredText(formData, "orderStatus"));

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.orderStatus === status) return;
    await tx.order.update({ where: { id: orderId }, data: { orderStatus: status } });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.orderStatus,
        newStatus: status,
        changedBy: admin.id,
      },
    });
  });
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function setCustomerStatus(formData: FormData) {
  await requireAdmin();
  const id = requiredText(formData, "id");
  const isActive = requiredText(formData, "isActive") === "true";
  await prisma.user.update({
    where: { id, role: "CUSTOMER" },
    data: { isActive },
  });
  revalidatePath("/admin/customers");
}

const settingsSchema = z.object({
  storeName: z.string().trim().min(2).max(100),
  contactEmail: z.union([z.literal(""), z.email()]),
  contactPhone: z.string().trim().max(30),
  logo: z.union([z.literal(""), z.url().startsWith("https://")]),
  policies: z.string().trim().max(5000),
  socialLinks: z.string().trim().max(2000),
});

export async function updateStoreSettings(formData: FormData) {
  await requireAdmin();
  const parsed = settingsSchema.parse({
    storeName: requiredText(formData, "storeName"),
    contactEmail: requiredText(formData, "contactEmail"),
    contactPhone: requiredText(formData, "contactPhone"),
    logo: requiredText(formData, "logo"),
    policies: requiredText(formData, "policies"),
    socialLinks: requiredText(formData, "socialLinks"),
  });
  const deliveryFee = wholeNairaToKobo(requiredText(formData, "deliveryFee"));

  await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {
      ...parsed,
      logo: parsed.logo || null,
      contactEmail: parsed.contactEmail || null,
      contactPhone: parsed.contactPhone || null,
      deliveryFee,
    },
    create: {
      id: "default",
      ...parsed,
      logo: parsed.logo || null,
      contactEmail: parsed.contactEmail || null,
      contactPhone: parsed.contactPhone || null,
      deliveryFee,
    },
  });
  revalidatePath("/");
  revalidatePath("/api/settings");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
