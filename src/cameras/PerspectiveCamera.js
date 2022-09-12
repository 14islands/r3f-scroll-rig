import React, { useRef, forwardRef, useLayoutEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useThree } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

import useCanvasStore from '../store'
import config from '../config'

export const PerspectiveCamera = forwardRef(
  ({ makeDefault = false, scaleMultiplier = config.scaleMultiplier, ...props }, ref) => {
    const set = useThree((state) => state.set)
    const camera = useThree((state) => state.camera)
    const size = useThree((state) => state.size)

    const pageReflow = useCanvasStore((state) => state.pageReflow)

    const distance = useMemo(() => {
      const width = size.width * scaleMultiplier
      const height = size.height * scaleMultiplier
      return Math.max(width, height)
    }, [size, pageReflow, scaleMultiplier])

    const cameraRef = useRef()
    useLayoutEffect(() => {
      const width = size.width * scaleMultiplier
      const height = size.height * scaleMultiplier

      cameraRef.current.aspect = width / height
      cameraRef.current.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance))
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
      <perspectiveCamera
        ref={mergeRefs([cameraRef, ref])}
        position={[0, 0, distance]}
        onUpdate={(self) => self.updateProjectionMatrix()}
        near={0.1}
        far={distance * 2}
        {...props}
      />
    )
  }
)

PerspectiveCamera.propTypes = {
  makeDefault: PropTypes.bool,
  scaleMultiplier: PropTypes.number,
}

PerspectiveCamera.displayName = 'PerspectiveCamera'

export default PerspectiveCamera
