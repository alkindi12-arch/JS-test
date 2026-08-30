import { useMemo, useState } from 'react'
import { saveAs } from 'file-saver'
import type { Calibration, Measurement, Point, Project, ToolMode, Unit } from '../types'
import { REFERENCE_PRESETS } from '../lib/references'
import { formatLength, lengthMm, mmPerPixel, uid } from '../lib/geometry'
import { exportProjectPng } from '../lib/export'
import { MeasureCanvas, type DragTarget } from './MeasureCanvas'

type Props = {
  project: Project
  onChange: (next: Project) => void
  onReset: () => void
}

export function Workspace({ project, onChange, onReset }: Props) {
  const [mode, setMode] = useState<ToolMode>('calibrate')
  const [pending, setPending] = useState<Point | null>(null)
  const [presetId, setPresetId] = useState(
    project.calibration?.presetId ?? 'credit-card-length',
  )
  const [customMm, setCustomMm] = useState(project.calibration?.knownLengthMm ?? 100)
  const [exporting, setExporting] = useState(false)

  const preset = REFERENCE_PRESETS.find((p) => p.id === presetId) ?? REFERENCE_PRESETS[0]
  const knownMm = presetId === 'custom' ? customMm : preset.lengthMm

  const scale = useMemo(() => {
    if (!project.calibration) return null
    return mmPerPixel(
      project.calibration.knownLengthMm,
      project.calibration.a,
      project.calibration.b,
    )
  }, [project.calibration])

  const canGoNextFromCalibrate = Boolean(project.calibration)

  const hint = useMemo(() => {
    if (mode === 'calibrate') {
      if (!project.calibration && !pending) {
        return `Tap near an end of: ${preset.label}. Pinch to zoom, then drag the handle (loupe helps).`
      }
      if (!project.calibration && pending) {
        return 'Tap the other end. Drag handles — point sits above your finger with a magnifier.'
      }
      return 'Pinch/zoom, drag handles with the loupe, then tap Next.'
    }
    if (!project.calibration) {
      return 'Finish calibration first, then tap Next.'
    }
    if (mode === 'select') {
      return 'Zoom in and drag any handle. Use Measure to add edges.'
    }
    return pending
      ? 'Tap the end of this edge — or drag the open handle (loupe on).'
      : 'Tap roughly, then zoom and drag handles to refine.'
  }, [mode, pending, preset.label, project.calibration])

  function syncCalibrationPoints(a: Point, b: Point) {
    const calibration: Calibration = {
      a,
      b,
      knownLengthMm: knownMm,
      presetId,
      label: presetId === 'custom' ? `Custom ${knownMm} mm` : preset.label,
    }
    onChange({ ...project, calibration })
  }

  function applyPresetToExisting() {
    if (!project.calibration) return
    onChange({
      ...project,
      calibration: {
        ...project.calibration,
        knownLengthMm: knownMm,
        presetId,
        label: presetId === 'custom' ? `Custom ${knownMm} mm` : preset.label,
      },
    })
  }

  function handlePlacePoint(p: Point) {
    if (mode === 'select') return

    if (mode === 'calibrate') {
      if (!project.calibration && !pending) {
        setPending(p)
        return
      }
      if (!project.calibration && pending) {
        syncCalibrationPoints(pending, p)
        setPending(null)
        return
      }
      // Already have calibration — placing replaces by starting a new pair
      setPending(p)
      onChange({ ...project, calibration: null })
      return
    }

    // measure mode
    if (!pending) {
      setPending(p)
      return
    }
    const measurement: Measurement = {
      id: uid(),
      a: pending,
      b: p,
      label: `Edge ${project.measurements.length + 1}`,
    }
    onChange({ ...project, measurements: [...project.measurements, measurement] })
    setPending(null)
  }

  function handleMoveHandle(target: DragTarget, p: Point) {
    if (target.kind === 'pending') {
      setPending(p)
      return
    }
    if (target.kind === 'calibration' && project.calibration) {
      const next = {
        ...project.calibration,
        [target.end]: p,
        knownLengthMm: knownMm,
        presetId,
        label: presetId === 'custom' ? `Custom ${knownMm} mm` : preset.label,
      }
      onChange({ ...project, calibration: next })
      return
    }
    if (target.kind === 'measurement') {
      onChange({
        ...project,
        measurements: project.measurements.map((m) =>
          m.id === target.id ? { ...m, [target.end]: p } : m,
        ),
      })
    }
  }

  function setUnit(unit: Unit) {
    onChange({ ...project, unit })
  }

  function removeMeasurement(id: string) {
    onChange({
      ...project,
      measurements: project.measurements.filter((m) => m.id !== id),
    })
  }

  async function handleExport() {
    setExporting(true)
    try {
      const img = await loadImage(project.imageUrl)
      const blob = await exportProjectPng({
        image: img,
        calibration: project.calibration,
        measurements: project.measurements,
        unit: project.unit,
        title: project.imageName || 'Untitled',
      })
      saveAs(blob, `measure-draw-${Date.now()}.png`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="workspace">
      <header className="topbar">
        <button type="button" className="btn btn-ghost btn-small" onClick={onReset}>
          ← New
        </button>
        <h1>Measure Draw</h1>
        <button
          type="button"
          className="btn btn-accent btn-small"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Saving…' : 'Export'}
        </button>
      </header>

      <div className="canvas-wrap">
        <MeasureCanvas
          imageUrl={project.imageUrl}
          naturalWidth={project.naturalWidth}
          naturalHeight={project.naturalHeight}
          mode={mode}
          calibration={project.calibration}
          measurements={project.measurements}
          pending={pending}
          unit={project.unit}
          onPlacePoint={handlePlacePoint}
          onMoveHandle={handleMoveHandle}
        />
        <div className="hint-chip">{hint}</div>
      </div>

      <div className="dock">
        <div className="mode-tabs" role="tablist" aria-label="Tools">
          <button
            type="button"
            className={mode === 'calibrate' ? 'active' : ''}
            onClick={() => {
              setMode('calibrate')
              setPending(null)
            }}
          >
            Calibrate
          </button>
          <button
            type="button"
            className={mode === 'measure' ? 'active' : ''}
            disabled={!project.calibration}
            onClick={() => {
              if (!project.calibration) return
              setMode('measure')
              setPending(null)
            }}
          >
            Measure
          </button>
          <button
            type="button"
            className={mode === 'select' ? 'active' : ''}
            onClick={() => {
              setMode('select')
              setPending(null)
            }}
          >
            Review
          </button>
        </div>

        {mode === 'calibrate' && (
          <section className="panel">
            <h2>Reference object</h2>
            <div className="row">
              <select
                value={presetId}
                onChange={(e) => {
                  const nextId = e.target.value
                  setPresetId(nextId)
                  const nextPreset =
                    REFERENCE_PRESETS.find((r) => r.id === nextId) ?? REFERENCE_PRESETS[0]
                  const nextMm = nextId === 'custom' ? customMm : nextPreset.lengthMm
                  if (project.calibration) {
                    onChange({
                      ...project,
                      calibration: {
                        ...project.calibration,
                        presetId: nextId,
                        knownLengthMm: nextMm,
                        label:
                          nextId === 'custom'
                            ? `Custom ${nextMm} mm`
                            : nextPreset.label,
                      },
                    })
                  }
                }}
                aria-label="Reference preset"
              >
                {REFERENCE_PRESETS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {presetId === 'custom' && (
              <div className="row">
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={customMm}
                  onChange={(e) => setCustomMm(Number(e.target.value))}
                  onBlur={applyPresetToExisting}
                  aria-label="Custom length in millimetres"
                />
                <span>mm</span>
              </div>
            )}
            <p className={project.calibration ? 'status-ok' : 'status-warn'}>
              {project.calibration
                ? 'Handles placed — drag to fine-tune, then Next.'
                : preset.hint}
            </p>
            <div className="row">
              {project.calibration && (
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    onChange({ ...project, calibration: null })
                    setPending(null)
                  }}
                >
                  Reset points
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary btn-small"
                disabled={!canGoNextFromCalibrate}
                onClick={() => {
                  applyPresetToExisting()
                  setPending(null)
                  setMode('measure')
                }}
              >
                Next → Measure
              </button>
            </div>
          </section>
        )}

        {mode !== 'calibrate' && (
          <section className="panel">
            <h2>Measurements</h2>
            <div className="row">
              <span>Units</span>
              {(['mm', 'cm', 'in'] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={`btn btn-small ${project.unit === u ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setUnit(u)}
                >
                  {u}
                </button>
              ))}
            </div>

            <ul className="measure-list">
              {project.measurements.length === 0 && (
                <li>
                  <span>No edges yet — tap two points, then drag to adjust</span>
                </li>
              )}
              {project.measurements.map((m) => (
                <li key={m.id}>
                  <span>
                    {m.label}: {formatLength(lengthMm(m.a, m.b, scale), project.unit)}
                  </span>
                  <button type="button" onClick={() => removeMeasurement(m.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="drawing-preview" aria-label="Dimensioned drawing preview">
              <DrawingPreview
                measurements={project.measurements}
                scale={scale}
                unit={project.unit}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function DrawingPreview({
  measurements,
  scale,
  unit,
}: {
  measurements: Measurement[]
  scale: number | null
  unit: Unit
}) {
  if (!measurements.length || scale == null) {
    return <p className="status-warn">Drawing appears as you measure.</p>
  }

  const lengths = measurements.map((m) => ({
    id: m.id,
    label: m.label,
    mm: lengthMm(m.a, m.b, scale) ?? 0,
  }))
  const max = Math.max(...lengths.map((l) => l.mm), 1)
  const height = Math.max(72, lengths.length * 36)

  return (
    <svg viewBox={`0 0 320 ${height}`} role="img">
      {lengths.map((l, i) => {
        const y = 22 + i * 36
        const w = Math.max(16, (l.mm / max) * 180)
        return (
          <g key={l.id}>
            <line x1={12} y1={y} x2={12 + w} y2={y} stroke="#c45c26" strokeWidth={4} />
            <circle cx={12} cy={y} r={4} fill="#c45c26" />
            <circle cx={12 + w} cy={y} r={4} fill="#c45c26" />
            <text x={20 + w} y={y + 4} fill="#1a3530" fontSize={12} fontFamily="Manrope, sans-serif">
              {l.label}: {formatLength(l.mm, unit)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}
