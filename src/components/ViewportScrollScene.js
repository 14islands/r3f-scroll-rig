import React, { useRef, useState, useLayoutEffect } from 'react'
import { Scene } from 'three'
import { useFrame, createPortal, invalidate } from '@react-three/fiber'

import config from '../config'
import { useCanvasStore } from '../store'
import useScrollRig from '../hooks/useScrollRig'
import DebugMesh from './DebugMesh'
import useTracker from '../hooks/useTracker'

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is rendered into a GL viewport matching the DOM position for better performance
 *
 * Adapted to @react-three/fiber from https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
 * @author david@14islands.com
 */
let ViewportScrollScene = ({
  track,
  children,
  margin = 0, // Margin outside viewport to avoid clipping vertex displacement (px)
  inViewportMargin,
  inViewportThreshold,
  visible = true,
  hideOffscreen = true,
  debug = false,
  orthographic = false,
  renderOrder = 1,
  priority = config.PRIORITY_VIEWPORTS,
  ...props
}) => {
  const camera = useRef()
  const [scene] = useState(() => new Scene())

  // const get = useThree((state) => state.get)
  // const setEvents = useThree((state) => state.setEvents)

  const { renderViewport } = useScrollRig()

  const pageReflow = useCanvasStore((state) => state.pageReflow)
  const scaleMultiplier = useCanvasStore((state) => state.scaleMultiplier)

  const { rect, bounds, scale, position, scrollState, inViewport } = useTracker({
    track,
    rootMargin: inViewportMargin,
    threshold: inViewportThreshold,
  })

  // Hide scene when outside of viewport if `hideOffscreen` or set to `visible` prop
  useLayoutEffect(() => {
    scene.visible = hideOffscreen ? inViewport && visible : visible
  }, [inViewport, hideOffscreen, visible])

  const [cameraDistance, setCameraDistance] = useState(0)

  // Find bounding box & scale mesh on resize
  useLayoutEffect(() => {
    const viewportWidth = rect.width * scaleMultiplier
    const viewportHeight = rect.height * scaleMultiplier
    const cameraDistance = Math.max(viewportWidth, viewportHeight)
    setCameraDistance(cameraDistance)

    // Calculate FOV to match the DOM rect for this camera distance
    if (camera.current && !orthographic) {
      camera.current.aspect =
        (viewportWidth + margin * 2 * scaleMultiplier) / (viewportHeight + margin * 2 * scaleMultiplier)
      camera.current.fov =
        2 * (180 / Math.PI) * Math.atan((viewportHeight + margin * 2 * scaleMultiplier) / (2 * cameraDistance))
      camera.current.updateProjectionMatrix()
      // https://github.com/react-spring/@react-three/fiber/issues/178
      // Update matrix world since the renderer is a frame late
      camera.current.updateMatrixWorld()
    }
    // trigger a frame
    invalidate()
  }, [track, pageReflow, rect, scaleMultiplier])

  const compute = React.useCallback(
    (event, state) => {
      // limit events to DOM element bounds
      if (track.current && event.target === track.current) {
        const { width, height, left, top } = bounds
        const mWidth = width + margin * 2
        const mHeight = height + margin * 2
        const x = event.clientX - left + margin
        const y = event.clientY - top + margin
        state.pointer.set((x / mWidth) * 2 - 1, -(y / mHeight) * 2 + 1)
        state.raycaster.setFromCamera(state.pointer, camera.current)
      }
    },
    [bounds, position]
  )

  // Not needed?
  // from: https://github.com/pmndrs/drei/blob/d22fe0f58fd596c7bfb60a7a543cf6c80da87624/src/web/View.tsx#L80
  // but seems to work without it
  // useEffect(() => {
  //   // Connect the event layer to the tracking element
  //   const old = get().events.connected
  //   setEvents({ connected: track.current })
  //   return () => setEvents({ connected: old })
  // }, [])

  // RENDER FRAME
  useFrame(({ gl }) => {
    if (!scene || !scale) return

    // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas
    if (scene.visible) {
      renderViewport({
        gl,
        scene,
        camera: camera.current,
        left: bounds.left - margin,
        top: bounds.positiveYUpBottom - margin,
        width: bounds.width + margin * 2,
        height: bounds.height + margin * 2,
      })
    }
  }, priority)

  return (
    bounds &&
    createPortal(
      <>
        {/* Use local camera for viewport rendering */}
        {!orthographic && (
          <perspectiveCamera
            ref={camera}
            position={[0, 0, cameraDistance]}
            onUpdate={(self) => self.updateProjectionMatrix()}
          />
        )}
        {orthographic && (
          <orthographicCamera
            ref={camera}
            position={[0, 0, cameraDistance]}
            onUpdate={(self) => self.updateProjectionMatrix()}
            left={scale[0] / -2}
            right={scale[0] / 2}
            top={scale[1] / 2}
            bottom={scale[1] / -2}
            far={cameraDistance * 2}
            near={0.001}
          />
        )}

        <group renderOrder={renderOrder}>
          {(!children || debug) && scale && <DebugMesh scale={scale} />}
          {children &&
            scene &&
            scale &&
            children({
              // inherited props
              track,
              margin,
              renderOrder,
              // new props
              scale,
              scrollState,
              inViewport,
              scene,
              camera: camera.current,
              // useFrame render priority (in case children need to run after)
              priority: priority + renderOrder,
              // tunnel the rest
              ...props,
            })}
        </group>
      </>,
      scene,
      { events: { compute, priority }, size: { width: rect.width, height: rect.height } }
    )
  )
}

ViewportScrollScene = React.memo(ViewportScrollScene)

export { ViewportScrollScene }
export default ViewportScrollScene
