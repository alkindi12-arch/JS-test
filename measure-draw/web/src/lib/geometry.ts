import type { Point, Unit } from '../types'

export function dist(a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.hypot(dx, dy)
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/** Millimetres per image pixel, from a calibrated reference segment. */
export function mmPerPixel(knownLengthMm: number, a: Point, b: Point): number | null {
  const px = dist(a, b)
  if (px < 1) return null
  return knownLengthMm / px
}

export function lengthMm(
  a: Point,
  b: Point,
  scaleMmPerPx: number | null,
): number | null {
  if (scaleMmPerPx == null) return null
  return dist(a, b) * scaleMmPerPx
}

export function formatLength(mm: number | null, unit: Unit): string {
  if (mm == null || !Number.isFinite(mm)) return '—'
  if (unit === 'mm') return `${roundSmart(mm)} mm`
  if (unit === 'cm') return `${roundSmart(mm / 10)} cm`
  return `${roundSmart(mm / 25.4)} in`
}

function roundSmart(n: number): string {
  if (Math.abs(n) >= 100) return n.toFixed(0)
  if (Math.abs(n) >= 10) return n.toFixed(1)
  return n.toFixed(2)
}

export function uid(prefix = 'm'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}
