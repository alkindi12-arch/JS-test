import { useEffect, useRef } from 'react'
import type { Calibration, Measurement, Point, ToolMode } from '../types'
import { formatLength, lengthMm, mmPerPixel, midpoint } from '../lib/geometry'
import type { Unit } from '../types'

type Props = {
  imageUrl: string
  naturalWidth: number
  naturalHeight: number
  mode: ToolMode
  calibration: Calibration | null
  measurements: Measurement[]
  pending: Point | null
  unit: Unit
  onPoint: (p: Point) => void
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
  onPoint,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

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
      )
    }

    for (const m of measurements) {
      const mm = lengthMm(m.a, m.b, scale)
      strokeSeg(ctx, m.a, m.b, '#c45c26', formatLength(mm, unit), false)
    }

    if (pending) {
      ctx.fillStyle = mode === 'calibrate' ? '#1a3530' : '#c45c26'
      ctx.beginPath()
      ctx.arc(pending.x, pending.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }

  function eventToPoint(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * naturalWidth
    const y = ((e.clientY - rect.top) / rect.height) * naturalHeight
    return { x, y }
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        onPoint(eventToPoint(e))
      }}
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

  const r = Math.max(6, ctx.canvas.width * 0.004)
  for (const p of [a, b]) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.strokeStyle = color
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
