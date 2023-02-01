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
  const cameraRef = useRef<PerspectiveCameraImpl>(null!)

  const pageReflow = useCanvasStore((state) => state.pageReflow)
  const scaleMultiplier = useCanvasStore((state) => state.scaleMultiplier)

  // Calculate FoV or distance to match DOM size
  const { fov, distance, aspect } = useMemo(() => {
    const width = size.width * scaleMultiplier
    const height = size.height * scaleMultiplier
    const aspect = width / height

    // check props vs defaults
    let fov = props.fov
    let distance = (props?.position as number[])?.[2] || Math.max(width, height)

    // calculate either FoV or distance to match scale
    if (fov) {
      // calculate distance for specified FoV
      const ratio = Math.tan(((fov / 2.0) * Math.PI) / 180.0) * 2.0
      distance = height / ratio
    } else {
      // calculate FoV based on distance
      fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance))
    }

    return { fov, distance, aspect }
  }, [size, scaleMultiplier, pageReflow])

  // Update camera projection and R3F viewport
  useLayoutEffect(() => {
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
      ref={mergeRefs([cameraRef, ref])}
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
