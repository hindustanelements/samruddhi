import prismaPackage from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const { PrismaClient, Role } = prismaPackage;
const prisma = new PrismaClient();
const categories = [
  ["Cashews", "Creamy, responsibly sourced coastal cashews."],
  ["Dry Fruits", "Everyday nourishment from premium nuts and dried fruits."],
  ["Millets", "Ancient grains for modern, balanced kitchens."],
  ["Organic Staples", "Rice, pulses, flours and sweeteners from trusted farms."],
  ["Cold Pressed Oils", "Traditionally extracted oils with full natural character."],
  ["Natural Spices", "Pure, fragrant spices without fillers or artificial colour."],
  ["Mitti Cookware", "Hand-finished clay cookware, waterware and tableware for natural kitchens."]
];

const products = [
  ["Premium Whole Cashews W320", "Cashews", 749, 679, "500 g", 42, true, true, "Large, creamy W320 cashews with a naturally sweet finish.", "/products/cashews-w320.png"],
  ["Jumbo Cashews W240", "Cashews", 999, 899, "500 g", 22, true, true, "Big, buttery cashews selected for gifting, sweets and premium snacking.", "/products/cashews-w240.png"],
  ["Roasted Salted Cashews", "Cashews", 599, 529, "250 g", 36, true, false, "Lightly roasted cashews with balanced rock salt for a crisp evening snack.", "/products/roasted-salted-cashews.png"],
  ["Cashew Splits", "Cashews", 429, 389, "500 g", 48, false, false, "Clean cashew pieces for curries, gravies, sweets and everyday cooking.", "https://source.unsplash.com/900x700/?cashew-pieces,cashews"],
  ["Mamra Almonds", "Dry Fruits", 899, 829, "500 g", 28, true, true, "Crunchy almonds selected for flavour, texture and everyday nutrition.", "https://source.unsplash.com/900x700/?mamra-almonds,almonds"],
  ["Seedless Green Raisins", "Dry Fruits", 389, 349, "500 g", 35, false, false, "Sun-dried raisins with gentle sweetness and no added sugar.", "https://source.unsplash.com/900x700/?green-raisins,dried-fruit"],
  ["Celebration Dry Fruit Mix", "Dry Fruits", 1099, 949, "750 g", 18, true, true, "A generous blend of cashews, almonds, raisins and pistachios.", "https://source.unsplash.com/900x700/?dry-fruit-mix,nuts"],
  ["Foxtail Millet", "Millets", 189, 169, "1 kg", 54, true, true, "A light, versatile ancient grain for pulao, upma and porridge.", "/products/foxtail-millet.png"],
  ["Little Millet", "Millets", 199, 179, "1 kg", 47, false, false, "Naturally gluten-free millet with a delicate, comforting texture.", "https://source.unsplash.com/900x700/?little-millet,grain"],
  ["Barnyard Millet", "Millets", 219, 189, "1 kg", 44, true, false, "Quick-cooking millet for khichdi, dosa batter, lemon rice and light dinners.", "/products/barnyard-millet.png"],
  ["Kodo Millet", "Millets", 229, 199, "1 kg", 38, false, false, "Earthy millet grains that hold shape beautifully in pulao and one-pot meals.", "https://source.unsplash.com/900x700/?kodo-millet,grain"],
  ["Ragi Flour", "Millets", 169, 149, "1 kg", 52, true, true, "Stone-ground finger millet flour for dosa, roti, malt and nourishing porridge.", "/products/ragi-flour.png"],
  ["Multi Millet Dosa Mix", "Millets", 249, 219, "500 g", 30, true, false, "A ready blend of millets and dals for crisp dosas and soft uttapams.", "https://source.unsplash.com/900x700/?dosa-mix,millet-flour"],
  ["Stone-ground Turmeric", "Natural Spices", 179, 149, "200 g", 63, true, true, "Deep golden turmeric, slowly ground for aroma and purity.", "/products/turmeric.png"],
  ["Cold Pressed Groundnut Oil", "Cold Pressed Oils", 429, 389, "1 L", 31, true, false, "Wood-pressed in small batches for a warm, nutty character.", "/products/groundnut-oil.png"],
  ["Natural Kolhapuri Jaggery", "Organic Staples", 159, 139, "500 g", 39, false, true, "Unrefined cane jaggery with rich caramel notes.", "https://source.unsplash.com/900x700/?jaggery,gud"],
  ["Clay Handi", "Mitti Cookware", 712, 499, "1 L", 26, true, true, "Unglazed clay handi for slow dal, rice, sabzi and homestyle curries.", "/products/clay-handi.png"],
  ["Clay Biryani Pot", "Mitti Cookware", 1427, 999, "2 L", 16, true, true, "A deep clay pot that lets biryani, pulao and dum dishes cook with gentle heat.", "/products/clay-biryani-pot.png"],
  ["Clay Cooker", "Mitti Cookware", 2855, 1999, "3 L", 10, true, true, "A traditional pressure-style clay cooker for flavourful everyday meals.", "/products/clay-cooker.png"],
  ["Clay Tawa With Handle", "Mitti Cookware", 999, 499, "9 inch", 20, true, false, "Flat earthen tawa for rotis, bhakri and gentle low-flame cooking.", "/products/clay-tawa.png"],
  ["Clay Curd Pot With Cap", "Mitti Cookware", 1199, 699, "650 ml", 24, false, true, "Terracotta curd pot that helps set thick, naturally flavoured homemade dahi.", "/products/clay-curd-pot.png"],
  ["Clay Water Pot", "Mitti Cookware", 2999, 1999, "11 L", 12, true, true, "A natural terracotta water pot for cool, fresh-tasting drinking water.", "/products/clay-water-pot.png"],
  ["Clay Water Bottle", "Mitti Cookware", 999, 499, "1 L", 30, true, false, "Self-cooling terracotta bottle made for daily hydration and plastic-free tables.", "/products/clay-water-bottle.png"],
  ["Clay Cup Set", "Mitti Cookware", 899, 399, "6 pieces", 28, false, false, "Small clay cups for chai, buttermilk and warm drinks with an earthy finish.", "https://source.unsplash.com/900x700/?clay-cups,kulhad"]
];

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  await prisma.user.upsert({
    where: { email: "admin@samruddhi.in" },
    update: {},
    create: { name: "Samruddhi Admin", email: "admin@samruddhi.in", password: adminPassword, role: Role.ADMIN }
  });
  const categoryMap = {};
  for (const [name, description] of categories) {
    categoryMap[name] = await prisma.category.upsert({
      where: { slug: slugify(name, { lower: true }) },
      update: { description },
      create: { name, slug: slugify(name, { lower: true }), description }
    });
  }
  for (const [name, category, price, discountPrice, weight, stock, featured, bestseller, shortDescription, image] of products) {
    await prisma.product.upsert({
      where: { slug: slugify(name, { lower: true }) },
      update: {},
      create: {
        name, slug: slugify(name, { lower: true }), price, discountPrice, weight, stock, featured, bestseller,
        shortDescription, image, categoryId: categoryMap[category].id,
        description: `${shortDescription} Carefully selected and packed in small batches to retain freshness, flavour and natural goodness.`,
        benefits: "Naturally wholesome • Carefully sourced • No artificial colours • Hygienically packed",
        usage: category === "Mitti Cookware" ? "Soak before first use, season gently and cook on low to medium heat." : "Store in a cool, dry place. Reseal after opening and enjoy as part of a balanced diet."
      }
    });
  }
}

main().finally(() => prisma.$disconnect());
