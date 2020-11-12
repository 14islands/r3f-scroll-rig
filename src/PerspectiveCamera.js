import React, { forwardRef, useLayoutEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useThree, useUpdate } from 'react-three-fiber'
import mergeRefs from 'react-merge-refs'
import { useScrollRig, config } from '@14islands/r3f-scroll-rig'

export const PerspectiveCamera = forwardRef(
  ({ makeDefault = false, scaleMultiplier = config.scaleMultiplier, ...props }, ref) => {
    const { setDefaultCamera, camera, size } = useThree()
    const { reflowCompleted } = useScrollRig()

    const distance = useMemo(() => {
      const width = size.width * scaleMultiplier
      const height = size.height * scaleMultiplier
      return Math.max(width, height)
    }, [size, reflowCompleted, scaleMultiplier])

    const cameraRef = useUpdate(
      (cam) => {
        const width = size.width * scaleMultiplier
        const height = size.height * scaleMultiplier

        cam.aspect = width / height
        cam.near = 0.1
        cam.far = distance * 2
        cam.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance))
        cam.lookAt(0, 0, 0)
        cam.updateProjectionMatrix()
        // https://github.com/react-spring/react-three-fiber/issues/178
        // Update matrix world since the renderer is a frame late
        cam.updateMatrixWorld()
      },
      [distance, size],
    )

    useLayoutEffect(() => {
      if (makeDefault && cameraRef.current) {
        const oldCam = camera
        setDefaultCamera(cameraRef.current)
        return () => setDefaultCamera(oldCam)
      }
    }, [camera, cameraRef, makeDefault, setDefaultCamera])

    return (
      <perspectiveCamera
        ref={mergeRefs([cameraRef, ref])}
        position={[0, 0, distance]}
        onUpdate={(self) => self.updateProjectionMatrix()}
        {...props}
      />
    )
  },
)

PerspectiveCamera.propTypes = {
  makeDefault: PropTypes.bool,
  scaleMultiplier: PropTypes.number,
}

PerspectiveCamera.displayName = 'PerspectiveCamera'

export default PerspectiveCamera
