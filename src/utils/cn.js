import clsx from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and resolve
 * conflicting Tailwind CSS utility classes.
 *
 * Example:
 *
 * cn(
 *   "px-4 py-2",
 *   active && "bg-black text-white",
 *   disabled && "opacity-50 cursor-not-allowed"
 * )
 *
 * @param  {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
