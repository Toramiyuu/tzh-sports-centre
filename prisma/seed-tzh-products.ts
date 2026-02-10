import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

const TZH_PRODUCTS = [
  // ==================== RACKETS ====================
  { productId: 'tzh-racket-8023', category: 'rackets', brand: 'TZH', name: '8023', fullName: 'TZH 8023 Racket', price: 280, description: 'Versatile all-round racket from TZH 8023 series.', image: '/images/shop/rackets/8023.png', colors: json(['Black', 'White']), inStock: true, featured: true },
  { productId: 'tzh-racket-harimau', category: 'rackets', brand: 'TZH', name: 'Harimau Pro', fullName: 'TZH Harimau Pro', price: 350, description: 'Professional-grade racket from the Harimau (Tiger) series.', image: '/images/shop/rackets/harimau.jpg', colors: json(['Black/Gold']), inStock: true, featured: true },
  { productId: 'tzh-racket-kranted', category: 'rackets', brand: 'TZH', name: 'Kranted', fullName: 'TZH Kranted Series', price: 320, description: 'Aggressive power racket from the Kranted (狂徒) series.', image: '/images/shop/rackets/kranted.png', colors: json(['Red/Black']), inStock: true },
  { productId: 'tzh-racket-loveshot', category: 'rackets', brand: 'TZH', name: 'Love Shot', fullName: 'TZH Love Shot', price: 250, description: 'Stylish racket with excellent feel and control.', image: '/images/shop/rackets/loveshot.jpg', colors: json(['Pink/White', 'Blue/White']), inStock: true },
  { productId: 'tzh-racket-macaron', category: 'rackets', brand: 'TZH', name: 'Macaron', fullName: 'TZH Macaron Series', price: 230, description: 'Colorful lightweight racket with smooth handling.', image: '/images/shop/rackets/macaron.jpg', colors: json(['Mint', 'Pink', 'Lavender']), inStock: true },
  { productId: 'tzh-racket-promaks', category: 'rackets', brand: 'TZH', name: 'Promaks', fullName: 'TZH Promaks Hunter Series', price: 380, description: 'High-performance attacking racket from the Promaks series.', image: '/images/shop/rackets/promaks.png', colors: json(['Black/Blue']), inStock: true, featured: true },
  { productId: 'tzh-racket-rm99', category: 'rackets', brand: 'TZH', name: 'RM99', fullName: 'TZH RM99 Series', price: 199, description: 'Great value racket perfect for intermediate players.', image: '/images/shop/rackets/rm99.jpg', colors: json(['Black', 'Blue']), inStock: true },
  { productId: 'tzh-racket-smg', category: 'rackets', brand: 'TZH', name: 'SMG', fullName: 'TZH SMG Assault Series', price: 300, description: 'Fast-paced attack racket from the SMG (冲锋) series.', image: '/images/shop/rackets/smg.jpg', colors: json(['Red/Black', 'Blue/Black']), inStock: true },
  { productId: 'tzh-racket-superlike', category: 'rackets', brand: 'TZH', name: 'Super Like', fullName: 'TZH Super Like', price: 260, description: 'Popular all-round racket loved by recreational players.', image: '/images/shop/rackets/superlike.png', colors: json(['White/Pink', 'White/Blue']), inStock: true },
  { productId: 'tzh-racket-explorer', category: 'rackets', brand: 'TZH', name: 'Uni Explorer', fullName: 'TZH Uni Explorer', price: 360, description: 'Premium exploration series racket with balanced performance.', image: '/images/shop/rackets/explorer.png', colors: json(['Black/Silver']), inStock: true },
  { productId: 'tzh-racket-uns', category: 'rackets', brand: 'TZH', name: 'UNS', fullName: 'TZH UNS Steel Armor Series', price: 340, description: 'Durable and powerful racket from the UNS (钢甲) series.', image: '/images/shop/rackets/uns.png', colors: json(['Gunmetal', 'Black']), inStock: true },
  { productId: 'tzh-racket-lingshe', category: 'rackets', brand: 'TZH', name: 'Ling She', fullName: 'TZH Ling She (凌蛇)', price: 310, description: 'Agile and quick racket with snake-inspired design.', image: '/images/shop/rackets/lingshe.png', colors: json(['Green/Black']), inStock: true },
  { productId: 'tzh-racket-liuyun', category: 'rackets', brand: 'TZH', name: 'Liu Yun', fullName: 'TZH Liu Yun (流云)', price: 290, description: 'Smooth flowing cloud series racket with excellent control.', image: '/images/shop/rackets/liuyun.jpg', colors: json(['White/Blue']), inStock: true },

  // ==================== BAGS ====================
  { productId: 'tzh-bag-909', category: 'bags', brand: 'TZH', name: '909 Waist Bag', fullName: 'TZH 909 Waist Bag', price: 65, description: 'Compact waist bag for essentials during games.', image: '/images/shop/bags/909.jpg', colors: json(['Black', 'Navy']), inStock: true },
  { productId: 'tzh-bag-yuntu', category: 'bags', brand: 'TZH', name: 'Cloud Journey Backpack', fullName: 'TZH Cloud Journey Backpack (云途)', price: 180, description: 'Spacious backpack with racket compartment.', image: '/images/shop/bags/yuntu.jpg', colors: json(['Black', 'Gray']), inStock: true, featured: true },
  { productId: 'tzh-bag-carrot', category: 'bags', brand: 'TZH', name: 'Carrot Shoulder Bag', fullName: 'TZH Carrot Shoulder Bag', price: 85, description: 'Fun carrot-shaped single shoulder bag.', image: '/images/shop/bags/carrot.jpg', colors: json(['Orange', 'Green']), inStock: true },
  { productId: 'tzh-bag-mega', category: 'bags', brand: 'TZH', name: 'Mega Capacity Bag', fullName: 'TZH Mega Capacity Bag (巨能装)', price: 200, description: 'Extra-large racket bag for tournament players.', image: '/images/shop/bags/mega.jpg', colors: json(['Black']), inStock: true },
  { productId: 'tzh-bag-agile', category: 'bags', brand: 'TZH', name: 'Agile Shoulder Bag', fullName: 'TZH Agile Shoulder Bag (灵动者)', price: 95, description: 'Lightweight shoulder bag for casual play.', image: '/images/shop/bags/agile.png', colors: json(['Black', 'Blue']), inStock: true },
  { productId: 'tzh-bag-classic', category: 'bags', brand: 'TZH', name: 'Classic Square Bag', fullName: 'TZH Classic Square Bag (经典四方包)', price: 150, description: 'Timeless square racket bag with 6-racket capacity.', image: '/images/shop/bags/classic.jpg', colors: json(['Black', 'Navy']), inStock: true },
  { productId: 'tzh-bag-space', category: 'bags', brand: 'TZH', name: 'Space Collab Bag', fullName: 'TZH Space Collaboration Bag (航天联名)', price: 220, description: 'Limited edition space-themed collaboration bag.', image: '/images/shop/bags/space.jpg', colors: json(['White/Blue']), inStock: true },
  { productId: 'tzh-bag-ultra', category: 'bags', brand: 'TZH', name: 'Ultra Capacity Bag', fullName: 'TZH Ultra Capacity Bag (超能装)', price: 190, description: 'Large tournament bag with multiple compartments.', image: '/images/shop/bags/ultra.jpg', colors: json(['Black', 'Red']), inStock: true },
  { productId: 'tzh-bag-qingke', category: 'bags', brand: 'TZH', name: 'Qingke Backpack', fullName: 'TZH Qingke Backpack (轻氪)', price: 160, description: 'Modern backpack with sleek design.', image: '/images/shop/bags/qingke.jpg', colors: json(['Black', 'Gray']), inStock: true },
  { productId: 'tzh-bag-feather', category: 'bags', brand: 'TZH', name: 'Feather Backpack', fullName: 'TZH Feather Backpack (轻羽者)', price: 170, description: 'Ultra-light backpack designed for badminton players.', image: '/images/shop/bags/feather.jpg', colors: json(['Black', 'White']), inStock: true },
  { productId: 'tzh-bag-tiger', category: 'bags', brand: 'TZH', name: 'Malay Tiger Bag', fullName: 'TZH Malay Tiger Bag (马来虎)', price: 200, description: 'Premium Malaysian tiger-themed racket bag.', image: '/images/shop/bags/tiger.jpg', colors: json(['Black/Gold']), inStock: true, featured: true },

  // ==================== SHOES ====================
  { productId: 'tzh-shoes-xingkong', category: 'shoes', brand: 'PR IND', name: 'Xingkong', fullName: 'PR IND Xingkong Badminton Shoes (行空)', price: 299, description: 'Professional badminton shoes with PU + fabric upper, EVA midsole.', image: '/images/shop/shoes/xingkong.jpg', colors: json(['Morning Light (晨光)', 'Night Shadow (夜影)']), sizes: json(['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']), inStock: true, featured: true },

  // ==================== CLOTHING ====================
  { productId: 'tzh-cloth-1080skort', category: 'clothing', brand: 'TZH', name: '1080 Skort', fullName: 'TZH 1080 Skort', price: 85, description: 'Comfortable sports skort for women.', image: '/images/shop/clothing/1080skort.png', sizes: json(['XS', 'S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-meit', category: 'clothing', brand: 'TZH', name: 'Meit Leggings', fullName: 'TZH Meit Leggings (美腿)', price: 75, description: 'Comfortable sports leggings with stretch fit.', image: '/images/shop/clothing/meit.png', sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-pk777', category: 'clothing', brand: 'TZH', name: 'PK777 Sports Set', fullName: 'TZH PK777 Sports Set', price: 120, description: 'Complete sports set for training and competition.', image: '/images/shop/clothing/pk777.png', colors: json(['Black', 'White', 'Blue']), sizes: json(['S', 'M', 'L', 'XL', 'XXL']), inStock: true, featured: true },
  { productId: 'tzh-cloth-q3', category: 'clothing', brand: 'TZH', name: 'Q3 Jersey', fullName: 'TZH Q3 Jersey', price: 95, description: 'Quick-dry Q3 series jersey.', image: '/images/shop/clothing/q3.jpg', colors: json(['Black', 'White']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-hoodie', category: 'clothing', brand: 'TZH', name: 'Tongtian Hoodie', fullName: 'TZH Tongtian Hoodie (通天卫衣)', price: 130, description: 'Warm sports hoodie for cool weather.', image: '/images/shop/clothing/hoodie.png', colors: json(['Black', 'Gray']), sizes: json(['S', 'M', 'L', 'XL', 'XXL']), inStock: true },
  { productId: 'tzh-cloth-longsleeve', category: 'clothing', brand: 'TZH', name: 'Tongtian Long Sleeve', fullName: 'TZH Tongtian Long Sleeve (通天长袖)', price: 110, description: 'Long sleeve training top.', image: '/images/shop/clothing/longsleeve.jpg', colors: json(['Black', 'White']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-kaleidoscope', category: 'clothing', brand: 'TZH', name: 'Kaleidoscope Jersey', fullName: 'TZH Kaleidoscope Series (万花筒)', price: 99, description: 'Vibrant kaleidoscope pattern jersey.', image: '/images/shop/clothing/kaleidoscope.jpg', colors: json(['Multi-color']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-lingscape', category: 'clothing', brand: 'TZH', name: 'Ling Territory Jersey', fullName: 'TZH Ling Territory Series (凌境)', price: 105, description: 'Performance jersey from the Ling Territory series.', image: '/images/shop/clothing/lingscape.jpg', colors: json(['Black', 'Blue']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-biglogo', category: 'clothing', brand: 'TZH', name: 'Big Logo Tee', fullName: 'TZH Big Logo T-Shirt', price: 65, description: 'Casual tee with large TZH logo.', image: '/images/shop/clothing/biglogo.jpg', colors: json(['Black', 'White', 'Gray']), sizes: json(['S', 'M', 'L', 'XL', 'XXL']), inStock: true },
  { productId: 'tzh-cloth-smalllogo', category: 'clothing', brand: 'TZH', name: 'Small Logo Tee', fullName: 'TZH Small Logo T-Shirt', price: 55, description: 'Clean minimal tee with small TZH logo.', image: '/images/shop/clothing/smalllogo.jpg', colors: json(['Black', 'White', 'Navy']), sizes: json(['S', 'M', 'L', 'XL', 'XXL']), inStock: true },
  { productId: 'tzh-cloth-miaomiao', category: 'clothing', brand: 'TZH', name: 'Miao Miao Skirt', fullName: 'TZH Miao Miao Skirt (妙妙裙)', price: 80, description: 'Playful sports skirt for women.', image: '/images/shop/clothing/miaomiao.jpg', sizes: json(['XS', 'S', 'M', 'L']), inStock: true },
  { productId: 'tzh-cloth-beeeye', category: 'clothing', brand: 'TZH', name: 'Bee Eye Jersey', fullName: 'TZH Bee Eye Jersey (小蜂眼)', price: 95, description: 'Jersey with unique honeycomb mesh pattern.', image: '/images/shop/clothing/beeeye.jpg', colors: json(['Yellow/Black', 'White']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-culture-rocket', category: 'clothing', brand: 'TZH', name: 'Culture Tee - Rocket', fullName: 'TZH Culture Tee - Rocket (大火箭)', price: 75, description: 'Fun rocket-themed cultural t-shirt.', image: '/images/shop/clothing/culture-rocket.jpg', colors: json(['White', 'Black']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-culture-space', category: 'clothing', brand: 'TZH', name: 'Culture Tee - Space', fullName: 'TZH Culture Tee - Space (航天)', price: 75, description: 'Space-themed cultural t-shirt.', image: '/images/shop/clothing/culture-space.jpg', colors: json(['White', 'Navy']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-culture-cat', category: 'clothing', brand: 'TZH', name: 'Culture Tee - Cat', fullName: 'TZH Culture Tee - Cat (猫咪)', price: 75, description: 'Cute cat-themed cultural t-shirt.', image: '/images/shop/clothing/culture-cat.jpg', colors: json(['White', 'Pink']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-star', category: 'clothing', brand: 'TZH', name: 'Star Competition Jersey', fullName: 'TZH Star Competition Jersey (明星大赛服)', price: 150, description: 'Premium competition jersey worn by TZH athletes.', image: '/images/shop/clothing/star.jpg', colors: json(['Black/Gold', 'White/Blue']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true, featured: true },
  { productId: 'tzh-cloth-galaxy', category: 'clothing', brand: 'TZH', name: 'Galaxy Feather Jersey', fullName: 'TZH Galaxy Feather Jersey (星河幻羽)', price: 120, description: 'Eye-catching galaxy-patterned sports jersey.', image: '/images/shop/clothing/galaxy.jpg', colors: json(['Purple/Blue', 'Black']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-matchpoint', category: 'clothing', brand: 'TZH', name: 'Match Point Jersey', fullName: 'TZH Match Point Jersey (赛点)', price: 99, description: 'Competition-ready jersey for match day.', image: '/images/shop/clothing/matchpoint.jpg', colors: json(['Red', 'Blue', 'Black']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-sweatpants', category: 'clothing', brand: 'TZH', name: 'Sports Sweatpants', fullName: 'TZH Sports Sweatpants (运动卫裤)', price: 95, description: 'Comfortable training sweatpants.', image: '/images/shop/clothing/sweatpants.png', colors: json(['Black', 'Gray']), sizes: json(['S', 'M', 'L', 'XL', 'XXL']), inStock: true },
  { productId: 'tzh-cloth-windbreaker', category: 'clothing', brand: 'TZH', name: 'Windbreaker', fullName: 'TZH Windbreaker (防风衣)', price: 140, description: 'Lightweight windbreaker for outdoor training.', image: '/images/shop/clothing/windbreaker.jpg', colors: json(['Black', 'Navy']), sizes: json(['S', 'M', 'L', 'XL', 'XXL']), inStock: true },
  { productId: 'tzh-cloth-tiger', category: 'clothing', brand: 'TZH', name: 'Malay Tiger Jersey', fullName: 'TZH Malay Tiger Series Jersey (马来虎)', price: 110, description: 'Malaysian tiger-themed sports jersey.', image: '/images/shop/clothing/tiger.jpg', colors: json(['Black/Orange', 'White']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },
  { productId: 'tzh-cloth-goldlogo', category: 'clothing', brand: 'TZH', name: 'Gold Logo Tee', fullName: 'TZH Gold Logo T-Shirt (金标)', price: 85, description: 'Premium tee with gold embroidered TZH logo.', image: '/images/shop/clothing/goldlogo.png', colors: json(['Black', 'White']), sizes: json(['S', 'M', 'L', 'XL']), inStock: true },

  // ==================== GRIPS ====================
  { productId: 'tzh-grip-star', category: 'grips', brand: 'TZH', name: 'Star Grip', fullName: 'TZH Star Grip (星星手胶)', price: 12, description: 'Star-pattern overgrip with excellent tackiness.', image: '/images/shop/grips/star.jpg', colors: json(['White', 'Black', 'Yellow', 'Pink']), inStock: true },
  { productId: 'tzh-grip-7c', category: 'grips', brand: 'TZH', name: '7C Grip', fullName: 'TZH 7C Overgrip', price: 10, description: 'Thin and comfortable 7C series overgrip.', image: '/images/shop/grips/7c.png', colors: json(['White', 'Black']), inStock: true },
  { productId: 'tzh-grip-7cpro', category: 'grips', brand: 'TZH', name: '7C Pro Grip', fullName: 'TZH 7C Pro Overgrip', price: 15, description: 'Professional grade 7C overgrip with enhanced durability.', image: '/images/shop/grips/7cpro.jpg', colors: json(['White', 'Black']), inStock: true, featured: true },
  { productId: 'tzh-grip-9s', category: 'grips', brand: 'TZH', name: '9S Grip', fullName: 'TZH 9S Overgrip', price: 12, description: 'Premium 9S series overgrip.', image: '/images/shop/grips/9s.png', colors: json(['White', 'Black']), inStock: true },
  { productId: 'tzh-grip-bubble', category: 'grips', brand: 'TZH', name: 'BB Bubble Grip', fullName: 'TZH BB Bubble Gradient Grip (泡泡渐变)', price: 15, description: 'Eye-catching bubble gradient pattern overgrip.', image: '/images/shop/grips/bubble.jpg', colors: json(['Gradient Blue', 'Gradient Pink', 'Gradient Green']), inStock: true },
  { productId: 'tzh-grip-g1', category: 'grips', brand: 'TZH', name: 'G1 Grip', fullName: 'TZH G1 Overgrip', price: 8, description: 'Basic G1 overgrip for everyday play.', image: '/images/shop/grips/g1.png', colors: json(['White', 'Black']), inStock: true },
  { productId: 'tzh-grip-keel', category: 'grips', brand: 'TZH', name: 'Keel Dragon Bone', fullName: 'TZH Keel Dragon Bone Grip (龙骨)', price: 18, description: 'Unique keel-patterned grip with excellent control.', image: '/images/shop/grips/keel.png', colors: json(['Black', 'White']), inStock: true },
  { productId: 'tzh-grip-m4', category: 'grips', brand: 'TZH', name: 'M4 Grip', fullName: 'TZH M4 Overgrip', price: 10, description: 'Reliable M4 series overgrip.', image: '/images/shop/grips/m4.jpg', colors: json(['White']), inStock: true },
  { productId: 'tzh-grip-towel', category: 'grips', brand: 'TZH', name: 'Towel Grip', fullName: 'TZH Single Towel Grip (单条毛巾胶)', price: 15, description: 'Cotton towel grip for maximum sweat absorption.', image: '/images/shop/grips/towel.png', colors: json(['White', 'Yellow']), inStock: true },
  { productId: 'tzh-grip-cartoon', category: 'grips', brand: 'TZH', name: 'Cartoon Grip', fullName: 'TZH Cartoon Overgrip (卡通手胶)', price: 12, description: 'Fun cartoon-patterned overgrip.', image: '/images/shop/grips/cartoon.png', colors: json(['Assorted']), inStock: true },
  { productId: 'tzh-grip-towelroll', category: 'grips', brand: 'TZH', name: 'Towel Grip Roll', fullName: 'TZH Large Towel Grip Roll (大盘毛巾胶)', price: 25, description: 'Economy roll of towel grip material.', image: '/images/shop/grips/towelroll.png', colors: json(['White', 'Yellow']), inStock: true },

  // ==================== ACCESSORIES (no strings) ====================
  { productId: 'tzh-acc-k11wrist', category: 'accessories', subcategory: 'wrist-guard', brand: 'TZH', name: 'K11 Wrist Support', fullName: 'TZH K11 Wrist Support (K11护腕)', price: 35, description: 'Compression wrist support for injury prevention.', image: '/images/shop/accessories/k11wrist.jpg', colors: json(['Black', 'White']), inStock: true },
  { productId: 'tzh-acc-cooltowel', category: 'accessories', subcategory: 'towel', brand: 'TZH', name: 'Cooling Towel', fullName: 'TZH Cooling Quick-Dry Towel (冷感速干)', price: 30, description: 'Instant cooling towel with quick-dry technology.', image: '/images/shop/accessories/cooltowel.png', colors: json(['Blue', 'Green', 'Gray']), inStock: true },
  { productId: 'tzh-acc-dampener', category: 'accessories', subcategory: 'dampener', brand: 'TZH', name: 'Vibration Dampener', fullName: 'TZH Vibration Dampener Film (减震膜)', price: 15, description: 'Racket vibration dampening film for comfort.', image: '/images/shop/accessories/dampener.png', inStock: true },
  { productId: 'tzh-acc-headsticker', category: 'accessories', subcategory: 'sticker', brand: 'TZH', name: 'Racket Head Sticker', fullName: 'TZH Cartoon Racket Head Sticker (卡通拍头贴)', price: 10, description: 'Fun cartoon stickers to protect and decorate your racket.', image: '/images/shop/accessories/headsticker.jpg', colors: json(['Assorted']), inStock: true },
  { productId: 'tzh-acc-patella2', category: 'accessories', subcategory: 'knee-guard', brand: 'TZH', name: 'Double Patellar Strap', fullName: 'TZH Double Layer Patellar Strap (双层髌骨带)', price: 45, description: 'Double-layer patellar support strap for knee protection.', image: '/images/shop/accessories/patella2.jpg', colors: json(['Black']), sizes: json(['S', 'M', 'L']), inStock: true },
  { productId: 'tzh-acc-kneeguard', category: 'accessories', subcategory: 'knee-guard', brand: 'TZH', name: 'Knee Guard', fullName: 'TZH Knee Guard (护膝)', price: 40, description: 'Breathable knee guard for sports protection.', image: '/images/shop/accessories/kneeguard.png', colors: json(['Black']), sizes: json(['S', 'M', 'L']), inStock: true },
  { productId: 'tzh-acc-socks', category: 'accessories', subcategory: 'socks', brand: 'TZH', name: 'Vitality Sports Socks', fullName: 'TZH Vitality Sports Socks (活力点运动袜)', price: 25, description: 'Cushioned sports socks for active play.', image: '/images/shop/accessories/socks.png', colors: json(['White', 'Black']), sizes: json(['M', 'L']), inStock: true, featured: true },
  { productId: 'tzh-acc-insole', category: 'accessories', subcategory: 'insoles', brand: 'TZH', name: 'Cheetah Insoles', fullName: 'TZH Cheetah Insoles (猎豹鞋垫)', price: 35, description: 'High-performance insoles with cushioning support.', image: '/images/shop/accessories/insole.jpg', sizes: json(['36-37', '38-39', '40-41', '42-43', '44-45']), inStock: true },
  { productId: 'tzh-acc-sweattowel', category: 'accessories', subcategory: 'towel', brand: 'TZH', name: 'Sweat Towel', fullName: 'TZH Sweat Absorption Towel (运动吸汗毛巾)', price: 25, description: 'Quick-absorbing sports towel.', image: '/images/shop/accessories/sweattowel.png', colors: json(['White', 'Blue']), inStock: true },
  { productId: 'tzh-acc-socks503', category: 'accessories', subcategory: 'socks', brand: 'TZH', name: 'Sports Socks 503', fullName: 'TZH Sports Socks 503', price: 20, description: 'Everyday sports socks model 503.', image: '/images/shop/accessories/socks503.png', colors: json(['White', 'Black']), sizes: json(['M', 'L']), inStock: true },
  { productId: 'tzh-acc-insole2', category: 'accessories', subcategory: 'insoles', brand: 'TZH', name: 'Sports Insoles', fullName: 'TZH Sports Insoles (运动鞋垫)', price: 28, description: 'Comfortable replacement sports insoles.', image: '/images/shop/accessories/insole2.png', sizes: json(['36-37', '38-39', '40-41', '42-43', '44-45']), inStock: true },
  { productId: 'tzh-acc-patella', category: 'accessories', subcategory: 'knee-guard', brand: 'TZH', name: 'Patellar Strap', fullName: 'TZH Patellar Strap (髌骨带)', price: 30, description: 'Single-layer patellar support strap.', image: '/images/shop/accessories/patella.png', colors: json(['Black']), sizes: json(['One Size']), inStock: true },

  // ==================== PICKLEBALL ====================
  { productId: 'tzh-pickle-grip', category: 'pickleball', brand: 'TZH', name: 'Pickleball Grip', fullName: 'TZH Pickleball Overgrip', price: 15, description: 'Overgrip designed for pickleball paddles.', image: '/images/shop/pickleball/grip.jpg', colors: json(['White', 'Black']), inStock: true },
  { productId: 'tzh-pickle-fruit', category: 'pickleball', brand: 'TZH', name: 'Colorful Fruit Paddle', fullName: 'TZH Colorful Fruit Pickleball Paddle (光彩水果)', price: 280, description: 'Vibrant fruit-themed pickleball paddle with excellent control.', image: '/images/shop/pickleball/fruit.jpg', colors: json(['Multi-color']), inStock: true },
  { productId: 'tzh-pickle-cedric', category: 'pickleball', brand: 'TZH', name: 'Cedric Paddle', fullName: 'TZH Cedric Pickleball Paddle (塞迪克)', price: 320, description: 'Pro-level pickleball paddle from the Cedric series.', image: '/images/shop/pickleball/cedric.jpg', colors: json(['Black/Gold']), inStock: true, featured: true },
  { productId: 'tzh-pickle-aurora', category: 'pickleball', brand: 'TZH', name: 'Ace Aurora Paddle', fullName: 'TZH Ace Aurora Pickleball Paddle (艾斯极光)', price: 350, description: 'Premium paddle with aurora-inspired design and carbon face.', image: '/images/shop/pickleball/aurora.jpg', colors: json(['Purple/Blue', 'Green/Blue']), inStock: true },
  { productId: 'tzh-pickle-balls', category: 'pickleball', brand: 'TZH', name: 'Pickleballs', fullName: 'TZH Pickleballs (12 pack)', price: 60, description: 'Outdoor pickleballs, 12-pack.', image: '/images/shop/pickleball/balls.jpg', colors: json(['Yellow']), inStock: true },
]

async function main() {
  console.log('Seeding TZH products...')

  let created = 0
  let updated = 0

  for (const product of TZH_PRODUCTS) {
    const data = {
      category: product.category,
      subcategory: (product as Record<string, unknown>).subcategory as string || null,
      brand: product.brand,
      name: product.name,
      fullName: product.fullName,
      price: product.price,
      description: product.description || null,
      image: product.image,
      colors: product.colors || Prisma.JsonNull,
      sizes: (product as Record<string, unknown>).sizes as Prisma.InputJsonValue || Prisma.JsonNull,
      inStock: product.inStock,
      stockCount: 0,
      featured: product.featured || false,
    }

    try {
      await prisma.shopProduct.upsert({
        where: { productId: product.productId },
        update: data,
        create: {
          productId: product.productId,
          ...data,
        },
      })
      created++
    } catch (error) {
      console.error(`Failed to upsert ${product.productId}:`, error)
    }
  }

  console.log(`Done! Processed ${created} TZH products.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
