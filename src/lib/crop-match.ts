import { catalog } from "./catalog";

const ALIAS: [RegExp, string][] = [
  [/^grape/, "Grapes (Table)"],
  [/^sweet\s*corn|^corn\b/, "Sweet Corn"],
  [/^table\s*grape/, "Grapes (Table)"],
  [/^head\s*lettuce|^romaine|^iceberg/, "Lettuce"],
  [/^bell\s*pepper|^pepper/, "Peppers"],
  [/^dry\s*onion|^onion/, "Onions"],
  [/^potato/, "Potatoes"],
  [/^strawb/, "Strawberries"],
  [/^blueberr/, "Blueberries"],
  [/^raspberr/, "Raspberries"],
  [/^tomato/, "Tomatoes"],
  [/^apple/, "Apples"],
  [/^avocado|^hass/, "Avocados"],
  [/^banana/, "Bananas"],
  [/^carrot/, "Carrots"],
  [/^broccoli/, "Broccoli"],
  [/^cauli/, "Cauliflower"],
  [/^celery/, "Celery"],
  [/^cucumber|^cuke/, "Cucumbers"],
  [/^asparag/, "Asparagus"],
  [/^peach/, "Peaches"],
  [/^pear/, "Pears"],
  [/^melon|^cantaloup|^honeydew/, "Melons"],
  [/^watermelon/, "Watermelon"],
  [/^pineapple/, "Pineapples"],
  [/^orange/, "Oranges"],
  [/^lemon/, "Lemons"],
  [/^lime/, "Limes"],
  [/^mango/, "Mangoes"],
  [/^mushroom/, "Mushrooms"],
  [/^zucchini|^courgette/, "Zucchini"],
  [/^bean/, "Beans"],
  [/^cabbage/, "Cabbage"],
  [/^garlic/, "Garlic"],
  [/^ginger/, "Ginger Root"],
  [/^kiwi/, "Kiwi Fruit"],
  [/^nectarine/, "Nectarines"],
  [/^plum/, "Plums"],
  [/^spinach/, "Spinach"],
  [/^cherry|^cherries/, "Cherries"],
  [/^radish/, "Radishes"],
  [/^beet/, "Beets"],
];

function labels(): string[] {
  return [...new Set(catalog.map((c) => c.label))].sort((a, b) => b.length - a.length);
}

export function matchCmd(input: string): string | null {
  const t = input.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return null;
  if (/green\s+onion|scallion|shallot/.test(t)) return null;
  const all = labels();
  const exact = all.find((l) => l.toLowerCase() === t);
  if (exact) return exact;
  for (const [re, label] of ALIAS) {
    if (re.test(t) && all.includes(label)) return label;
  }
  const start = all.find((l) => t.startsWith(l.toLowerCase()) || l.toLowerCase().startsWith(t));
  if (start) return start;
  const inside = all.find((l) => t.includes(l.toLowerCase()));
  return inside || null;
}
