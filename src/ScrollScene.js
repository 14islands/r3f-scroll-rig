import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { MathUtils, Scene } from 'three'
import { useFrame, useThree, createPortal } from 'react-three-fiber'

import requestIdleCallback from './hooks/requestIdleCallback'

import config from './config'
import { useCanvasStore } from './store'
import useScrollRig from './useScrollRig'

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned and scaled exactly above DOM element
 *
 * @author david@14islands.com
 */
let ScrollScene = ({
  el,
  lerp,
  lerpOffset = 0,
  children,
  renderOrder = 1,
  priority = config.PRIORITY_SCISSORS,
  margin = 14, // Margin outside viewport to avoid clipping vertex displacement (px)
  inViewportMargin,
  visible = true,
  scissor = false,
  debug = false,
  setInViewportProp = false,
  updateLayout = 0,
  positionFixed = false,
  ...props
}) => {
  const inlineSceneRef = useCallback((node) => {
    if (node !== null) {
      config.debug && console.log('ScrollScene', 'GOT SCENE REF', node)
      setScene(node)
    }
  }, [])

  const group = useRef()
  const [scene, setScene] = useState(scissor && new Scene())

  const [inViewport, setInViewport] = useState(false)
  const [scale, setScale] = useState({
    width: 1,
    height: 1,
    multiplier: config.scaleMultiplier,
    pixelWidth: 1,
    pixelHeight: 1,
  })
  const { size } = useThree()
  const { invalidate, requestRender, renderScissor } = useScrollRig()
  const pageReflowCompleted = useCanvasStore((state) => state.pageReflowCompleted)

  // get initial scrollY and listen for transient updates
  const scrollY = useRef(useCanvasStore.getState().scrollY)
  useEffect(
    () =>
      useCanvasStore.subscribe(
        (y) => {
          scrollY.current = y
          invalidate() // Trigger render on scroll
        },
        (state) => state.scrollY,
      ),
    [],
  )

  // non-reactive state
  const transient = useRef({
    mounted: false,
    isFirstRender: true,
    bounds: {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      centerOffset: -1,
      x: 0,
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
    el.current.style.opacity = debug ? 0.5 : 0
    return () => {
      if (!el?.current) return
      el.current.style.opacity = ''
    }
  }, [el.current])

  const updateSizeAndPosition = () => {
    if (!el || !el.current || !scene) {
      config.debug && console.log('ScrollScene.updateSizeAndPosition()', 'ABORT', el.current, scene)
      return
    }

    const { bounds, prevBounds } = transient
    const { top, left, width, height } = el.current.getBoundingClientRect()

    // pixel bounds
    bounds.top = top + window.pageYOffset
    bounds.left = left
    bounds.width = width
    bounds.height = height
    bounds.centerOffset = size.height * 0.5 - height * 0.5

    // scale in viewport units and pixel
    setScale({
      width: width * config.scaleMultiplier,
      height: height * config.scaleMultiplier,
      multiplier: config.scaleMultiplier,
      pixelWidth: width,
      pixelHeight: height,
      viewportWidth: size.width * config.scaleMultiplier,
      viewportHeight: size.height * config.scaleMultiplier,
    })

    // place horizontally
    bounds.x = left - size.width * 0.5 + width * 0.5
    scene.position.x = bounds.x * config.scaleMultiplier

    // prevents ghost lerp on first render
    if (transient.isFirstRender) {
      prevBounds.y = top - bounds.centerOffset
      transient.isFirstRender = false
    }

    config.debug && console.log('ScrollScene.updateSizeAndPosition()', 'DONE', scale)

    invalidate() // trigger render
  }

  // Find bounding box & scale mesh on resize
  useLayoutEffect(() => {
    config.debug &&
      console.log('ScrollScene', 'trigger updateSizeAndPosition()', pageReflowCompleted, updateLayout, scene)
    updateSizeAndPosition()
  }, [pageReflowCompleted, updateLayout, scene])

  // RENDER FRAME
  useFrame(({ gl, camera, clock }) => {
    if (!scene) return
    const { bounds, prevBounds } = transient

    // Find new Y based on cached position and scroll
    const initialPos = config.subpixelScrolling
      ? bounds.top - bounds.centerOffset
      : Math.floor(bounds.top - bounds.centerOffset)
    const y = initialPos - scrollY.current

    // if previously hidden and now visible, update previous position to not get ghost easing when made visible
    if (scene.visible && !bounds.inViewport) {
      prevBounds.y = y
    }

    // frame delta
    const delta = Math.abs(prevBounds.y - y)

    // Lerp the distance to simulate easing
    const lerpY = MathUtils.lerp(prevBounds.y, y, (lerp || config.scrollLerp) + lerpOffset)
    const newY = config.subpixelScrolling ? lerpY : Math.floor(lerpY)

    // Abort if element not in screen
    const scrollMargin = inViewportMargin || size.height * 0.33
    const isOffscreen =
      newY + size.height * 0.5 + scale.pixelHeight * 0.5 < -scrollMargin ||
      newY + size.height * 0.5 - scale.pixelHeight * 0.5 > size.height + scrollMargin

    // store top value for next frame
    bounds.inViewport = !isOffscreen
    setInViewportProp && requestIdleCallback(() => transient.mounted && setInViewport(!isOffscreen))
    prevBounds.y = lerpY

    // hide/show scene
    if (isOffscreen && scene.visible) {
      scene.visible = false
    } else if (!isOffscreen && !scene.visible) {
      scene.visible = visible
    }

    if (scene.visible) {
      // move scene
      if (!positionFixed) {
        scene.position.y = -newY * config.scaleMultiplier
      }

      const positiveYUpBottom = size.height * 0.5 - (newY + scale.pixelHeight * 0.5) // inverse Y
      if (scissor) {
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
        requestRender()
      }

      // calculate progress of passing through viewport (0 = just entered, 1 = just exited)
      const pxInside = bounds.top - newY - bounds.top + size.height - bounds.centerOffset
      bounds.progress = MathUtils.mapLinear(pxInside, 0, size.height + scale.pixelHeight, 0, 1) // percent of total visible distance
      bounds.visibility = MathUtils.mapLinear(pxInside, 0, scale.pixelHeight, 0, 1) // percent of item height in view
      bounds.viewport = MathUtils.mapLinear(pxInside, 0, size.height, 0, 1) // percent of window height scrolled since visible
    }

    // render another frame if delta is large enough
    if (!isOffscreen && delta > config.scrollRestDelta) {
      invalidate()
    }
  }, priority)

  // meshBasicMaterial shaders are excluded from prod build
  const renderDebugMesh = () => (
    <mesh>
      <planeBufferGeometry attach="geometry" args={[scale.width, scale.height, 1, 1]} />
      <meshBasicMaterial color="pink" attach="material" transparent opacity={0.5} />
    </mesh>
  )

  const content = (
    <group renderOrder={renderOrder}>
      {(!children || debug) && renderDebugMesh()}
      {children &&
        children({
          // inherited props
          el,
          lerp: lerp || config.scrollLerp,
          lerpOffset,
          margin,
          visible,
          renderOrder,
          // new props
          scale,
          state: transient, // @deprecated
          scrollState: transient.bounds,
          scene,
          inViewport,
          // useFrame render priority (in case children need to run after)
          priority: config.PRIORITY_SCISSORS + renderOrder,
          // tunnel the rest
          ...props,
        })}
    </group>
  )

  // portal if scissor or inline nested scene
  return scissor ? createPortal(content, scene) : <scene ref={inlineSceneRef}>{content}</scene>
}

ScrollScene = React.memo(ScrollScene)

ScrollScene.propTypes = {
  el: PropTypes.object, // DOM element to track,
  lerp: PropTypes.number, // Base lerp ratio
  lerpOffset: PropTypes.number, // Offset applied to `lerp`
  renderOrder: PropTypes.number, // threejs render order
  visible: PropTypes.bool, // threejs render order,
  margin: PropTypes.number, // custom margin around DOM el when using scissor to avoid clipping
  scissor: PropTypes.bool, // render using scissor test for better peformance
  debug: PropTypes.bool, // show debug mesh
  setInViewportProp: PropTypes.bool, // update inViewport property on child (might cause lag)
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
