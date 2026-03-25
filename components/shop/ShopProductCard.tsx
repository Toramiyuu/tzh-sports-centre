"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { ShopProduct } from "@/lib/shop-config";
import { ProductRevealCard } from "@/components/ui/product-reveal-card";

interface ShopProductCardProps {
  product: ShopProduct;
  onViewDetails: (product: ShopProduct) => void;
}

export const ShopProductCard = memo(function ShopProductCard({
  product,
  onViewDetails,
}: ShopProductCardProps) {
  const t = useTranslations("shop");

  return (
    <ProductRevealCard
      name={product.name}
      price={`RM${product.price.toFixed(0)}`}
      originalPrice={undefined}
      image={product.image}
      description={product.description || `${product.brand} ${product.fullName}`}
      rating={undefined}
      reviewCount={undefined}
      onAdd={() => onViewDetails(product)}
      enableAnimations
      className="w-full"
      badge={
        !product.inStock
          ? t("product.outOfStock")
          : product.featured
            ? t("product.featured")
            : undefined
      }
      badgeVariant={!product.inStock ? "muted" : "primary"}
      brand={product.brand}
      colors={product.colors}
      ctaLabel={t("product.quickView")}
      onCtaClick={() => onViewDetails(product)}
    />
  );
});
