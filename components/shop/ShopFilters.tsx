"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface ShopFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ShopFilters({ searchQuery, onSearchChange }: ShopFiltersProps) {
  const t = useTranslations("shop");

  return (
    <div className="flex gap-3 items-center">
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
    </div>
  );
}
