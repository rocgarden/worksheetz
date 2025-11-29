import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// libs/redis-cache.js

export async function getCachedConcept(subject, concept, gradeLevel) {
  try {
    const key = `${subject}:concept:${concept}:${gradeLevel}`;
    const cached = await redis.get(key);
    return cached; // Returns { introduction, example } or null
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

export async function setCachedConcept(
  subject,
  concept,
  gradeLevel,
  introduction,
  example
) {
  try {
    const key = `${subject}:concept:${concept}:${gradeLevel}`;
    await redis.set(key, { introduction, example }, { ex: 60 * 60 * 24 * 30 });
    console.log(`✅ Cached concept: ${key}`);
  } catch (error) {
    console.error("Redis set error:", error);
  }
}
// Helper to get cached intro
export async function getCachedIntro(subject, concept, gradeLevel) {
  try {
    const key = `${subject}:intro:${concept}:${gradeLevel}`;
    const cached = await redis.get(key);
    return cached;
  } catch (error) {
    console.error("Redis get error:", error);
    return null; // Fallback to generating if cache fails
  }
}

// Helper to set cached intro
export async function setCachedIntro(subject, concept, gradeLevel, content) {
  try {
    const key = `${subject}:intro:${concept}:${gradeLevel}`;
    await redis.set(key, content, { ex: 60 * 60 * 24 * 30 }); // 30 days
    console.log(`✅ Cached intro: ${key}`);
  } catch (error) {
    console.error("Redis set error:", error);
  }
}

// Helper for instructions
export async function getCachedInstructions(subject, section) {
  try {
    const key = `${subject}:instructions:${section}`;
    return await redis.get(key);
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

export async function setCachedInstructions(subject, section, content) {
  try {
    const key = `${subject}:instructions:${section}`;
    await redis.set(key, content, { ex: 60 * 60 * 24 * 90 }); // 90 days
    console.log(`✅ Cached instructions: ${key}`);
  } catch (error) {
    console.error("Redis set error:", error);
  }
}
