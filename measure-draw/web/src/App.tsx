import { useEffect, useState } from 'react'
import type { Project } from './types'
import { Home } from './components/Home'
import { Workspace } from './components/Workspace'
import './index.css'

export default function App() {
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    return () => {
      if (project?.imageUrl) URL.revokeObjectURL(project.imageUrl)
    }
  }, [project?.imageUrl])

  async function handleImage(file: File) {
    if (project?.imageUrl) URL.revokeObjectURL(project.imageUrl)
    const imageUrl = URL.createObjectURL(file)
    const dims = await readImageSize(imageUrl)
    setProject({
      imageUrl,
      imageName: file.name,
      naturalWidth: dims.width,
      naturalHeight: dims.height,
      calibration: null,
      measurements: [],
      unit: 'cm',
    })
  }

  return (
    <div className="app-shell">
      {project ? (
        <Workspace
          project={project}
          onChange={setProject}
          onReset={() => {
            if (project.imageUrl) URL.revokeObjectURL(project.imageUrl)
            setProject(null)
          }}
        />
      ) : (
        <Home onImage={handleImage} />
      )}
    </div>
  )
}

function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = url
  })
}
