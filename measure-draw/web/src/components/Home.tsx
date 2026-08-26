import { useRef } from 'react'

type Props = {
  onImage: (file: File) => void
}

export function Home({ onImage }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  return (
    <section className="home">
      <p className="brand">Measure Draw</p>
      <p className="tagline">
        Calibrate a photo with a known reference, measure the object, and leave with a
        dimensioned drawing.
      </p>

      <div className="cta-row">
        <button type="button" className="btn btn-primary" onClick={() => cameraRef.current?.click()}>
          Take a photo
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
          Upload from gallery
        </button>
      </div>

      <input
        ref={cameraRef}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onImage(f)
          e.target.value = ''
        }}
      />
      <input
        ref={fileRef}
        className="sr-only"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onImage(f)
          e.target.value = ''
        }}
      />

      <div className="feature-strip">
        <p>
          <strong>1. Calibrate</strong> — tap both ends of a card, ruler, or paper in the photo.
        </p>
        <p>
          <strong>2. Measure</strong> — tap edges of the object; lengths appear as you draw.
        </p>
        <p>
          <strong>3. Export</strong> — share an annotated photo plus a dimensioned sketch.
        </p>
      </div>

      <p className="home-note">
        Works in your phone browser — no App Store install needed for this first version. Put a
        credit card or ruler in the frame for best results. Live LiDAR measuring comes in a later
        native build.
      </p>
    </section>
  )
}
