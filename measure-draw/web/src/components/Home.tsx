import { useRef, useState } from 'react'

type Props = {
  onImage: (file: File) => void
}

export function Home({ onImage }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [showLidar, setShowLidar] = useState(false)

  if (showLidar) {
    return (
      <section className="home">
        <p className="brand">Live LiDAR</p>
        <p className="tagline">
          Point the Pro camera at an object — the phone draws edges and reads dimensions using
          depth, without a credit-card reference.
        </p>

        <div className="feature-strip">
          <p>
            <strong>What App Store apps do</strong> — Apple Measure auto-outlines rectangles;
            Polycam / 3D Scanner / magicplan / iLidar scan meshes or rooms; TapeAR auto-measures
            flat clothing with LiDAR.
          </p>
          <p>
            <strong>How it works on Apple</strong> — ARKit + LiDAR depth mesh, Vision rectangle
            detection, RoomPlan for rooms, Object Capture for object bounding boxes.
          </p>
          <p>
            <strong>Why it is not in this web build</strong> — Safari cannot access the iPhone
            LiDAR scanner. Live edge measure needs a native iOS app (Swift + ARKit) and TestFlight.
          </p>
          <p>
            <strong>Our plan</strong> — keep Photo Calibrate for every phone; add a native Live
            LiDAR mode that auto-detects cuboids/edges, lets you drag handles, and feeds the same
            dimensioned drawing export. See <code>docs/lidar-live-measure.md</code>.
          </p>
        </div>

        <div className="cta-row">
          <button type="button" className="btn btn-primary" onClick={() => setShowLidar(false)}>
            Use photo calibrate instead
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setShowLidar(false)}>
            ← Back
          </button>
        </div>
      </section>
    )
  }

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
        <button type="button" className="btn btn-secondary" onClick={() => setShowLidar(true)}>
          Live LiDAR (Pro) — plan
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
          <strong>1. Calibrate</strong> — tap both ends of a card or ruler, then drag the handles
          until they sit correctly. Tap Next when ready.
        </p>
        <p>
          <strong>2. Measure</strong> — tap edges of the object; drag handles to refine. The
          drawing builds as you go.
        </p>
        <p>
          <strong>3. Export</strong> — share an annotated photo plus a dimensioned sketch.
        </p>
      </div>

      <p className="home-note">
        Photo mode works in any phone browser. Live LiDAR edge measure needs an iPhone Pro native
        build — open “Live LiDAR (Pro) — plan” for the investigation.
      </p>
    </section>
  )
}
