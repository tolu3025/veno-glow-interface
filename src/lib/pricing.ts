// Pricing helpers for instant-checkout categories. Pricing JSON shape is
// stored on `merchants.printing_pricing` / `merchants.laundry_pricing` and
// edited by the merchant elsewhere.

export type PrintingPricing = {
  bw?: { a4?: number; a3?: number };           // per page
  color?: { a4?: number; a3?: number };
  double_side_multiplier?: number;              // e.g. 1.8 (vs 2x single)
  binding?: { none?: number; spiral?: number; hardcover?: number };
  express_multiplier?: number;                  // e.g. 1.5
  delivery_fee?: number;
};

export const DEFAULT_PRINTING_PRICING: PrintingPricing = {
  bw: { a4: 20, a3: 40 },
  color: { a4: 100, a3: 200 },
  double_side_multiplier: 1.8,
  binding: { none: 0, spiral: 200, hardcover: 1500 },
  express_multiplier: 1.5,
  delivery_fee: 300,
};

export type PrintSpecs = {
  color: "bw" | "color";
  paper: "a4" | "a3";
  sides: "single" | "double";
  copies: number;
  pages: number;          // page count per copy
  binding: "none" | "spiral" | "hardcover";
  urgency: "standard" | "express";
};

export function computePrintingTotal(specs: PrintSpecs, pricing: PrintingPricing) {
  const p = { ...DEFAULT_PRINTING_PRICING, ...(pricing || {}) };
  const perPage =
    (p[specs.color]?.[specs.paper] ?? DEFAULT_PRINTING_PRICING[specs.color]![specs.paper]!);
  const sidedMult = specs.sides === "double" ? (p.double_side_multiplier ?? 1.8) : 2;
  // single = 1 side per page; double effectively cheaper than single*2
  const sideFactor = specs.sides === "single" ? 1 : sidedMult / 2;
  const pagesCost = perPage * specs.pages * specs.copies * sideFactor;
  const bindingCost = (p.binding?.[specs.binding] ?? 0) * specs.copies;
  const base = pagesCost + bindingCost;
  const total = specs.urgency === "express" ? base * (p.express_multiplier ?? 1.5) : base;
  return Math.round(total);
}

// ---------------- Laundry ----------------
export type LaundryPricing = {
  items?: Record<string, number>; // per-item base price (wash_and_iron)
  service_multipliers?: {
    wash_and_iron?: number;
    wash_only?: number;
    iron_only?: number;
    dry_clean?: number;
  };
  pickup_delivery_fee?: number;
};

export const DEFAULT_LAUNDRY_PRICING: LaundryPricing = {
  items: {
    shirt: 200,
    trouser: 250,
    native: 500,
    gown: 600,
    bedsheet: 400,
    towel: 250,
    underwear: 100,
  },
  service_multipliers: {
    wash_and_iron: 1.0,
    wash_only: 0.6,
    iron_only: 0.5,
    dry_clean: 1.5,
  },
  pickup_delivery_fee: 500,
};

export type LaundryServiceType = "wash_and_iron" | "wash_only" | "iron_only" | "dry_clean";
export type LaundryCart = Record<string, number>; // item key → qty

export function computeLaundryTotal(
  cart: LaundryCart,
  service: LaundryServiceType,
  pricing: LaundryPricing,
) {
  const p = { ...DEFAULT_LAUNDRY_PRICING, ...(pricing || {}) };
  const items = { ...DEFAULT_LAUNDRY_PRICING.items, ...(p.items ?? {}) };
  const mult = p.service_multipliers?.[service] ?? DEFAULT_LAUNDRY_PRICING.service_multipliers![service]!;
  let total = 0;
  for (const [key, qty] of Object.entries(cart)) {
    const price = items[key] ?? 0;
    total += price * qty * mult;
  }
  return Math.round(total);
}

export const LAUNDRY_ITEM_LABELS: Record<string, string> = {
  shirt: "Shirt",
  trouser: "Trouser",
  native: "Native (per piece)",
  gown: "Gown / Dress",
  bedsheet: "Bedsheet",
  towel: "Towel",
  underwear: "Underwear",
};

export const LAUNDRY_SERVICE_LABELS: Record<LaundryServiceType, string> = {
  wash_and_iron: "Wash & Iron",
  wash_only: "Wash only",
  iron_only: "Iron only",
  dry_clean: "Dry clean",
};
