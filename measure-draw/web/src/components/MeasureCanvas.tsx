import { useEffect, useRef } from 'react'
import type { Calibration, Measurement, Point, ToolMode, Unit } from '../types'
import {
  formatLength,
  handleHitRadius,
  lengthMm,
  midpoint,
  mmPerPixel,
  nearestHandle,
} from '../lib/geometry'

export type DragTarget =
  | { kind: 'calibration'; end: 'a' | 'b' }
  | { kind: 'measurement'; id: string; end: 'a' | 'b' }
  | { kind: 'pending' }

type Props = {
  imageUrl: string
  naturalWidth: number
  naturalHeight: number
  mode: ToolMode
  calibration: Calibration | null
  measurements: Measurement[]
  pending: Point | null
  unit: Unit
  /** Place a new point (only when not starting a drag on an existing handle). */
  onPlacePoint: (p: Point) => void
  /** Move an existing handle while dragging. */
  onMoveHandle: (target: DragTarget, p: Point) => void
}

export function MeasureCanvas({
  imageUrl,
  naturalWidth,
  naturalHeight,
  mode,
  calibration,
  measurements,
  pending,
  unit,
  onPlacePoint,
  onMoveHandle,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<DragTarget | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
      imgRef.current = img
      paint()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  useEffect(() => {
    paint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calibration, measurements, pending, mode, unit, naturalWidth, naturalHeight])

  function paint() {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = naturalWidth
    canvas.height = naturalHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    const scale = calibration
      ? mmPerPixel(calibration.knownLengthMm, calibration.a, calibration.b)
      : null

    if (calibration) {
      strokeSeg(
        ctx,
        calibration.a,
        calibration.b,
        '#1a3530',
        `${formatLength(calibration.knownLengthMm, unit)} ref`,
        true,
        true,
      )
    }

    for (const m of measurements) {
      const mm = lengthMm(m.a, m.b, scale)
      const emphasize = mode !== 'calibrate'
      strokeSeg(ctx, m.a, m.b, '#c45c26', formatLength(mm, unit), false, emphasize)
    }

    if (pending) {
      drawHandle(ctx, pending, mode === 'calibrate' ? '#1a3530' : '#c45c26', true)
    }
  }

  function collectHandles(): { id: string; point: Point; target: DragTarget }[] {
    const list: { id: string; point: Point; target: DragTarget }[] = []
    if (calibration && (mode === 'calibrate' || mode === 'select')) {
      list.push({
        id: 'cal-a',
        point: calibration.a,
        target: { kind: 'calibration', end: 'a' },
      })
      list.push({
        id: 'cal-b',
        point: calibration.b,
        target: { kind: 'calibration', end: 'b' },
      })
    }
    if (mode === 'measure' || mode === 'select') {
      for (const m of measurements) {
        list.push({
          id: `${m.id}-a`,
          point: m.a,
          target: { kind: 'measurement', id: m.id, end: 'a' },
        })
        list.push({
          id: `${m.id}-b`,
          point: m.b,
          target: { kind: 'measurement', id: m.id, end: 'b' },
        })
      }
    }
    if (pending) {
      list.push({ id: 'pending', point: pending, target: { kind: 'pending' } })
    }
    return list
  }

  function eventToPoint(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * naturalWidth
    const y = ((e.clientY - rect.top) / rect.height) * naturalHeight
    return {
      x: Math.min(naturalWidth, Math.max(0, x)),
      y: Math.min(naturalHeight, Math.max(0, y)),
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = eventToPoint(e)
    const handles = collectHandles()
    const hitId = nearestHandle(
      p,
      handles.map((h) => ({ id: h.id, point: h.point })),
      handleHitRadius(naturalWidth),
    )
    if (hitId) {
      const hit = handles.find((h) => h.id === hitId)!
      dragRef.current = hit.target
      onMoveHandle(hit.target, p)
      return
    }
    if (mode === 'select') return
    onPlacePoint(p)
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current) return
    onMoveHandle(dragRef.current, eventToPoint(e))
  }

  function onPointerUp() {
    dragRef.current = null
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label="Measurement canvas"
    />
  )
}

function strokeSeg(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  color: string,
  label: string,
  dashed: boolean,
  showHandles: boolean,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(3, ctx.canvas.width * 0.0025)
  if (dashed) ctx.setLineDash([10, 8])
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.setLineDash([])

  if (showHandles) {
    drawHandle(ctx, a, color, false)
    drawHandle(ctx, b, color, false)
  }

  const mid = midpoint(a, b)
  const fontSize = Math.max(14, ctx.canvas.width * 0.018)
  ctx.font = `700 ${fontSize}px Manrope, sans-serif`
  const tw = ctx.measureText(label).width
  const padX = 10
  const padY = 8
  ctx.fillStyle = 'rgba(255,255,255,0.94)'
  const bx = mid.x - tw / 2 - padX
  const by = mid.y - fontSize - padY - 6
  roundRect(ctx, bx, by, tw + padX * 2, fontSize + padY * 2, 10)
  ctx.fill()
  ctx.fillStyle = color
  ctx.fillText(label, mid.x - tw / 2, mid.y - 10)
  ctx.restore()
}

function drawHandle(
  ctx: CanvasRenderingContext2D,
  p: Point,
  color: string,
  pulse: boolean,
) {
  const r = Math.max(10, ctx.canvas.width * 0.008)
  ctx.save()
  if (pulse) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(196, 92, 38, 0.2)'
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = Math.max(3, r * 0.35)
  ctx.stroke()
  // Inner crosshair for precision
  ctx.beginPath()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.moveTo(p.x - r * 0.45, p.y)
  ctx.lineTo(p.x + r * 0.45, p.y)
  ctx.moveTo(p.x, p.y - r * 0.45)
  ctx.lineTo(p.x, p.y + r * 0.45)
  ctx.stroke()
  ctx.restore()
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
