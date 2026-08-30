import type { Calibration, Measurement, Point, Unit } from '../types'
import { dist, formatLength, lengthMm, mmPerPixel, midpoint } from './geometry'

export type ExportPayload = {
  image: HTMLImageElement
  calibration: Calibration | null
  measurements: Measurement[]
  unit: Unit
  title: string
}

/** Composite annotated photo + dimensioned orthographic drawing onto one canvas, return blob. */
export async function exportProjectPng(payload: ExportPayload): Promise<Blob> {
  const { image, calibration, measurements, unit, title } = payload
  const scale = calibration
    ? mmPerPixel(calibration.knownLengthMm, calibration.a, calibration.b)
    : null

  const pad = 48
  const gap = 36
  const drawH = Math.max(280, Math.round(image.naturalHeight * 0.45))
  const width = Math.max(image.naturalWidth + pad * 2, 720)
  const photoH = image.naturalHeight
  const headerH = 88
  const footerH = 56
  const height = headerH + photoH + gap + drawH + footerH + pad

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unsupported')

  // Atmosphere
  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#e7eef1')
  bg.addColorStop(0.55, '#f3f0ea')
  bg.addColorStop(1, '#dfe8e4')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  // Header
  ctx.fillStyle = '#1a3530'
  ctx.font = '700 36px Syne, sans-serif'
  ctx.fillText('Measure Draw', pad, 48)
  ctx.font = '500 16px Manrope, sans-serif'
  ctx.fillStyle = '#3d5a54'
  ctx.fillText(title || 'Dimensioned capture', pad, 74)

  // Photo
  const photoX = Math.round((width - image.naturalWidth) / 2)
  const photoY = headerH
  ctx.drawImage(image, photoX, photoY)

  const toCanvas = (p: Point): Point => ({
    x: photoX + p.x,
    y: photoY + p.y,
  })

  // Overlay calibration
  if (calibration) {
    drawSegment(
      ctx,
      toCanvas(calibration.a),
      toCanvas(calibration.b),
      '#1a3530',
      formatLength(calibration.knownLengthMm, unit) + ' ref',
      true,
    )
  }

  // Overlay measurements
  for (const m of measurements) {
    const mm = lengthMm(m.a, m.b, scale)
    drawSegment(ctx, toCanvas(m.a), toCanvas(m.b), '#c45c26', formatLength(mm, unit), false)
  }

  // Drawing panel
  const drawY = photoY + photoH + gap
  const drawX = pad
  const drawW = width - pad * 2
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  roundRect(ctx, drawX, drawY, drawW, drawH, 18)
  ctx.fill()
  ctx.strokeStyle = 'rgba(26,53,48,0.12)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = '#1a3530'
  ctx.font = '700 20px Syne, sans-serif'
  ctx.fillText('Dimensioned drawing', drawX + 20, drawY + 32)
  ctx.font = '500 13px Manrope, sans-serif'
  ctx.fillStyle = '#5a726c'
  const method = calibration
    ? `Scaled with ${calibration.label}`
    : 'Not calibrated — lengths unavailable'
  ctx.fillText(method, drawX + 20, drawY + 54)

  drawOrthographic(
    ctx,
    measurements,
    scale,
    unit,
    drawX + 20,
    drawY + 72,
    drawW - 40,
    drawH - 92,
  )

  // Footer
  ctx.fillStyle = '#5a726c'
  ctx.font = '500 12px Manrope, sans-serif'
  ctx.fillText(
    'Good enough for planning & listings — not survey / permit grade.',
    pad,
    height - 24,
  )

  return await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), 'image/png')
  })
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  color: string,
  label: string,
  dashed: boolean,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = dashed ? 3 : 4
  if (dashed) ctx.setLineDash([8, 6])
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.setLineDash([])

  for (const p of [a, b]) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.strokeStyle = color
  }

  const mid = midpoint(a, b)
  ctx.font = '700 14px Manrope, sans-serif'
  const tw = ctx.measureText(label).width
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  roundRect(ctx, mid.x - tw / 2 - 8, mid.y - 28, tw + 16, 22, 8)
  ctx.fill()
  ctx.fillStyle = color
  ctx.fillText(label, mid.x - tw / 2, mid.y - 12)
  ctx.restore()
}

function drawOrthographic(
  ctx: CanvasRenderingContext2D,
  measurements: Measurement[],
  scale: number | null,
  unit: Unit,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (!measurements.length || scale == null) {
    ctx.fillStyle = '#8aa099'
    ctx.font = '500 14px Manrope, sans-serif'
    ctx.fillText('Add calibrated measurements to build the drawing.', x, y + 28)
    return
  }

  // Lay out each segment as a horizontal bar stack with true proportions relative to longest.
  const lengths = measurements.map((m) => dist(m.a, m.b) * scale)
  const maxMm = Math.max(...lengths, 1)
  const rowH = Math.min(56, (h - 8) / measurements.length)

  measurements.forEach((m, i) => {
    const mm = lengths[i]
    const barW = Math.max(24, (mm / maxMm) * (w - 140))
    const rowY = y + i * rowH + rowH * 0.35
    ctx.strokeStyle = '#c45c26'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x, rowY)
    ctx.lineTo(x + barW, rowY)
    ctx.stroke()
    ctx.fillStyle = '#c45c26'
    ctx.beginPath()
    ctx.arc(x, rowY, 5, 0, Math.PI * 2)
    ctx.arc(x + barW, rowY, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a3530'
    ctx.font = '600 14px Manrope, sans-serif'
    const label = m.label || `Edge ${i + 1}`
    ctx.fillText(`${label}: ${formatLength(mm, unit)}`, x + barW + 16, rowY + 5)
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
