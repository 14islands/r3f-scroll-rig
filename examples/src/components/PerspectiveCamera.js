import React, { forwardRef, useLayoutEffect } from 'react'
import { useThree, useUpdate } from 'react-three-fiber'
import mergeRefs from 'react-merge-refs'


export const PerspectiveCamera = forwardRef(({ makeDefault = false, ...props }, ref) => {
  const { setDefaultCamera, camera, size } = useThree()
  const cameraRef = useUpdate(
    (cam) => {
      cam.aspect = size.width / size.height
      cam.near = 0.1
      cam.far = Math.max(size.width, size.height) * 2
      cam.fov = 2 * (180 / Math.PI) * Math.atan(size.height / (2 * Math.max(size.width, size.height)))
      cam.updateProjectionMatrix()
    },
    [size, props]
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
      position={[0, 0, Math.max(size.width, size.height)]}
      {...props}
    />
  )
})

export default PerspectiveCamera
