import React, { useRef, forwardRef, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import mergeRefs from 'react-merge-refs'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { useCanvasStore } from '../store'

type Props = JSX.IntrinsicElements['perspectiveCamera'] & {
  makeDefault?: boolean
}

export const PerspectiveCamera = forwardRef(({ makeDefault = false, ...props }: Props, ref) => {
  const set = useThree((state) => state.set)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const viewport = useThree((state) => state.viewport)

  const pageReflow = useCanvasStore((state) => state.pageReflow)
  const scaleMultiplier = useCanvasStore((state) => state.scaleMultiplier)

  const distance = useMemo(() => {
    const width = size.width * scaleMultiplier
    const height = size.height * scaleMultiplier
    return Math.max(width, height)
  }, [size, pageReflow, scaleMultiplier])

  const cameraRef = useRef<PerspectiveCameraImpl>(null!)
  useLayoutEffect(() => {
    const width = size.width * scaleMultiplier
    const height = size.height * scaleMultiplier

    cameraRef.current.aspect = width / height
    cameraRef.current.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * cameraRef.current.position.z))

    // TODO: allow specifying desired FoV and set distance accordingly - random WIP stuff belwo
    // cameraRef.current.fov = props.fov
    // const radToDeg = (radians) => radians * (180 / Math.PI)
    // const degToRad = (degrees) => degrees * (Math.PI / 180)
    // const vFOV = props.fov * (Math.PI / 180)
    // const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * cameraRef.current.aspect)
    // cameraRef.current.position.z = cameraRef.current.getFilmHeight() / cameraRef.current.getFocalLength()
    // cameraRef.current.position.z = Math.tan(((hFOV / 2.0) * Math.PI) / 180.0) * 2.0

    cameraRef.current.lookAt(0, 0, 0)
    cameraRef.current.updateProjectionMatrix()
    // https://github.com/react-spring/@react-three/fiber/issues/178
    // Update matrix world since the renderer is a frame late
    cameraRef.current.updateMatrixWorld()
    // update r3f viewport
    viewport.getCurrentViewport()
  }, [distance, size, scaleMultiplier])

  useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera
      set({ camera: cameraRef.current })
      return () => set({ camera: oldCam })
    }
  }, [camera, cameraRef, makeDefault, set])

  return (
    <perspectiveCamera
      ref={mergeRefs([cameraRef, ref])}
      position={[0, 0, distance]}
      onUpdate={(self) => self.updateProjectionMatrix()}
      near={0.1}
      far={distance * 2}
      {...props}
    />
  )
})
