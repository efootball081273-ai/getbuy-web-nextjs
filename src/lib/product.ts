export function parseProductImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed.filter((image) => typeof image === "string") : [];
  } catch {
    return [];
  }
}

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export function getProductPrice(product: {
  price: number;
  salePrice: number | null;
}): number {
  return product.salePrice && product.salePrice > 0
    ? product.salePrice
    : product.price;
}
