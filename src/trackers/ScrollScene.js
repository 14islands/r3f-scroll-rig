import React, { useState, useLayoutEffect, useCallback } from 'react'
import { Scene } from 'three'
import { useFrame, createPortal } from '@react-three/fiber'
import _lerp from '@14islands/lerp'

import config from '../config'
import { useCanvasStore } from '../store'
import useScrollRig from '../hooks/useScrollRig'
import DebugMesh from '../utils/DebugMesh'
import useTracker from './useTracker'

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
  inViewportMargin = 0,
  visible = true,
  scissor = false,
  debug = false,
  positionFixed = false,
  hiddenStyle = { opacity: 0 },
  as = 'scene',
  autoRender = true,
  hideOffscreen = true,
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

  const { update, bounds, scale, position, scrollState, inViewport } = useTracker({ track, inViewportMargin }, [
    pageReflow,
    scene,
  ])

  console.log('ScrollScene', bounds, scale, position, scrollState, inViewport)

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

  // RENDER FRAME
  useFrame(({ gl, camera }) => {
    if (!scene || !scale) return

    // update element tracker
    update()

    const { x, y, positiveYUpBottom } = position
    const { inViewport } = scrollState

    // hide/show scene
    scene.visible = hideOffscreen ? inViewport && visible : visible

    if (scene.visible) {
      // move scene
      if (!positionFixed) {
        scene.position.y = y
        scene.position.x = x
      }

      if (scissor) {
        autoRender &&
          renderScissor({
            gl,
            scene,
            camera,
            left: bounds.left - margin,
            top: positiveYUpBottom - margin,
            width: bounds.width + margin * 2,
            height: bounds.height + margin * 2,
          })
      } else {
        autoRender && requestRender()
      }
    }
  }, priority)

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
          scale, // array
          scaleObj: { width: scale[0], height: scale[1] },
          scrollState,
          scene,
          inViewport,
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
