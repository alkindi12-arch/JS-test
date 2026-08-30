import type { ReferencePreset } from '../types'

/** Common physical references for photo calibration. */
export const REFERENCE_PRESETS: ReferencePreset[] = [
  {
    id: 'credit-card-width',
    label: 'Credit card (short side)',
    lengthMm: 53.98,
    hint: 'Align across the short edge of a card',
  },
  {
    id: 'credit-card-length',
    label: 'Credit card (long side)',
    lengthMm: 85.6,
    hint: 'Align along the long edge of a card',
  },
  {
    id: 'a4-short',
    label: 'A4 paper (short side)',
    lengthMm: 210,
    hint: 'ISO A4 short edge',
  },
  {
    id: 'a4-long',
    label: 'A4 paper (long side)',
    lengthMm: 297,
    hint: 'ISO A4 long edge',
  },
  {
    id: 'letter-short',
    label: 'US Letter (short side)',
    lengthMm: 215.9,
    hint: '8.5 inches',
  },
  {
    id: 'letter-long',
    label: 'US Letter (long side)',
    lengthMm: 279.4,
    hint: '11 inches',
  },
  {
    id: 'us-quarter',
    label: 'US quarter diameter',
    lengthMm: 24.26,
    hint: 'Across the coin',
  },
  {
    id: 'ruler-10cm',
    label: 'Ruler 10 cm',
    lengthMm: 100,
    hint: 'Mark 0 to 10 cm on a ruler in the photo',
  },
  {
    id: 'custom',
    label: 'Custom length…',
    lengthMm: 100,
    hint: 'Enter any known length in millimetres',
  },
]
