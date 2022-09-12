import React, { useRef, useState, useLayoutEffect } from 'react'
import { Scene } from 'three'
import { useFrame, useThree, createPortal } from '@react-three/fiber'
import _lerp from '@14islands/lerp'

import config from '../config'
import { useCanvasStore } from '../store'
import useScrollRig from '../hooks/useScrollRig'
import DebugMesh from '../utils/DebugMesh'
import useTracker from './useTracker'
import useScrollbar from '../scrollbar/useScrollbar'
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
  inViewportMargin = 0,
  visible = true,
  debug = false,
  orthographic = false,
  hiddenStyle = { opacity: 0 },
  renderOrder = 1,
  priority = config.PRIORITY_VIEWPORTS,
  ...props
}) => {
  const camera = useRef()
  const [scene] = useState(() => new Scene())

  const { invalidate } = useThree()
  const { renderViewport } = useScrollRig()
  const { scroll } = useScrollbar()

  const pageReflow = useCanvasStore((state) => state.pageReflow)

  const { update, bounds, scale, position, scrollState, inViewport } = useTracker({ track, inViewportMargin }, [
    pageReflow,
    scene,
  ])

  const [cameraDistance, setCameraDistance] = useState(0)

  // El is rendered
  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!track?.current) return

    if (debug) {
      track.current.style.opacity = 0.5
    } else {
      Object.assign(track.current.style, {
        ...hiddenStyle,
      })
    }

    return () => {
      if (!track?.current) return
      Object.keys(hiddenStyle).forEach((key) => (track.current.style[key] = ''))
    }
  }, [track])

  // Find bounding box & scale mesh on resize
  useLayoutEffect(() => {
    const viewportWidth = bounds.width * config.scaleMultiplier
    const viewportHeight = bounds.height * config.scaleMultiplier
    const cameraDistance = Math.max(viewportWidth, viewportHeight) * config.scaleMultiplier
    setCameraDistance(cameraDistance)

    // Calculate FOV to match the DOM bounds for this camera distance
    if (camera.current && !orthographic) {
      camera.current.aspect =
        (viewportWidth + margin * 2 * config.scaleMultiplier) / (viewportHeight + margin * 2 * config.scaleMultiplier)
      camera.current.fov =
        2 * (180 / Math.PI) * Math.atan((viewportHeight + margin * 2 * config.scaleMultiplier) / (2 * cameraDistance))
      camera.current.updateProjectionMatrix()
      // https://github.com/react-spring/@react-three/fiber/issues/178
      // Update matrix world since the renderer is a frame late
      camera.current.updateMatrixWorld()
    }
    // trigger a frame
    invalidate()
  }, [track, pageReflow, bounds])

  const compute = React.useCallback(
    (event, state) => {
      if (track.current && event.target === track.current) {
        const { width, height, left, top } = bounds
        const x = event.clientX - left + scroll.x
        const y = event.clientY - top + scroll.y
        state.pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
        state.raycaster.setFromCamera(state.pointer, camera.current)
      }
    },
    [bounds, position]
  )

  // RENDER FRAME
  useFrame(({ gl }) => {
    if (!scene || !scale) return

    // update element tracker
    update()

    const { inViewport } = scrollState

    // hide/show scene
    scene.visible = inViewport && visible

    // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas
    if (scene.visible) {
      renderViewport({
        gl,
        scene,
        camera: camera.current,
        left: bounds.left - margin,
        top: position.positiveYUpBottom - margin,
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
            left={scale.width / -2}
            right={scale.width / 2}
            top={scale.height / 2}
            bottom={scale.height / -2}
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
              scene,
              camera: camera.current,
              inViewport,
              // useFrame render priority (in case children need to run after)
              priority: priority + renderOrder,
              // tunnel the rest
              ...props,
            })}
        </group>
      </>,
      scene,
      { events: { compute, priority }, size: { width: bounds.width, height: bounds.height } }
    )
  )
}

ViewportScrollScene = React.memo(ViewportScrollScene)

export { ViewportScrollScene }
export default ViewportScrollScene
