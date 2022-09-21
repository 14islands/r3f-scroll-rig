import React, { useRef, forwardRef, useLayoutEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useThree } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

import useCanvasStore from '../store'

export const OrthographicCamera = forwardRef(({ makeDefault = false, ...props }, ref) => {
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

  const cameraRef = useRef()
  useLayoutEffect(() => {
    cameraRef.current.lookAt(0, 0, 0)
    cameraRef.current.updateProjectionMatrix()
    // https://github.com/react-spring/@react-three/fiber/issues/178
    // Update matrix world since the renderer is a frame late
    cameraRef.current.updateMatrixWorld()
  }, [distance, size])

  useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera
      set({ camera: cameraRef.current })
      return () => set({ camera: oldCam })
    }
  }, [camera, cameraRef, makeDefault, set])

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

OrthographicCamera.propTypes = {
  makeDefault: PropTypes.bool,
  scaleMultiplier: PropTypes.number,
}

OrthographicCamera.displayName = 'OrthographicCamera'

export default OrthographicCamera
