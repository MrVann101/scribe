// lib/utils.ts
// Scribe — Utility functions

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind class merge utility
 * Combines clsx and tailwind-merge for proper class handling
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format ISO date string to readable format
 * Example: "2026-04-25T10:30:00Z" → "Apr 25, 2026"
 */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format duration in seconds to human readable
 * Example: 5400 → "1h 24m", 2700 → "45m"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Truncate text to max length with ellipsis
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 3) + '...'
}

/**
 * Strip markdown code fences from Gemini response
 * Removes ```json and ``` wrappers
 */
export function stripCodeFences(text: string): string {
  // Remove opening code fence with optional language
  let cleaned = text.replace(/^```(?:json)?\s*/i, '')
  // Remove closing code fence
  cleaned = cleaned.replace(/```$/i, '')
  // Trim whitespace
  return cleaned.trim()
}

/**
 * Parse JSON safely, returning null on failure
 */
export function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}