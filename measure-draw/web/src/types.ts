export type Point = { x: number; y: number }

export type Unit = 'mm' | 'cm' | 'in'

export type ToolMode = 'calibrate' | 'measure' | 'select'

export type ReferencePreset = {
  id: string
  label: string
  lengthMm: number
  hint: string
}

export type Calibration = {
  a: Point
  b: Point
  knownLengthMm: number
  presetId: string
  label: string
}

export type Measurement = {
  id: string
  a: Point
  b: Point
  label: string
}

export type Project = {
  imageUrl: string
  imageName: string
  naturalWidth: number
  naturalHeight: number
  calibration: Calibration | null
  measurements: Measurement[]
  unit: Unit
}
