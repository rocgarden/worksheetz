// This works on both server and client

let DOMPurify;

if (typeof window !== "undefined") {
  // Client-side: use browser's DOMPurify
  DOMPurify = require("dompurify");
} else {
  // Server-side: use jsdom + DOMPurify
  const { JSDOM } = require("jsdom");
  const createDOMPurify = require("dompurify");
  const window = new JSDOM("").window;
  DOMPurify = createDOMPurify(window);
}

export function sanitizeInput(text) {
  if (!text) return "";
  let clean = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  return clean.trim();
}

export function deepSanitize(obj) {
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  } else if (obj && typeof obj === "object") {
    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = deepSanitize(obj[key]);
    }
    return sanitized;
  } else if (typeof obj === "string") {
    return sanitizeInput(obj);
  } else {
    return obj;
  }
}
