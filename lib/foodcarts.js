import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

const COLLECTION = "Foodcarts";

const FALLBACK_MENUS = {
  "Silver FoodCart": [
    "Chicken Over Rice",
    "Lamb Over Rice",
    "Chicken & Lamb Combo Over Rice",
    "Chicken Gyro",
    "Lamb Gyro",
    "Falafel Over Rice",
    "Falafel Pita",
    "Fries",
  ],
  "Chicken land": [
    "Chicken Over Rice",
    "Chicken Gyro",
    "Chicken Cheesesteak",
    "Chicken Tenders",
    "Wings",
    "Fries",
  ],
  "Cucina Zapata": [
    "Korean BBQ Burrito",
    "Chicken Teriyaki Burrito",
    "Spicy Pork Burrito",
    "Tofu Burrito",
    "Korean BBQ Tacos",
    "Quesadilla",
    "Rice Bowls",
  ],
  "Happy Sunshine": [
    "General Tso’s Chicken",
    "Sesame Chicken",
    "Chicken & Broccoli",
    "Beef & Broccoli",
    "Lo Mein",
    "Fried Rice",
    "Dumplings",
    "Egg Rolls",
  ],
  "KAMI": [
    "Bulgogi",
    "Spicy Pork",
    "Chicken Teriyaki",
    "Bibimbap",
    "Kimchi Fried Rice",
    "Dumplings",
  ],
  "Lennox's lunch truck": [
    "Cheesesteak",
    "Chicken Cheesesteak",
    "Hoagies",
    "Burgers",
    "Fries",
  ],
  "Nanu's Hot Chicken": [
    "Hot Chicken Sandwich",
    "Chicken Tenders",
    "Chicken Over Rice",
    "Fries",
    "Milkshakes",
  ],
  "Pete’s Little Lunch Box": [
    "Bacon Egg & Cheese",
    "Sausage Egg & Cheese",
    "Pork Roll Egg & Cheese",
    "Breakfast Burrito",
    "Pancakes",
    "Coffee",
  ],
  "Sue's Lunch Truck (Kim's Dragon)": [
    "Lo Mein",
    "Fried Rice",
    "General Tso’s Chicken",
    "Sesame Chicken",
    "Dumplings",
    "Spring Rolls",
  ],
  "Wokworks Drexel": [
    "Build Your Own Bowl",
    "Rice or Noodles",
    "Chicken",
    "Steak",
    "Shrimp",
    "Tofu",
    "Stir Fry Vegetables",
  ],
};

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFallbackMenu(name, id) {
  return FALLBACK_MENUS[name] || FALLBACK_MENUS[id] || [];
}

function normalizeMenu(menu, fallbackMenu) {
  if (!Array.isArray(menu) || menu.length === 0) {
    return fallbackMenu;
  }

  const cleaned = menu
    .map((item) => {
      if (typeof item === "string") return item.trim();

      if (item && typeof item === "object") {
        if (typeof item.name === "string" && item.name.trim()) {
          return item.name.trim();
        }
      }

      return "";
    })
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : fallbackMenu;
}

function normalize(data, id) {
  const name = data.name ?? id;
  const fallbackMenu = getFallbackMenu(name, id);

  return {
    id,
    slug: slugify(name || id),
    name,
    category: data.category ?? "",
    location: data.location ?? "",
    priceRange: "",
    menu: normalizeMenu(data.menu, fallbackMenu),
    votes: 0,
  };
}

export async function getAllFoodcarts() {
  const snap = await getDocs(collection(db, COLLECTION));
  const results = [];
  snap.forEach((d) => results.push(normalize(d.data(), d.id)));
  return results;
}

export async function getFoodcartBySlug(slug) {
  const all = await getAllFoodcarts();
  const target = slugify(slug);

  return (
    all.find(
      (truck) =>
        slugify(truck.slug) === target ||
        slugify(truck.id) === target ||
        slugify(truck.name) === target
    ) ?? null
  );
}