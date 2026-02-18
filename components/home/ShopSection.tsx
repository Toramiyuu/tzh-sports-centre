"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import Image from "next/image";

export function ShopSection() {
  const categories = [
    { name: "Rackets", image: "/images/shop/rackets/harimau.jpg", count: "20+" },
    { name: "Shoes", image: "/images/shop/shoes/xingkong.jpg", count: "15+" },
    { name: "Bags", image: "/images/shop/bags/909.jpg", count: "10+" },
    { name: "Accessories", image: "/images/shop/grips/7cpro.jpg", count: "30+" },
  ];

  return (
    <section className="py-16 md:py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Text + CTA */}
          <div className="animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-forwards">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Pro Shop</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4">
              Gear Up for <br className="hidden md:block" />Your Game
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Browse our collection of rackets, shoes, bags, and accessories from TZH and top brands. Available in-store and online.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {["Yonex", "Li-Ning", "Joola", "Victor"].map((brand) => (
                <span key={brand} className="px-3 py-1 rounded-full text-xs font-medium bg-card border border-border text-muted-foreground">
                  {brand}
                </span>
              ))}
            </div>

            <Link href="/shop">
              <Button className="h-12 px-6 sm:px-8 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg group/btn">
                Browse Shop
                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Right: Category grid */}
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-forwards">
            {categories.map((cat, i) => (
              <Link
                key={cat.name}
                href={`/shop?category=${cat.name.toLowerCase()}`}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-white font-bold text-sm">{cat.name}</div>
                  <div className="text-white/60 text-xs">{cat.count} products</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

