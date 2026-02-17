
/**
 * Recursively standardizes data by converting Decimal-like objects to numbers
 * and Dates to ISO strings (optional, but good for JSON serialization).
 * This is necessary because Next.js components cannot accept non-plain objects like Prisma Decimals.
 */
export function serializeData(obj: any, visited = new WeakSet()): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives quickly
  if (typeof obj !== "object") {
    return obj;
  }

  // Prevent circular references
  if (visited.has(obj)) {
    return "[Circular]";
  }

  // Handle Dates early
  if (obj instanceof Date) {
    return obj;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    visited.add(obj);
    return obj.map((item) => serializeData(item, visited));
  }

  // Handle Decimal-like objects (e.g., Prisma Decimal)
  if (typeof obj.toNumber === "function") {
    return obj.toNumber();
  }

  // Handle Objects
  visited.add(obj);
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = serializeData(obj[key], visited);
    }
  }
  return newObj;
}
