import React, { useRef, forwardRef, useMemo } from 'react'
import { OrthographicCamera as OrthographicCameraImpl } from 'three'
import { useThree } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { useCanvasStore } from '../store'

type Props = JSX.IntrinsicElements['orthographicCamera'] & {
  makeDefault?: boolean
}
export const OrthographicCamera = forwardRef(({ makeDefault = false, ...props }: Props, ref) => {
  const set = useThree((state) => state.set)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  const pageReflow = useCanvasStore((state) => state.pageReflow)
  const scaleMultiplier = useCanvasStore((state) => state.scaleMultiplier)

  const distance = useMemo(() => {
    const width = size.width * scaleMultiplier
    const height = size.height * scaleMultiplier
    return Math.max(width, height)
  }, [size, pageReflow, scaleMultiplier])

  const cameraRef = useRef<OrthographicCameraImpl>(null!)
  useLayoutEffect(() => {
    cameraRef.current.lookAt(0, 0, 0)
    cameraRef.current.updateProjectionMatrix()
    // https://github.com/react-spring/@react-three/fiber/issues/178
    // Update matrix world since the renderer is a frame late
    cameraRef.current.updateMatrixWorld()
  }, [distance, size])

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
    <orthographicCamera
      left={(size.width * scaleMultiplier) / -2}
      right={(size.width * scaleMultiplier) / 2}
      top={(size.height * scaleMultiplier) / 2}
      bottom={(size.height * scaleMultiplier) / -2}
      far={distance * 2}
      position={[0, 0, distance]}
      near={0.001}
      ref={mergeRefs([cameraRef, ref])}
      onUpdate={(self) => self.updateProjectionMatrix()}
      {...props}
    />
  )
})
