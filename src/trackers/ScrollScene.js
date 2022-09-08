import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Scene } from 'three'
import { useFrame, useThree, createPortal } from '@react-three/fiber'
import _lerp from '@14islands/lerp'

import config from '../config'
import { useCanvasStore } from '../store'
import useScrollRig from '../hooks/useScrollRig'
import DebugMesh from '../utils/DebugMesh'
import useElementTracker from './useElementTracker'

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned and scaled exactly above DOM element
 *
 * @author david@14islands.com
 */
let ScrollScene = ({
  el,
  lerp, // override global lerp. don't change if you want to stay synched with the virtual scrollbar
  lerpOffset = 1, // change current lerp by a factor - use this instead of `lerp`
  children,
  renderOrder = 1,
  priority = config.PRIORITY_SCISSORS,
  margin = 14, // Margin outside viewport to avoid clipping vertex displacement (px)
  inViewportMargin,
  visible = true,
  scissor = false,
  debug = false,
  updateLayout = 0,
  positionFixed = false,
  hiddenStyle = { opacity: 0 },
  resizeDelay = 0,
  as = 'scene',
  autoRender = true,
  hideOffscreen = true,
  position = null,
  ...props
}) => {
  const inlineSceneRef = useCallback((node) => {
    if (node !== null) {
      setScene(node)
    }
  }, [])

  const [scene, setScene] = useState(scissor ? new Scene() : null)

  const [inViewport, setInViewport] = useState(false)
  const { size, invalidate } = useThree()
  const { requestRender, renderScissor } = useScrollRig()
  const pageReflowCompleted = useCanvasStore((state) => state.pageReflowCompleted)

  const { bounds, scale, getPosition, getScrollState } = useElementTracker(el, [
    pageReflowCompleted,
    updateLayout,
    scene,
  ])

  // non-reactive state
  const transient = useRef({
    mounted: false,
    isFirstRender: true,
    scrollState: {
      inViewport: false,
      progress: 0,
      viewport: 0,
      visibility: 0,
    },
    prevBounds: { y: 0 },
  }).current

  useEffect(() => {
    transient.mounted = true
    return () => (transient.mounted = false)
  }, [])

  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!el?.current) return

    if (debug) {
      el.current.style.opacity = 0.5
    } else {
      Object.assign(el.current.style, {
        ...hiddenStyle,
      })
    }

    transient.isFirstRender = true

    return () => {
      if (!el?.current) return
      Object.keys(hiddenStyle).forEach((key) => (el.current.style[key] = ''))
    }
  }, [el])

  const updateSizeAndPosition = () => {
    if (!el || !el.current || !scene) {
      return
    }

    const { prevBounds } = transient

    // place horizontally
    console.log('getPosition().x', getPosition().x, bounds.left, bounds.sceneOffset)
    scene.position.x = getPosition().x

    // prevents ghost lerp on first render
    if (transient.isFirstRender) {
      prevBounds.y = bounds.y
      transient.isFirstRender = false
    }

    invalidate() // trigger render
  }

  // Find bounding box & scale mesh on resize
  useLayoutEffect(() => {
    // const timer = setTimeout(() => {
    updateSizeAndPosition()
    // }, resizeDelay)
    // return () => {
    //   clearTimeout(timer)
    // }
  }, [el, pageReflowCompleted, updateLayout, scene])

  // RENDER FRAME
  useFrame(({ gl, camera }) => {
    if (!scene || !scale) return

    const { x, y, positiveYUpBottom } = getPosition()
    const { inViewport } = getScrollState()

    // hide/show scene
    scene.visible = hideOffscreen ? inViewport && visible : visible

    if (scene.visible) {
      // move scene
      if (!positionFixed) {
        scene.position.y = -y
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
          el,
          lerp: lerp || config.scrollLerp,
          lerpOffset,
          margin,
          renderOrder,
          // new props
          scale,
          scaleObj: { width: scale[0], height: scale[1] },
          state: transient, // @deprecated
          scrollState: getScrollState(),
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
  return scissor ? (
    createPortal(content, scene)
  ) : (
    <InlineElement ref={inlineSceneRef} position={position}>
      {content}
    </InlineElement>
  )
}

ScrollScene = React.memo(ScrollScene)

ScrollScene.propTypes = {
  el: PropTypes.object, // DOM element to track,
  lerp: PropTypes.number, // Base lerp ratio
  lerpOffset: PropTypes.number, // Offset factor applied to `lerp`
  renderOrder: PropTypes.number, // threejs render order
  visible: PropTypes.bool, // threejs render order,
  margin: PropTypes.number, // custom margin around DOM el when using scissor to avoid clipping
  scissor: PropTypes.bool, // render using scissor test for better peformance
  priority: PropTypes.number, // useFrame priority
  debug: PropTypes.bool, // show debug mesh
  positionFixed: PropTypes.bool, // scene stays fixed in viewport and doesn't follow scroll direction
}

ScrollScene.childPropTypes = {
  ...ScrollScene.propTypes,
  scale: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  state: PropTypes.shape({
    bounds: PropTypes.shape({
      left: PropTypes.number,
      top: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
      inViewport: PropTypes.bool,
      progress: PropTypes.number,
      visibility: PropTypes.number,
      viewport: PropTypes.number,
    }),
  }),
  scene: PropTypes.object, // Parent scene,
  inViewport: PropTypes.bool, // {x,y} to scale
}

ScrollScene.priority = config.PRIORITY_SCISSORS

export { ScrollScene }
export default ScrollScene
