import React, { useRef, forwardRef, useMemo, useImperativeHandle } from 'react'
import { useThree } from '@react-three/fiber'
import { PerspectiveCamera as PerspectiveCameraImpl } from 'three'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { useCanvasStore } from '../store'

type Props = JSX.IntrinsicElements['perspectiveCamera'] & {
  makeDefault?: boolean
  margin?: number
}

const DEFAULT_FOV = 50

export const PerspectiveCamera = forwardRef(({ makeDefault = false, margin = 0, ...props }: Props, ref) => {
  const set = useThree((state) => state.set)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const viewport = useThree((state) => state.viewport)
  const cameraRef = useRef<PerspectiveCameraImpl>(null!)
  useImperativeHandle(ref, () => cameraRef.current)

  const pageReflow = useCanvasStore((state) => state.pageReflow)
  const scaleMultiplier = useCanvasStore((state) => state.scaleMultiplier)

  // Calculate FoV or distance to match DOM size
  const { fov, distance, aspect } = useMemo(() => {
    const width = (size.width + margin * 2) * scaleMultiplier
    const height = (size.height + margin * 2) * scaleMultiplier
    const aspect = width / height

    // check props vs defaults
    let fov = props.fov || DEFAULT_FOV
    let distance = (props?.position as number[])?.[2]

    // calculate either FoV or distance to match scale
    if (distance) {
      // calculate FoV based on distance
      fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance))
    } else {
      // calculate distance for specified FoV
      const ratio = Math.tan(((fov / 2.0) * Math.PI) / 180.0) * 2.0
      distance = height / ratio
    }

    return { fov, distance, aspect }
  }, [size, scaleMultiplier, pageReflow])

  // Update camera projection and R3F viewport
  useLayoutEffect(() => {
    cameraRef.current.lookAt(0, 0, 0)
    cameraRef.current.updateProjectionMatrix()
    // https://github.com/react-spring/@react-three/fiber/issues/178
    // Update matrix world since the renderer is a frame late
    cameraRef.current.updateMatrixWorld()
    // update r3f viewport which is lagging on resize
    set((state) => ({ viewport: { ...state.viewport, ...viewport.getCurrentViewport(camera) } }))
  }, [size, scaleMultiplier, pageReflow])

  useLayoutEffect(() => {
    if (makeDefault) {
      const oldCam = camera
      set(() => ({ camera: cameraRef.current! }))
      return () => set(() => ({ camera: oldCam }))
    }
    // The camera should not be part of the dependency list because this components camera is a stable reference
    // that must exchange the default, and clean up after itself on unmount.
  }, [cameraRef, makeDefault, set])

  return (
    <perspectiveCamera
      ref={cameraRef}
      position={[0, 0, distance]}
      onUpdate={(self) => self.updateProjectionMatrix()}
      near={0.1}
      aspect={aspect}
      fov={fov}
      far={distance * 2}
      {...props}
    />
  )
})
