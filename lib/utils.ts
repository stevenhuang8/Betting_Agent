import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Removes URLs from text content while preserving the surrounding text
 * @param text - The text content that may contain URLs
 * @returns Text with URLs removed
 */
export function removeUrls(text: string): string {
  // Regular expression to match URLs (http, https, www, and other common patterns)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  return text.replace(urlRegex, '').replace(/\s+/g, ' ').trim();
}
