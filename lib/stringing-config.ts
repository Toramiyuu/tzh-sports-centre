// Stringing Service Configuration
// Contains string inventory, racket models, and brand data

export interface StringProduct {
  id: string
  brand: string
  name: string
  fullName: string
  price: number
  gauge?: string
  type?: string // repulsion, control, durability, all-round
  description?: string
  image?: string
  backImage?: string // Back of packaging showing stats
}

export interface RacketBrand {
  name: string
  models: string[]
}

// Brand colors for placeholder images
export const BRAND_COLORS: Record<string, string> = {
  Yonex: '#00a651',
  Victor: '#003d7a',
  'Li-Ning': '#c8102e',
  Kizuna: '#1e3a5f',
}

// String inventory with fixed prices
export const STRING_INVENTORY: StringProduct[] = [
  // Kizuna
  {
    id: 'kizuna-z58',
    brand: 'Kizuna',
    name: 'Z58 Premium',
    fullName: 'Kizuna Z58 Premium',
    price: 48,
    gauge: '0.58mm',
    type: 'repulsion',
    description: 'Ultra-thin for maximum repulsion power',
    image: '/images/strings/kizuna-z58.jpeg',
    backImage: 'https://e78.us/cdn/shop/products/s-l1600_394x.jpg',
  },
  {
    id: 'kizuna-z61',
    brand: 'Kizuna',
    name: 'Z61 Spiral',
    fullName: 'Kizuna Z61 Spiral',
    price: 50,
    gauge: '0.61mm',
    type: 'control',
    description: 'Spiral texture for enhanced control',
    image: '/images/strings/kizuna-z61.jpg',
    backImage: 'https://e78.us/cdn/shop/products/D61WH_394x.jpg',
  },
  {
    id: 'kizuna-z63x',
    brand: 'Kizuna',
    name: 'Z63X Premium',
    fullName: 'Kizuna Z63X Premium',
    price: 46,
    gauge: '0.63mm',
    type: 'durability',
    description: 'Excellent durability with good feel',
    image: '/images/strings/kizuna-z63x.jpeg',
    backImage: 'https://e78.us/cdn/shop/products/Z63X_b_394x.jpg',
  },

  // Victor
  {
    id: 'victor-vbs61',
    brand: 'Victor',
    name: 'VBS-61',
    fullName: 'Victor VBS-61',
    price: 45,
    gauge: '0.61mm',
    type: 'repulsion',
    description: 'High repulsion for aggressive play',
    image: '/images/strings/victor-vbs61.jpg',
    backImage: 'https://e78.us/cdn/shop/files/116308_1_20240614100001.jpg',
  },
  {
    id: 'victor-vbs63',
    brand: 'Victor',
    name: 'VBS-63',
    fullName: 'Victor VBS-63',
    price: 40,
    gauge: '0.63mm',
    type: 'all-round',
    description: 'Balanced performance for all players',
    image: '/images/strings/victor-vbs63.jpg',
    backImage: 'https://e78.us/cdn/shop/files/VB-S63_b.jpg',
  },
  {
    id: 'victor-vbs66n',
    brand: 'Victor',
    name: 'VBS-66N',
    fullName: 'Victor VBS-66N',
    price: 40,
    gauge: '0.66mm',
    type: 'durability',
    description: 'Enhanced durability for frequent players',
    image: '/images/strings/victor-vbs66n.webp',
    backImage: 'https://e78.us/cdn/shop/products/VBS-66_b.jpg',
  },

  // Li-Ning
  {
    id: 'lining-n58',
    brand: 'Li-Ning',
    name: 'N58',
    fullName: 'Li-Ning N58',
    price: 50,
    gauge: '0.58mm',
    type: 'repulsion',
    description: 'Thin gauge for explosive power',
    image: 'https://www.shopnings.com/media/catalog/product/cache/7604690e2431281e8194543462f8084a/a/4/a46e8b89d5e160f4ea8ed15cce227c21b06fdc1a4e3297b2bc7d8d6caccc8510b38624078f777ed3.jpg',
    backImage: 'https://www.shopnings.com/media/catalog/product/cache/7604690e2431281e8194543462f8084a/n/5/n58_back.jpg',
  },
  {
    id: 'lining-n61',
    brand: 'Li-Ning',
    name: 'N61',
    fullName: 'Li-Ning N61',
    price: 50,
    gauge: '0.61mm',
    type: 'control',
    description: 'Precision control string',
    image: 'https://e78.us/cdn/shop/products/O1CN010tQcr926keSKYCUJ2__27557700.jpg_q50s50.jpg',
    backImage: 'https://e78.us/cdn/shop/products/N61_back.jpg',
  },
  {
    id: 'lining-no1',
    brand: 'Li-Ning',
    name: 'No. 1',
    fullName: 'Li-Ning No. 1',
    price: 47,
    gauge: '0.65mm',
    type: 'all-round',
    description: 'All-round performance string',
    image: 'https://e78.us/cdn/shop/products/O1CN01gOdNm22Gx9TioAJSn__213569081.jpg',
    backImage: 'https://e78.us/cdn/shop/products/No1_back.jpg',
  },

  // Yonex
  {
    id: 'yonex-aerosonic',
    brand: 'Yonex',
    name: 'Aerosonic',
    fullName: 'Yonex Aerosonic',
    price: 52,
    gauge: '0.61mm',
    type: 'repulsion',
    description: 'World\'s thinnest high-performance string',
    image: 'https://www.yonex.com/media/catalog/product/b/g/bgas_011_ex_pac.png',
    backImage: 'https://www.yonex.com/media/wysiwyg/BGAS_chart.jpg',
  },
  {
    id: 'yonex-exbolt63',
    brand: 'Yonex',
    name: 'Exbolt 63',
    fullName: 'Yonex Exbolt 63',
    price: 50,
    gauge: '0.63mm',
    type: 'repulsion',
    description: 'Fast repulsion with sharp feel',
    image: 'https://www.yonex.com/media/catalog/product/b/g/bgxb63_ex_pac.png',
    backImage: 'https://www.yonex.com/media/wysiwyg/BGXB63_chart.jpg',
  },
  {
    id: 'yonex-exbolt65',
    brand: 'Yonex',
    name: 'Exbolt 65',
    fullName: 'Yonex Exbolt 65',
    price: 48,
    gauge: '0.65mm',
    type: 'all-round',
    description: 'Balanced power and control',
    image: 'https://www.yonex.com/media/catalog/product/b/g/bgxb65_ex_pac_003.png',
    backImage: 'https://www.yonex.com/media/wysiwyg/BGXB65_chart.jpg',
  },
  {
    id: 'yonex-exbolt68',
    brand: 'Yonex',
    name: 'Exbolt 68',
    fullName: 'Yonex Exbolt 68',
    price: 46,
    gauge: '0.68mm',
    type: 'durability',
    description: 'Durable with consistent performance',
    image: 'https://www.yonex.com/media/catalog/product/b/g/bgxb68_ex_pac_686.png',
    backImage: 'https://www.yonex.com/media/wysiwyg/BGXB68_chart.jpg',
  },
  {
    id: 'yonex-bg66ultimax',
    brand: 'Yonex',
    name: 'BG66 Ultimax',
    fullName: 'Yonex BG66 Ultimax',
    price: 48,
    gauge: '0.65mm',
    type: 'control',
    description: 'Sharp feeling with high repulsion',
    image: 'https://www.yonex.com/media/catalog/product/b/g/bg66um_ex_pac.png',
    backImage: 'https://www.yonex.com/media/wysiwyg/BG66UM_chart.jpg',
  },
  {
    id: 'yonex-bg80',
    brand: 'Yonex',
    name: 'BG80',
    fullName: 'Yonex BG80',
    price: 52,
    gauge: '0.68mm',
    type: 'control',
    description: 'Hard feeling for precise control',
    image: 'https://www.yonex.com/media/catalog/product/b/g/bg80yx_011-1.png',
    backImage: 'https://www.yonex.com/media/wysiwyg/BG80_chart.jpg',
  },
  {
    id: 'yonex-bg80power',
    brand: 'Yonex',
    name: 'BG80 Power',
    fullName: 'Yonex BG80 Power',
    price: 54,
    gauge: '0.68mm',
    type: 'repulsion',
    description: 'Maximum power and control',
    image: 'https://www.yonex.com/media/catalog/product/b/g/bg80p_ex_pac_221006.png',
    backImage: 'https://www.yonex.com/media/wysiwyg/BG80P_chart.jpg',
  },
  {
    id: 'yonex-bg5',
    brand: 'Yonex',
    name: 'BG5 Match',
    fullName: 'Yonex BG5 Match',
    price: 33,
    gauge: '0.78mm',
    type: 'durability',
    description: 'Entry-level durable string',
    image: 'https://cdn.store-assets.com/s/964873/i/44290689.jpg',
    backImage: 'https://www.yonex.com/media/wysiwyg/BG5_chart.jpg',
  },
  {
    id: 'yonex-bg65',
    brand: 'Yonex',
    name: 'BG65',
    fullName: 'Yonex BG65',
    price: 35,
    gauge: '0.70mm',
    type: 'durability',
    description: 'Classic all-round durability',
    image: 'https://www.yonex.com/media/catalog/product/b/g/bg65_ex_pac.png',
    backImage: 'https://www.yonex.com/media/wysiwyg/BG65_chart.jpg',
  },
]

// Racket models grouped by brand
export const RACKET_BRANDS: RacketBrand[] = [
  {
    name: 'Yonex',
    models: [
      'Astrox 88D Pro',
      'Astrox 88S Pro',
      'Astrox 99 Pro',
      'Astrox 100ZZ',
      'Arcsaber 11 Pro',
      'Nanoflare 700',
      'Nanoflare 800',
      'Nanoflare 1000Z',
      'Duora 10',
      'Voltric Z-Force II',
    ],
  },
  {
    name: 'Victor',
    models: [
      'Thruster K Falcon',
      'Thruster F Claw',
      'DriveX 10',
      'Auraspeed 90K',
      'Auraspeed 100X',
      'Brave Sword 12',
      'Jetspeed S12',
    ],
  },
  {
    name: 'Li-Ning',
    models: [
      'Axforce 80',
      'Axforce 90',
      'Aeronaut 9000',
      'Bladex 900 Moon Max',
      'Halbertec 9000',
      'Turbocharging 75',
    ],
  },
  {
    name: 'Apacs',
    models: [
      'Ferocious Lite',
      'Lethal 9',
      'Z-Ziggler',
      'Fantala 6.0',
      'Virtuoso Pro',
    ],
  },
]

// Get all unique brands from inventory
export function getUniqueBrands(): string[] {
  return [...new Set(STRING_INVENTORY.map((s) => s.brand))]
}

// Get strings by brand
export function getStringsByBrand(brand: string): StringProduct[] {
  return STRING_INVENTORY.filter((s) => s.brand === brand)
}

// Get string by ID
export function getStringById(id: string): StringProduct | undefined {
  return STRING_INVENTORY.find((s) => s.id === id)
}

// Get price range from inventory
export function getPriceRange(): { min: number; max: number } {
  const prices = STRING_INVENTORY.map((s) => s.price)
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }
}

// Filter strings by criteria
export function filterStrings(options: {
  search?: string
  brands?: string[]
  minPrice?: number
  maxPrice?: number
  type?: string
}): StringProduct[] {
  return STRING_INVENTORY.filter((s) => {
    // Search filter
    if (options.search) {
      const searchLower = options.search.toLowerCase()
      if (
        !s.name.toLowerCase().includes(searchLower) &&
        !s.fullName.toLowerCase().includes(searchLower) &&
        !s.brand.toLowerCase().includes(searchLower)
      ) {
        return false
      }
    }

    // Brand filter
    if (options.brands && options.brands.length > 0) {
      if (!options.brands.includes(s.brand)) {
        return false
      }
    }

    // Price range filter
    if (options.minPrice !== undefined && s.price < options.minPrice) {
      return false
    }
    if (options.maxPrice !== undefined && s.price > options.maxPrice) {
      return false
    }

    // Type filter
    if (options.type && s.type !== options.type) {
      return false
    }

    return true
  })
}

// Default tension recommendations
export const DEFAULT_TENSION = {
  main: 25,
  cross: 27,
  minTension: 18,
  maxTension: 35,
}
