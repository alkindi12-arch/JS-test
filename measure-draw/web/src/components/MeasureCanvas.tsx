import { useEffect, useRef, useState } from 'react'
import type { Calibration, Measurement, Point, ToolMode, Unit } from '../types'
import {
  formatLength,
  lengthMm,
  midpoint,
  mmPerPixel,
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
  onPlacePoint: (p: Point) => void
  onMoveHandle: (target: DragTarget, p: Point) => void
}

type ViewState = {
  /** User zoom multiplier on top of fit-to-view scale. */
  zoom: number
  /** Pan in CSS pixels (view space). */
  panX: number
  panY: number
}

const MIN_ZOOM = 1
const MAX_ZOOM = 8
/** Aim point sits this many CSS px above the finger while dragging. */
const DRAG_OFFSET_Y = 52
/** Screen-space handle hit radius (CSS px). */
const HIT_RADIUS_CSS = 28
const LOUPE_RADIUS = 72
const LOUPE_ZOOM = 3.2

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
  const wrapRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const viewRef = useRef<ViewState>({ zoom: 1, panX: 0, panY: 0 })
  const fitRef = useRef(1)
  const sizeRef = useRef({ w: 1, h: 1, dpr: 1 })
  const dragRef = useRef<DragTarget | null>(null)
  const dragPointRef = useRef<Point | null>(null)
  const loupePointRef = useRef<Point | null>(null)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<{ dist: number; zoom: number; midX: number; midY: number } | null>(
    null,
  )
  const panRef = useRef<{
    startX: number
    startY: number
    panX: number
    panY: number
    moved: boolean
    placed: boolean
  } | null>(null)
  const [, bump] = useState(0)
  const requestPaint = () => {
    paint()
    bump((n) => n + 1)
  }

  useEffect(() => {
    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
      imgRef.current = img
      fitView(true)
      paint()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, naturalWidth, naturalHeight])

  useEffect(() => {
    paint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calibration, measurements, pending, mode, unit])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(() => {
      fitView(viewRef.current.zoom === 1)
      paint()
    })
    ro.observe(wrap)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function measureWrap() {
    const wrap = wrapRef.current
    if (!wrap) return { w: 1, h: 1, dpr: 1 }
    const rect = wrap.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    return { w: Math.max(1, rect.width), h: Math.max(1, rect.height), dpr }
  }

  function fitView(resetPan: boolean) {
    const size = measureWrap()
    sizeRef.current = size
    const fit = Math.min(size.w / naturalWidth, size.h / naturalHeight)
    fitRef.current = fit
    if (resetPan) {
      viewRef.current.zoom = 1
      const disp = fit
      viewRef.current.panX = (size.w - naturalWidth * disp) / 2
      viewRef.current.panY = (size.h - naturalHeight * disp) / 2
    }
  }

  function displayScale() {
    return fitRef.current * viewRef.current.zoom
  }

  function clampPan() {
    const { w, h } = sizeRef.current
    const s = displayScale()
    const imgW = naturalWidth * s
    const imgH = naturalHeight * s
    const v = viewRef.current
    if (imgW <= w) v.panX = (w - imgW) / 2
    else v.panX = Math.min(0, Math.max(w - imgW, v.panX))
    if (imgH <= h) v.panY = (h - imgH) / 2
    else v.panY = Math.min(0, Math.max(h - imgH, v.panY))
  }

  function clientToImage(clientX: number, clientY: number): Point {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const sx = clientX - rect.left
    const sy = clientY - rect.top
    const s = displayScale()
    const v = viewRef.current
    return {
      x: Math.min(naturalWidth, Math.max(0, (sx - v.panX) / s)),
      y: Math.min(naturalHeight, Math.max(0, (sy - v.panY) / s)),
    }
  }

  function imageToScreen(p: Point): Point {
    const s = displayScale()
    const v = viewRef.current
    return { x: v.panX + p.x * s, y: v.panY + p.y * s }
  }

  function aimPointFromClient(clientX: number, clientY: number, dragging: boolean): Point {
    // While dragging, aim above the finger so the target stays visible.
    const y = dragging ? clientY - DRAG_OFFSET_Y : clientY
    return clientToImage(clientX, y)
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

  function hitHandle(clientX: number, clientY: number): DragTarget | null {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const sx = clientX - rect.left
    const sy = clientY - rect.top
    const handles = collectHandles()
    // Hit-test in screen space so zoom doesn't shrink the finger target.
    let best: { target: DragTarget; d: number } | null = null
    for (const h of handles) {
      const sp = imageToScreen(h.point)
      const d = Math.hypot(sp.x - sx, sp.y - sy)
      if (d <= HIT_RADIUS_CSS && (!best || d < best.d)) {
        best = { target: h.target, d }
      }
    }
    return best?.target ?? null
  }

  function paint() {
    const canvas = canvasRef.current
    const img = imgRef.current
    const wrap = wrapRef.current
    if (!canvas || !img || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = measureWrap()
    sizeRef.current = size
    if (fitRef.current <= 0) {
      fitRef.current = Math.min(size.w / naturalWidth, size.h / naturalHeight)
    }

    canvas.width = Math.round(size.w * size.dpr)
    canvas.height = Math.round(size.h * size.dpr)
    canvas.style.width = `${size.w}px`
    canvas.style.height = `${size.h}px`
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
    ctx.clearRect(0, 0, size.w, size.h)

    // Atmosphere behind image
    ctx.fillStyle = 'rgba(26,53,48,0.04)'
    ctx.fillRect(0, 0, size.w, size.h)

    const s = displayScale()
    const v = viewRef.current
    ctx.save()
    ctx.translate(v.panX, v.panY)
    ctx.scale(s, s)
    ctx.drawImage(img, 0, 0)

    const scaleMm = calibration
      ? mmPerPixel(calibration.knownLengthMm, calibration.a, calibration.b)
      : null

    // Keep stroke widths roughly constant in screen px
    const inv = 1 / s

    const cal = withDragOverrideCalibration(calibration)
    const measures = withDragOverrideMeasurements(measurements)
    const pend = withDragOverridePending(pending)

    if (cal) {
      strokeSeg(
        ctx,
        cal.a,
        cal.b,
        '#1a3530',
        `${formatLength(cal.knownLengthMm, unit)} ref`,
        true,
        true,
        inv,
      )
    }

    for (const m of measures) {
      const mm = lengthMm(m.a, m.b, scaleMm && cal
        ? mmPerPixel(cal.knownLengthMm, cal.a, cal.b)
        : scaleMm)
      strokeSeg(
        ctx,
        m.a,
        m.b,
        '#c45c26',
        formatLength(mm, unit),
        false,
        mode !== 'calibrate',
        inv,
      )
    }

    if (pend) {
      drawHandle(ctx, pend, mode === 'calibrate' ? '#1a3530' : '#c45c26', true, inv)
    }
    ctx.restore()

    // Loupe in screen space
    if (dragRef.current && loupePointRef.current) {
      drawLoupe(ctx, img, loupePointRef.current, size.w, size.h)
    }
  }

  function withDragOverrideCalibration(cal: Calibration | null): Calibration | null {
    if (!cal || !dragRef.current || !dragPointRef.current) return cal
    if (dragRef.current.kind !== 'calibration') return cal
    return { ...cal, [dragRef.current.end]: dragPointRef.current }
  }

  function withDragOverrideMeasurements(list: Measurement[]): Measurement[] {
    if (!dragRef.current || !dragPointRef.current || dragRef.current.kind !== 'measurement') {
      return list
    }
    const { id, end } = dragRef.current
    const pt = dragPointRef.current
    return list.map((m) => (m.id === id ? { ...m, [end]: pt } : m))
  }

  function withDragOverridePending(p: Point | null): Point | null {
    if (dragRef.current?.kind === 'pending' && dragPointRef.current) return dragPointRef.current
    return p
  }

  function drawLoupe(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    imgPt: Point,
    viewW: number,
    viewH: number,
  ) {
    const screen = imageToScreen(imgPt)
    // Park loupe opposite the finger (usually finger is below aim point)
    let cx = screen.x
    let cy = screen.y - LOUPE_RADIUS - 28
    if (cy < LOUPE_RADIUS + 8) cy = screen.y + LOUPE_RADIUS + 36
    if (cx < LOUPE_RADIUS + 8) cx = LOUPE_RADIUS + 8
    if (cx > viewW - LOUPE_RADIUS - 8) cx = viewW - LOUPE_RADIUS - 8
    if (cy > viewH - LOUPE_RADIUS - 8) cy = viewH - LOUPE_RADIUS - 8

    const srcR = LOUPE_RADIUS / LOUPE_ZOOM
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, LOUPE_RADIUS, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#111'
    ctx.fillRect(cx - LOUPE_RADIUS, cy - LOUPE_RADIUS, LOUPE_RADIUS * 2, LOUPE_RADIUS * 2)
    ctx.drawImage(
      img,
      imgPt.x - srcR,
      imgPt.y - srcR,
      srcR * 2,
      srcR * 2,
      cx - LOUPE_RADIUS,
      cy - LOUPE_RADIUS,
      LOUPE_RADIUS * 2,
      LOUPE_RADIUS * 2,
    )
    ctx.restore()

    ctx.beginPath()
    ctx.arc(cx, cy, LOUPE_RADIUS, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.strokeStyle = '#c45c26'
    ctx.lineWidth = 2
    ctx.stroke()

    // Crosshair
    ctx.beginPath()
    ctx.strokeStyle = '#c45c26'
    ctx.lineWidth = 1.5
    ctx.moveTo(cx - 18, cy)
    ctx.lineTo(cx + 18, cy)
    ctx.moveTo(cx, cy - 18)
    ctx.lineTo(cx, cy + 18)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#c45c26'
    ctx.fill()
  }

  function setZoomAround(nextZoom: number, screenX: number, screenY: number) {
    const prev = displayScale()
    const v = viewRef.current
    const imgX = (screenX - v.panX) / prev
    const imgY = (screenY - v.panY) / prev
    v.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
    const next = displayScale()
    v.panX = screenX - imgX * next
    v.panY = screenY - imgY * next
    clampPan()
  }

  function zoomBy(factor: number) {
    const { w, h } = sizeRef.current
    setZoomAround(viewRef.current.zoom * factor, w / 2, h / 2)
    requestPaint()
  }

  function resetView() {
    fitView(true)
    requestPaint()
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const canvas = e.currentTarget
    canvas.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2) {
      dragRef.current = null
      loupePointRef.current = null
      panRef.current = null
      const pts = [...pointersRef.current.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const rect = canvas.getBoundingClientRect()
      pinchRef.current = {
        dist: Math.max(1, dist),
        zoom: viewRef.current.zoom,
        midX: (pts[0].x + pts[1].x) / 2 - rect.left,
        midY: (pts[0].y + pts[1].y) / 2 - rect.top,
      }
      paint()
      return
    }

    const hit = hitHandle(e.clientX, e.clientY)
    if (hit) {
      dragRef.current = hit
      const aim = aimPointFromClient(e.clientX, e.clientY, true)
      dragPointRef.current = aim
      loupePointRef.current = aim
      onMoveHandle(hit, aim)
      paint()
      return
    }

    // Potential pan or tap-to-place
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: viewRef.current.panX,
      panY: viewRef.current.panY,
      moved: false,
      placed: false,
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = [...pointersRef.current.values()]
      const dist = Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y))
      const rect = e.currentTarget.getBoundingClientRect()
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top
      const ratio = dist / pinchRef.current.dist
      setZoomAround(pinchRef.current.zoom * ratio, midX, midY)
      paint()
      return
    }

    if (dragRef.current) {
      const aim = aimPointFromClient(e.clientX, e.clientY, true)
      dragPointRef.current = aim
      loupePointRef.current = aim
      onMoveHandle(dragRef.current, aim)
      paint()
      return
    }

    if (panRef.current && pointersRef.current.size === 1) {
      const dx = e.clientX - panRef.current.startX
      const dy = e.clientY - panRef.current.startY
      if (!panRef.current.moved && Math.hypot(dx, dy) > 8) {
        panRef.current.moved = true
      }
      if (panRef.current.moved) {
        viewRef.current.panX = panRef.current.panX + dx
        viewRef.current.panY = panRef.current.panY + dy
        clampPan()
        paint()
      }
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    pointersRef.current.delete(e.pointerId)

    if (pointersRef.current.size < 2) pinchRef.current = null

    if (dragRef.current) {
      dragRef.current = null
      dragPointRef.current = null
      loupePointRef.current = null
      paint()
    }

    if (panRef.current && pointersRef.current.size === 0) {
      const wasTap = !panRef.current.moved
      panRef.current = null
      if (wasTap && mode !== 'select') {
        const p = clientToImage(e.clientX, e.clientY)
        onPlacePoint(p)
      }
      paint()
    }
  }

  function onDoubleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    if (viewRef.current.zoom > 1.05) {
      resetView()
    } else {
      setZoomAround(3, sx, sy)
      requestPaint()
    }
  }

  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    setZoomAround(viewRef.current.zoom * factor, e.clientX - rect.left, e.clientY - rect.top)
    requestPaint()
  }

  const zoomPct = Math.round(viewRef.current.zoom * 100)

  return (
    <div className="canvas-stage" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
        aria-label="Measurement canvas"
      />
      <div className="zoom-toolbar" role="toolbar" aria-label="Zoom">
        <button type="button" className="btn btn-small btn-secondary" onClick={() => zoomBy(1 / 1.25)}>
          −
        </button>
        <button type="button" className="btn btn-small btn-secondary" onClick={resetView}>
          {zoomPct}%
        </button>
        <button type="button" className="btn btn-small btn-secondary" onClick={() => zoomBy(1.25)}>
          +
        </button>
      </div>
    </div>
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
  inv: number,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(2.5, 3 * inv)
  if (dashed) ctx.setLineDash([10 * inv, 8 * inv])
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.setLineDash([])

  if (showHandles) {
    drawHandle(ctx, a, color, false, inv)
    drawHandle(ctx, b, color, false, inv)
  }

  const mid = midpoint(a, b)
  const fontSize = Math.max(12, 14 * inv)
  ctx.font = `700 ${fontSize}px Manrope, sans-serif`
  const tw = ctx.measureText(label).width
  const padX = 8 * inv
  const padY = 6 * inv
  ctx.fillStyle = 'rgba(255,255,255,0.94)'
  const bx = mid.x - tw / 2 - padX
  const by = mid.y - fontSize - padY - 4 * inv
  roundRect(ctx, bx, by, tw + padX * 2, fontSize + padY * 2, 8 * inv)
  ctx.fill()
  ctx.fillStyle = color
  ctx.fillText(label, mid.x - tw / 2, mid.y - 8 * inv)
  ctx.restore()
}

function drawHandle(
  ctx: CanvasRenderingContext2D,
  p: Point,
  color: string,
  pulse: boolean,
  inv: number,
) {
  const r = Math.max(8, 10 * inv)
  ctx.save()
  if (pulse) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(196, 92, 38, 0.2)'
    ctx.fill()
  }
  // Outer grab ring (finger-friendly visual)
  ctx.beginPath()
  ctx.arc(p.x, p.y, r * 1.55, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = Math.max(2, 3 * inv)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = Math.max(2, 2.5 * inv)
  ctx.stroke()
  ctx.beginPath()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = Math.max(1.5, 2 * inv)
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

// Loupe helper stays above; no unused imports
