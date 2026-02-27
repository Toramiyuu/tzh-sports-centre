"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Search, X } from "lucide-react";

interface ShopFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priceRange: [number, number];
  priceMin: number;
  priceMax: number;
  onPriceRangeChange: (range: [number, number]) => void;
}

export function ShopFilters({
  searchQuery,
  onSearchChange,
  priceRange,
  priceMin,
  priceMax,
  onPriceRangeChange,
}: ShopFiltersProps) {
  const t = useTranslations("shop");

  const showPriceSlider = priceMax > priceMin;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("filters.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-full"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showPriceSlider && (
        <div className="w-full sm:w-64 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("filters.priceRange")}</span>
            <span className="font-medium text-foreground">
              RM{priceRange[0]} – RM{priceRange[1]}
            </span>
          </div>
          <Slider
            min={priceMin}
            max={priceMax}
            step={1}
            value={priceRange}
            onValueChange={(val) => onPriceRangeChange(val as [number, number])}
          />
        </div>
      )}
    </div>
  );
}
