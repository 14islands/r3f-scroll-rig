import React, { useState, useCallback, useLayoutEffect } from 'react'
import { Scene } from 'three'
import { useFrame, createPortal } from '@react-three/fiber'

import config from '../config'
import { useCanvasStore } from '../store'
import useScrollRig from '../hooks/useScrollRig'
import DebugMesh from './DebugMesh'
import useTracker from '../hooks/useTracker'

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned and scaled exactly above DOM element
 *
 * @author david@14islands.com
 */
let ScrollScene = ({
  track,
  children,
  margin = 0, // Margin outside scissor to avoid clipping vertex displacement (px)
  inViewportMargin,
  visible = true,
  hideOffscreen = true,
  scissor = false,
  debug = false,
  as = 'scene',
  renderOrder = 1,
  priority = config.PRIORITY_SCISSORS,
  ...props
}) => {
  const inlineSceneRef = useCallback((node) => {
    if (node !== null) {
      setScene(node)
    }
  }, [])

  const [scene, setScene] = useState(scissor ? new Scene() : null)
  const { requestRender, renderScissor } = useScrollRig()
  const pageReflow = useCanvasStore((state) => state.pageReflow)
  const globalRender = useCanvasStore((state) => state.globalRender)

  const { update, bounds, scale, position, scrollState, inViewport } = useTracker(
    { track, rootMargin: inViewportMargin },
    [pageReflow, scene]
  )

  // Hide scene when outside of viewport if `hideOffscreen` or set to `visible` prop
  useLayoutEffect(() => {
    if (scene) scene.visible = hideOffscreen ? inViewport && visible : visible
  }, [scene, inViewport, hideOffscreen, visible])

  // RENDER FRAME
  useFrame(
    ({ gl, camera }) => {
      if (!scene || !scale) return

      // update element tracker
      update()

      if (scene.visible) {
        // move scene
        scene.position.y = position.y
        scene.position.x = position.x

        if (scissor) {
          renderScissor({
            gl,
            scene,
            camera,
            left: bounds.left - margin,
            top: position.positiveYUpBottom - margin,
            width: bounds.width + margin * 2,
            height: bounds.height + margin * 2,
          })
        } else {
          requestRender()
        }
      }
    },
    globalRender ? priority : undefined
  )

  const content = (
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
          // useFrame render priority (in case children need to run after)
          priority: priority + renderOrder,
          // tunnel the rest
          ...props,
        })}
    </group>
  )

  // portal if scissor or inline nested scene
  const InlineElement = as
  return scissor ? createPortal(content, scene) : <InlineElement ref={inlineSceneRef}>{content}</InlineElement>
}

ScrollScene = React.memo(ScrollScene)

export { ScrollScene }
export default ScrollScene
