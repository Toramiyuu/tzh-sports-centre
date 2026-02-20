"use client";

import { useTranslations } from "next-intl";
import { SHOP_CATEGORIES, ShopCategoryId } from "@/lib/shop-config";
import {
  Swords,
  Footprints,
  Briefcase,
  Shirt,
  Grip,
  Bird,
  Package,
  CircleDot,
  LayoutGrid,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  Swords,
  Footprints,
  Briefcase,
  Shirt,
  Grip,
  Bird,
  Package,
  CircleDot,
};

interface ShopCategoryTabsProps {
  selectedCategory: ShopCategoryId | "all" | "stringing";
  onCategoryChange: (category: ShopCategoryId | "all" | "stringing") => void;
}

export function ShopCategoryTabs({
  selectedCategory,
  onCategoryChange,
}: ShopCategoryTabsProps) {
  const t = useTranslations("shop");

  return (
    <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-1.5">
          {/* All category */}
          <button
            onClick={() => onCategoryChange("all")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full font-medium text-xs whitespace-nowrap transition-all",
              selectedCategory === "all"
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border",
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {t("categories.all")}
          </button>

          {/* Category tabs */}
          {SHOP_CATEGORIES.map((category) => {
            const Icon = iconMap[category.icon] || Package;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full font-medium text-xs whitespace-nowrap transition-all",
                  selectedCategory === category.id
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t(`categories.${category.id}`)}
              </button>
            );
          })}

          {/* Stringing Service tab */}
          <button
            onClick={() => onCategoryChange("stringing")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full font-medium text-xs whitespace-nowrap transition-all",
              selectedCategory === "stringing"
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border",
            )}
          >
            <Wrench className="w-3.5 h-3.5" />
            {t("categories.stringing")}
          </button>
        </div>
      </div>
    </div>
  );
}
