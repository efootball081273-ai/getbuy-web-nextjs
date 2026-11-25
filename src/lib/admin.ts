import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      role: "ADMIN",
      isActive: true,
    },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) redirect("/account");
  return user;
}

export async function requireCustomer() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      role: "CUSTOMER",
      isActive: true,
    },
    select: { id: true, name: true, email: true, phone: true },
  });
  if (!user) redirect("/login");
  return user;
}
