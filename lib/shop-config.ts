export interface ShopProduct {
  id: string;
  category: ShopCategoryId;
  subcategory?: string;
  brand: string;
  name: string;
  fullName: string;
  price: number;
  description?: string;
  specs?: Record<string, string>;
  image: string;
  images?: string[];
  colors?: string[];
  colorImages?: Record<string, string>;
  sizes?: string[];
  inStock: boolean;
  featured?: boolean;
}

export type ShopCategoryId =
  | "rackets"
  | "shoes"
  | "bags"
  | "clothing"
  | "grips"
  | "shuttlecocks"
  | "accessories"
  | "pickleball";

export interface ShopCategory {
  id: ShopCategoryId;
  name: string;
  nameZh: string;
  icon: string;
  description: string;
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    id: "rackets",
    name: "Rackets",
    nameZh: "球拍",
    icon: "Swords",
    description: "Badminton rackets from top brands",
  },
  {
    id: "shoes",
    name: "Shoes",
    nameZh: "球鞋",
    icon: "Footprints",
    description: "Court shoes for badminton and pickleball",
  },
  {
    id: "bags",
    name: "Bags",
    nameZh: "包包",
    icon: "Briefcase",
    description: "Racket bags, backpacks, and tournament bags",
  },
  {
    id: "clothing",
    name: "Clothing",
    nameZh: "服装",
    icon: "Shirt",
    description: "Jerseys, shorts, and sportswear",
  },
  {
    id: "grips",
    name: "Grips",
    nameZh: "手胶",
    icon: "Grip",
    description: "Replacement grips and overgrips",
  },
  {
    id: "shuttlecocks",
    name: "Shuttlecocks",
    nameZh: "羽毛球",
    icon: "Bird",
    description: "Feather and nylon shuttlecocks for training and competition",
  },
  {
    id: "accessories",
    name: "Accessories",
    nameZh: "配件",
    icon: "Package",
    description: "Wristbands, knee guards, strings, and more",
  },
  {
    id: "pickleball",
    name: "Pickleball",
    nameZh: "匹克球",
    icon: "CircleDot",
    description: "Pickleball paddles and gear",
  },
];

export const SHOP_WHATSAPP_NUMBER = "60116868508";

export function getWhatsAppOrderLink(product: ShopProduct): string {
  const message = encodeURIComponent(
    `Hi TZH! I'm interested in ordering:\n🏸 ${product.fullName} - RM${product.price}\nCategory: ${getCategoryName(product.category)}\n\nPlease let me know about availability!`,
  );
  return `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${message}`;
}

export function getCategoryName(categoryId: ShopCategoryId): string {
  const category = SHOP_CATEGORIES.find((c) => c.id === categoryId);
  return category?.name || categoryId;
}

export function getCategory(
  categoryId: ShopCategoryId,
): ShopCategory | undefined {
  return SHOP_CATEGORIES.find((c) => c.id === categoryId);
}

export function filterByCategory(
  products: ShopProduct[],
  categoryId: ShopCategoryId | "all",
): ShopProduct[] {
  if (categoryId === "all") return products;
  return products.filter((p) => p.category === categoryId);
}

export function searchProducts(
  products: ShopProduct[],
  query: string,
): ShopProduct[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return products;
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.fullName.toLowerCase().includes(lowerQuery) ||
      p.brand.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery),
  );
}

export function filterByBrands(
  products: ShopProduct[],
  brands: string[],
): ShopProduct[] {
  if (brands.length === 0) return products;
  return products.filter((p) => brands.includes(p.brand));
}

export function filterByPriceRange(
  products: ShopProduct[],
  min: number,
  max: number,
): ShopProduct[] {
  return products.filter((p) => p.price >= min && p.price <= max);
}

export function getAllBrands(products: ShopProduct[]): string[] {
  const brands = new Set(products.map((p) => p.brand));
  return Array.from(brands).sort();
}

export function getFeaturedProducts(products: ShopProduct[]): ShopProduct[] {
  return products.filter((p) => p.featured && p.inStock);
}

// TODO: Replace images with actual product photos
export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: "racket-001",
    category: "rackets",
    brand: "Yonex",
    name: "Astrox 99 Pro",
    fullName: "Yonex Astrox 99 Pro",
    price: 799,
    description:
      "Professional-grade attacking racket with Rotational Generator System for maximum power.",
    specs: {
      Weight: "4U (83g)",
      Balance: "Head Heavy",
      Flex: "Stiff",
      "Max Tension": "30 lbs",
    },
    image: "/images/shop/rackets/astrox-99-pro.jpg", // TODO: Replace with actual image
    colors: ["Cherry Sunburst", "White Tiger"],
    inStock: true,
    featured: true,
  },
  {
    id: "racket-002",
    category: "rackets",
    brand: "Victor",
    name: "Thruster K 9900",
    fullName: "Victor Thruster K 9900",
    price: 650,
    description:
      "High-end power racket used by professional players worldwide.",
    specs: {
      Weight: "3U (85g)",
      Balance: "Head Heavy",
      Flex: "Stiff",
      "Max Tension": "31 lbs",
    },
    image: "/images/shop/rackets/thruster-k9900.jpg", // TODO: Replace with actual image
    colors: ["Black/Gold"],
    inStock: true,
    featured: true,
  },
  {
    id: "racket-003",
    category: "rackets",
    brand: "Li-Ning",
    name: "Axforce 80",
    fullName: "Li-Ning Axforce 80",
    price: 580,
    description:
      "Balanced performance racket with excellent control and power.",
    specs: {
      Weight: "4U (83g)",
      Balance: "Slightly Head Heavy",
      Flex: "Medium",
      "Max Tension": "30 lbs",
    },
    image: "/images/shop/rackets/axforce-80.jpg", // TODO: Replace with actual image
    colors: ["Blue/White", "Red/Black"],
    inStock: true,
  },
  {
    id: "racket-004",
    category: "rackets",
    brand: "Yonex",
    name: "Nanoflare 800",
    fullName: "Yonex Nanoflare 800",
    price: 720,
    description: "Speed-focused racket for fast-paced doubles play.",
    specs: {
      Weight: "4U (83g)",
      Balance: "Head Light",
      Flex: "Extra Stiff",
      "Max Tension": "29 lbs",
    },
    image: "/images/shop/rackets/nanoflare-800.jpg", // TODO: Replace with actual image
    colors: ["Matte Black"],
    inStock: true,
  },
  {
    id: "racket-005",
    category: "rackets",
    brand: "Apacs",
    name: "Feather Weight 75",
    fullName: "Apacs Feather Weight 75",
    price: 280,
    description:
      "Ultra-lightweight racket perfect for beginners and intermediate players.",
    specs: {
      Weight: "5U (75g)",
      Balance: "Even Balance",
      Flex: "Medium",
      "Max Tension": "35 lbs",
    },
    image: "/images/shop/rackets/apacs-fw75.jpg", // TODO: Replace with actual image
    colors: ["White/Blue", "Black/Red"],
    inStock: true,
  },

  {
    id: "shoes-001",
    category: "shoes",
    brand: "Yonex",
    name: "Power Cushion 65 Z3",
    fullName: "Yonex Power Cushion 65 Z3",
    price: 499,
    description:
      "Professional badminton shoes with superior cushioning and stability.",
    specs: {
      Upper: "Synthetic Leather + Mesh",
      Midsole: "Power Cushion+",
      Outsole: "Rubber",
    },
    image: "/images/shop/shoes/pc65z3.jpg", // TODO: Replace with actual image
    colors: ["White/Red", "Black/Yellow"],
    sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"],
    inStock: true,
    featured: true,
  },
  {
    id: "shoes-002",
    category: "shoes",
    brand: "Victor",
    name: "A970 Ace",
    fullName: "Victor A970 Ace",
    price: 450,
    description: "Tournament-grade court shoes with ENERGYMAX technology.",
    specs: {
      Upper: "PU Leather + Double Mesh",
      Midsole: "ENERGYMAX",
      Outsole: "VSR Rubber",
    },
    image: "/images/shop/shoes/victor-a970.jpg", // TODO: Replace with actual image
    colors: ["White/Blue", "Black"],
    sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"],
    inStock: true,
  },
  {
    id: "shoes-003",
    category: "shoes",
    brand: "Li-Ning",
    name: "Ranger TD",
    fullName: "Li-Ning Ranger TD",
    price: 380,
    description: "Durable and comfortable court shoes for all-day play.",
    specs: {
      Upper: "TPU + Mesh",
      Midsole: "Bounse+",
      Outsole: "Tough GR",
    },
    image: "/images/shop/shoes/lining-ranger.jpg", // TODO: Replace with actual image
    colors: ["White/Green", "Navy/Orange"],
    sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"],
    inStock: true,
  },
  {
    id: "shoes-004",
    category: "shoes",
    brand: "Yonex",
    name: "Power Cushion Aerus Z2",
    fullName: "Yonex Power Cushion Aerus Z2",
    price: 550,
    description: "Lightweight performance shoes weighing only 260g.",
    specs: {
      Upper: "Double Raschel Mesh",
      Midsole: "Power Cushion+",
      Weight: "260g (Size 9)",
    },
    image: "/images/shop/shoes/aerus-z2.jpg", // TODO: Replace with actual image
    colors: ["Mint Blue", "Light Gray"],
    sizes: ["US 7", "US 8", "US 9", "US 10"],
    inStock: true,
  },

  {
    id: "bags-001",
    category: "bags",
    brand: "Yonex",
    name: "Pro Tournament Bag",
    fullName: "Yonex Pro Tournament Bag 92031",
    price: 299,
    description:
      "Large tournament bag with 3 main compartments, fits up to 9 rackets.",
    specs: {
      Capacity: "9 Rackets",
      Compartments: "3 Main + Accessories",
      Size: "75 x 33 x 24 cm",
    },
    image: "/images/shop/bags/yonex-92031.jpg", // TODO: Replace with actual image
    colors: ["Black/Yellow", "Navy/Red"],
    inStock: true,
    featured: true,
  },
  {
    id: "bags-002",
    category: "bags",
    brand: "Victor",
    name: "6 Racket Bag",
    fullName: "Victor BR9211 6 Racket Bag",
    price: 180,
    description:
      "Versatile racket bag with shoe compartment and padded straps.",
    specs: {
      Capacity: "6 Rackets",
      Compartments: "2 Main + Shoe",
      Size: "72 x 33 x 22 cm",
    },
    image: "/images/shop/bags/victor-br9211.jpg", // TODO: Replace with actual image
    colors: ["Black", "Blue/White"],
    inStock: true,
  },
  {
    id: "bags-003",
    category: "bags",
    brand: "Li-Ning",
    name: "Backpack Pro",
    fullName: "Li-Ning Backpack ABSQ088",
    price: 150,
    description: "Sporty backpack with racket holder and laptop compartment.",
    specs: {
      Capacity: "2-3 Rackets",
      Features: "Laptop Sleeve, Water Bottle Pocket",
      Size: "50 x 32 x 18 cm",
    },
    image: "/images/shop/bags/lining-backpack.jpg", // TODO: Replace with actual image
    colors: ["Black/Red", "Gray/Blue"],
    inStock: true,
  },
  {
    id: "bags-004",
    category: "bags",
    brand: "Yonex",
    name: "Team Racket Bag",
    fullName: "Yonex Team Racket Bag 42326",
    price: 120,
    description: "Compact 6-pack bag perfect for casual players.",
    specs: {
      Capacity: "6 Rackets",
      Compartments: "2 Main",
      Size: "75 x 24 x 9 cm",
    },
    image: "/images/shop/bags/yonex-42326.jpg", // TODO: Replace with actual image
    colors: ["Black", "Deep Blue"],
    inStock: true,
  },

  {
    id: "clothing-001",
    category: "clothing",
    brand: "Yonex",
    name: "Game Shirt",
    fullName: "Yonex Men's Game Shirt",
    price: 120,
    description: "Quick-dry tournament shirt with moisture-wicking technology.",
    specs: {
      Material: "Polyester",
      Technology: "Very Cool Dry",
      Fit: "Regular",
    },
    image: "/images/shop/clothing/yonex-shirt.jpg", // TODO: Replace with actual image
    colors: ["White", "Black", "Navy", "Red"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    inStock: true,
  },
  {
    id: "clothing-002",
    category: "clothing",
    brand: "Victor",
    name: "Training Shorts",
    fullName: "Victor Knitted Shorts",
    price: 85,
    description: "Comfortable training shorts with side pockets.",
    specs: {
      Material: "Polyester Knit",
      Features: "Side Pockets, Elastic Waist",
      Fit: "Regular",
    },
    image: "/images/shop/clothing/victor-shorts.jpg", // TODO: Replace with actual image
    colors: ["Black", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
  },
  {
    id: "clothing-003",
    category: "clothing",
    brand: "Li-Ning",
    name: "Competition Jersey",
    fullName: "Li-Ning AAYT033 Competition Jersey",
    price: 99,
    description: "Lightweight competition jersey with AT DRY technology.",
    specs: {
      Material: "Polyester",
      Technology: "AT DRY",
      Fit: "Slim",
    },
    image: "/images/shop/clothing/lining-jersey.jpg", // TODO: Replace with actual image
    colors: ["White/Blue", "Black/Gold", "Red/White"],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
  },
  {
    id: "clothing-004",
    category: "clothing",
    brand: "Yonex",
    name: "Skort",
    fullName: "Yonex Women's Skort",
    price: 110,
    description: "Stylish skort with built-in shorts for comfort and coverage.",
    specs: {
      Material: "Polyester/Spandex",
      Features: "Built-in Shorts, Ball Pocket",
      Fit: "Regular",
    },
    image: "/images/shop/clothing/yonex-skort.jpg", // TODO: Replace with actual image
    colors: ["White", "Black", "Navy"],
    sizes: ["XS", "S", "M", "L"],
    inStock: true,
  },

  {
    id: "grips-001",
    category: "grips",
    brand: "Yonex",
    name: "Super Grap",
    fullName: "Yonex Super Grap AC102 (3 pack)",
    price: 22,
    description:
      "The most popular overgrip in the world. Excellent tackiness and absorbency.",
    specs: {
      Type: "Overgrip",
      Thickness: "0.6mm",
      Quantity: "3 pieces",
    },
    image: "/images/shop/grips/super-grap.jpg", // TODO: Replace with actual image
    colors: ["White", "Black", "Yellow", "Pink"],
    inStock: true,
    featured: true,
  },
  {
    id: "grips-002",
    category: "grips",
    brand: "Yonex",
    name: "Towel Grip",
    fullName: "Yonex Towel Grip AC402",
    price: 18,
    description: "Cotton towel grip for maximum sweat absorption.",
    specs: {
      Type: "Replacement Grip",
      Material: "Cotton Towel",
      Quantity: "1 piece",
    },
    image: "/images/shop/grips/towel-grip.jpg", // TODO: Replace with actual image
    colors: ["White", "Yellow", "Red"],
    inStock: true,
  },
  {
    id: "grips-003",
    category: "grips",
    brand: "Victor",
    name: "Fishbone Grip",
    fullName: "Victor Fishbone Grip GR262",
    price: 12,
    description:
      "Durable overgrip with unique fishbone texture for enhanced grip.",
    specs: {
      Type: "Overgrip",
      Thickness: "0.6mm",
      Quantity: "1 piece",
    },
    image: "/images/shop/grips/fishbone-grip.jpg", // TODO: Replace with actual image
    colors: ["White", "Black"],
    inStock: true,
  },
  {
    id: "grips-004",
    category: "grips",
    brand: "Li-Ning",
    name: "GP1000 Overgrip",
    fullName: "Li-Ning GP1000 Overgrip (5 pack)",
    price: 25,
    description: "Value pack of quality overgrips with good tackiness.",
    specs: {
      Type: "Overgrip",
      Thickness: "0.5mm",
      Quantity: "5 pieces",
    },
    image: "/images/shop/grips/gp1000.jpg", // TODO: Replace with actual image
    colors: ["White", "Black", "Assorted"],
    inStock: true,
  },

  {
    id: "shuttle-001",
    category: "shuttlecocks",
    brand: "Yonex",
    name: "AS-50",
    fullName: "Yonex Aerosensa 50 (12 pcs)",
    price: 120,
    description:
      "Tournament-grade feather shuttlecocks used in international competitions. Excellent durability and consistent flight.",
    specs: {
      Type: "Feather (Goose)",
      Speed: "77 / 78",
      Quantity: "12 pieces",
      Grade: "Tournament",
    },
    image: "/images/shop/shuttlecocks/as50.jpg",
    inStock: true,
    featured: true,
  },
  {
    id: "shuttle-002",
    category: "shuttlecocks",
    brand: "Yonex",
    name: "AS-30",
    fullName: "Yonex Aerosensa 30 (12 pcs)",
    price: 85,
    description:
      "Training-grade feather shuttlecocks with good durability and flight consistency.",
    specs: {
      Type: "Feather (Goose)",
      Speed: "77 / 78",
      Quantity: "12 pieces",
      Grade: "Training",
    },
    image: "/images/shop/shuttlecocks/as30.jpg",
    inStock: true,
  },
  {
    id: "shuttle-003",
    category: "shuttlecocks",
    brand: "Victor",
    name: "Gold Champion",
    fullName: "Victor Gold Champion (12 pcs)",
    price: 95,
    description:
      "Premium feather shuttlecocks with excellent flight stability and durability.",
    specs: {
      Type: "Feather (Goose)",
      Speed: "77 / 78",
      Quantity: "12 pieces",
      Grade: "Tournament",
    },
    image: "/images/shop/shuttlecocks/gold-champion.jpg",
    inStock: true,
  },
  {
    id: "shuttle-004",
    category: "shuttlecocks",
    brand: "Li-Ning",
    name: "A+300",
    fullName: "Li-Ning A+300 (12 pcs)",
    price: 72,
    description:
      "Quality feather shuttlecocks for club play and training sessions.",
    specs: {
      Type: "Feather (Goose)",
      Speed: "77 / 78",
      Quantity: "12 pieces",
      Grade: "Club",
    },
    image: "/images/shop/shuttlecocks/a300.jpg",
    inStock: true,
  },
  {
    id: "shuttle-005",
    category: "shuttlecocks",
    brand: "Yonex",
    name: "Mavis 350",
    fullName: "Yonex Mavis 350 Nylon (6 pcs)",
    price: 38,
    description:
      "Durable nylon shuttlecocks ideal for practice and recreational play. Long-lasting alternative to feather.",
    specs: {
      Type: "Nylon",
      Speed: "Medium",
      Quantity: "6 pieces",
      Grade: "Practice",
    },
    image: "/images/shop/shuttlecocks/mavis350.jpg",
    colors: ["Yellow", "White"],
    inStock: true,
  },

  {
    id: "acc-001",
    category: "accessories",
    subcategory: "strings",
    brand: "Yonex",
    name: "BG65 String",
    fullName: "Yonex BG65 Badminton String (10m)",
    price: 28,
    description:
      "All-round string offering excellent durability and repulsion.",
    specs: {
      Gauge: "0.70mm",
      Length: "10m",
      Type: "Multifilament",
    },
    image: "/images/shop/accessories/bg65.jpg", // TODO: Replace with actual image
    colors: ["White", "Yellow"],
    inStock: true,
    featured: true,
  },
  {
    id: "acc-002",
    category: "accessories",
    subcategory: "strings",
    brand: "Victor",
    name: "VS-850",
    fullName: "Victor VS-850 String (10m)",
    price: 32,
    description: "High repulsion string for powerful smashes.",
    specs: {
      Gauge: "0.68mm",
      Length: "10m",
      Type: "Multifilament",
    },
    image: "/images/shop/accessories/vs850.jpg", // TODO: Replace with actual image
    colors: ["White", "Pink"],
    inStock: true,
  },
  {
    id: "acc-003",
    category: "accessories",
    subcategory: "wrist-guard",
    brand: "Li-Ning",
    name: "Wrist Support",
    fullName: "Li-Ning K11 Wrist Support",
    price: 35,
    description: "Compression wrist support for injury prevention.",
    specs: {
      Material: "Nylon/Spandex",
      Size: "One Size",
    },
    image: "/images/shop/accessories/wrist-support.jpg", // TODO: Replace with actual image
    colors: ["Black", "White"],
    inStock: true,
  },
  {
    id: "acc-004",
    category: "accessories",
    subcategory: "towel",
    brand: "Yonex",
    name: "Sports Towel",
    fullName: "Yonex Sports Towel AC1109",
    price: 45,
    description: "Quick-dry cotton towel with Yonex logo.",
    specs: {
      Material: "100% Cotton",
      Size: "40 x 100 cm",
    },
    image: "/images/shop/accessories/sports-towel.jpg", // TODO: Replace with actual image
    colors: ["White/Blue", "White/Red"],
    inStock: true,
  },
  {
    id: "acc-005",
    category: "accessories",
    subcategory: "socks",
    brand: "Yonex",
    name: "Sports Socks",
    fullName: "Yonex Sports Socks 19120 (3 pairs)",
    price: 38,
    description: "Thick cushioned sports socks for comfort and support.",
    specs: {
      Material: "Cotton Blend",
      Quantity: "3 pairs",
    },
    image: "/images/shop/accessories/sports-socks.jpg", // TODO: Replace with actual image
    colors: ["White", "Black"],
    sizes: ["M (25-27cm)", "L (28-30cm)"],
    inStock: true,
  },
  {
    id: "acc-006",
    category: "accessories",
    subcategory: "knee-guard",
    brand: "Victor",
    name: "Knee Pad",
    fullName: "Victor SP193 Knee Pad",
    price: 55,
    description: "Protective knee pad with gel cushioning.",
    specs: {
      Material: "Neoprene",
      Features: "Gel Cushioning, Breathable",
    },
    image: "/images/shop/accessories/knee-pad.jpg", // TODO: Replace with actual image
    colors: ["Black"],
    sizes: ["S", "M", "L"],
    inStock: true,
  },
  {
    id: "acc-007",
    category: "accessories",
    subcategory: "insoles",
    brand: "Yonex",
    name: "Power Cushion Insole",
    fullName: "Yonex Power Cushion Insole AC195",
    price: 65,
    description: "Replacement insoles with Power Cushion technology.",
    specs: {
      Technology: "Power Cushion",
      Material: "EVA",
    },
    image: "/images/shop/accessories/insole.jpg", // TODO: Replace with actual image
    sizes: ["S (25-26)", "M (26.5-27.5)", "L (28-29)"],
    inStock: true,
  },

  {
    id: "pickle-001",
    category: "pickleball",
    brand: "Joola",
    name: "Ben Johns Hyperion",
    fullName: "Joola Ben Johns Hyperion CFS 16mm",
    price: 399,
    description:
      "Pro-level paddle designed with Ben Johns, featuring Carbon Friction Surface.",
    specs: {
      Core: "Reactive Polymer",
      Face: "Carbon Friction Surface",
      Thickness: "16mm",
      Weight: "7.5-8.0 oz",
    },
    image: "/images/shop/pickleball/hyperion.jpg", // TODO: Replace with actual image
    colors: ["Blue/Black"],
    inStock: true,
    featured: true,
  },
  {
    id: "pickle-002",
    category: "pickleball",
    brand: "Selkirk",
    name: "Vanguard Power Air",
    fullName: "Selkirk Vanguard Power Air Invikta",
    price: 350,
    description: "Elongated paddle with excellent power and spin.",
    specs: {
      Core: "Polymer X5",
      Face: "Carbon Fiber",
      Shape: "Elongated",
      Weight: "7.7-8.1 oz",
    },
    image: "/images/shop/pickleball/vanguard.jpg", // TODO: Replace with actual image
    colors: ["White/Blue"],
    inStock: true,
  },
  {
    id: "pickle-003",
    category: "pickleball",
    brand: "Franklin",
    name: "X-40 Pickleballs",
    fullName: "Franklin X-40 Outdoor Pickleballs (12 pack)",
    price: 120,
    description: "Official USAPA approved outdoor pickleballs.",
    specs: {
      Type: "Outdoor",
      Holes: "40",
      Quantity: "12 balls",
      Certification: "USAPA Approved",
    },
    image: "/images/shop/pickleball/x40-balls.jpg", // TODO: Replace with actual image
    colors: ["Yellow", "Neon Green"],
    inStock: true,
  },
  {
    id: "pickle-004",
    category: "pickleball",
    brand: "Head",
    name: "Radical Elite",
    fullName: "Head Radical Elite Paddle",
    price: 180,
    description: "Great entry-level paddle with polymer core.",
    specs: {
      Core: "Polymer",
      Face: "Fiberglass",
      Weight: "8.1 oz",
      Grip: "4.25 inches",
    },
    image: "/images/shop/pickleball/radical-elite.jpg", // TODO: Replace with actual image
    colors: ["Red/Black"],
    inStock: true,
  },
  {
    id: "pickle-005",
    category: "pickleball",
    brand: "Paddletek",
    name: "Bantam EX-L",
    fullName: "Paddletek Bantam EX-L Paddle",
    price: 280,
    description: "Premium paddle with excellent touch and control.",
    specs: {
      Core: "Polymer",
      Face: "Textured Graphite",
      Weight: "7.6-8.0 oz",
      Shape: "Standard",
    },
    image: "/images/shop/pickleball/bantam-exl.jpg", // TODO: Replace with actual image
    colors: ["Blue", "Red"],
    inStock: true,
  },
];

export function getPriceRange(products: ShopProduct[]): {
  min: number;
  max: number;
} {
  if (products.length === 0) return { min: 0, max: 1000 };
  const prices = products.map((p) => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}
