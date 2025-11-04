// /libs/planUtils.js
import config from "@/config";

/**
 * Find plan details by Stripe priceId
 * @param {string|null} priceId - Stripe price ID (e.g. "price_123")
 * @returns {object} - { name, priceId, monthlyGenerations,monthlyPdfs, description, isFree ,features, price }
 */
export function getPlanByPriceId(priceId) {
  // Default to the first plan if not found or missing (usually your "free" plan)
  const plan =
    config.stripe.plans.find((p) => p.priceId === priceId) ||
    config.stripe.plans[0];

  return {
    name: plan.name,
    priceId: plan.priceId,
    description: plan.description,
    monthlyGenerations: plan.monthlyGenerations ?? 2, // fallback limit if not defined
    monthlyPdfs: plan.monthlyPdfs ?? 1,
    isFree: plan.isFree ?? plan.price === 0,
    features: plan.features,
    price: plan.price,
  };
}

/**
 * Get all plans — useful for rendering pricing tables or admin pages
 * @returns {Array}
 */
export function getAllPlans() {
  return config.stripe.plans.map((p) => ({
    name: p.name,
    priceId: p.priceId,
    description: p.description,
    monthlyGenerations: p.monthlyGenerations ?? 3,
    monthlyPdfs: p.monthlyPdfs,
    isFree: plan.isFree ?? plan.price === 0,
    price: p.price,
    features: p.features,
  }));
}
