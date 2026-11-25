import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const setting = await prisma.storeSetting.findUnique({
    where: { id: "default" },
    select: { deliveryFee: true },
  });
  return NextResponse.json({ deliveryFee: setting?.deliveryFee ?? 0 });
}
