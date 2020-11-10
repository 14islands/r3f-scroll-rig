import React, { forwardRef, useLayoutEffect, useMemo } from 'react'
import { useThree, useUpdate } from 'react-three-fiber'
import mergeRefs from 'react-merge-refs'
import { useScrollRig, config } from '@14islands/r3f-scroll-rig'

export const OrthographicCamera = forwardRef(({ makeDefault = false, scaleMultiplier = config.scaleMultiplier, ...props }, ref) => {
  const { setDefaultCamera, camera, size } = useThree()
  const { reflowCompleted } = useScrollRig()

  const distance = useMemo(() => {
    const width = size.width * scaleMultiplier
    const height = size.height * scaleMultiplier
    return Math.max(width, height)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, reflowCompleted, scaleMultiplier])

  const cameraRef = useUpdate((cam) => {
    cam.lookAt(0, 0, 0)
    cam.updateProjectionMatrix()
    // https://github.com/react-spring/react-three-fiber/issues/178
    // Update matrix world since the renderer is a frame late
    cam.updateMatrixWorld()
  }, [distance, size])

  useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera
      setDefaultCamera(cameraRef.current)
      return () => setDefaultCamera(oldCam)
    }
  }, [camera, cameraRef, makeDefault, setDefaultCamera])

  return (
    <orthographicCamera
      left={size.width * scaleMultiplier / -2}
      right={size.width * scaleMultiplier / 2}
      top={size.height * scaleMultiplier / 2}
      bottom={size.height * scaleMultiplier / -2}
      far={distance * 2}
      position={[0, 0, distance]}
      near={0.001}
      ref={mergeRefs([cameraRef, ref])}
      onUpdate={(self) => self.updateProjectionMatrix()}
      {...props}
    />
  )
})

export default OrthographicCamera

