import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import { MathUtils } from 'three'
import { useFrame, useThree } from 'react-three-fiber'
import { useViewportScroll } from 'framer-motion'

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
  lerp = config.scrollLerp,
  lerpOffset = 0,
  children,
  renderOrder = 1,
  margin = 14, // Margin outside viewport to avoid clipping vertex displacement (px)
  inViewportMargin, // Margin outside viewport to avoid clipping vertex displacement (px)
  visible = true,
  scissor = false,
  debug = false,
  softDirection = false, // experimental
  setInViewportProp = false,
  updateLayout = 0,
  positionFixed = false,
  scrollY,
  ...props
}) => {
  const scene = useRef()
  const group = useRef()

  const [inViewport, setInViewport] = useState(false)
  const [scale, setScale] = useState({
    width: 1,
    height: 1,
    multiplier: config.scaleMultiplier,
    pixelWidth: 1,
    pixelHeight: 1,
  })
  const { scrollY: framerScrollY } = useViewportScroll()
  const { size } = useThree()
  const { requestFrame, renderFullscreen, renderScissor } = useScrollRig()

  scrollY = scrollY || framerScrollY
  const pageReflowCompleted = useCanvasStore((state) => state.pageReflowCompleted)

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
    prevBounds: { y: 0, direction: 1, directionTime: 0 },
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

  // Trigger render on scroll - if close to viewport
  useEffect(() => scrollY.onChange(requestFrame), [])

  const updateSizeAndPosition = () => {
    if (!el || !el.current) return

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
    scene.current.position.x = bounds.x * config.scaleMultiplier

    // prevents ghost lerp on first render
    if (transient.isFirstRender) {
      prevBounds.y = top - bounds.centerOffset
      transient.isFirstRender = false
    }

    requestFrame() // trigger render
  }

  // Find bounding box & scale mesh on resize
  useLayoutEffect(() => {
    updateSizeAndPosition()
  }, [pageReflowCompleted, updateLayout])

  // RENDER FRAME
  useFrame(({ gl, camera, clock }) => {
    const { bounds, prevBounds } = transient
    const time = clock.getElapsedTime()

    // Find new Y based on cached position and scroll
    const y = bounds.top - scrollY.get() - bounds.centerOffset

    // if previously hidden and now visible, update previous position to not get ghost easing when made visible
    if (scene.current.visible && !bounds.inViewport) {
      prevBounds.y = y
    }

    // direction check
    const direction = Math.sign(scrollY.getVelocity())
    if (direction !== prevBounds.direction && direction !== 0) {
      if (bounds.inViewport) {
        prevBounds.directionTime = time
      }
      prevBounds.direction = direction
    }

    // adjust lerp if direction changed - soft change
    let yLerp = lerp
    if (softDirection) {
      const t = MathUtils.clamp(time - prevBounds.directionTime, 0, 1.0)
      yLerp = MathUtils.lerp(softDirection, lerp, t)
    }

    // frame delta
    const delta = Math.abs(prevBounds.y - y)

    // Lerp the distance to simulate easing
    const lerpY = MathUtils.lerp(prevBounds.y, y, yLerp + lerpOffset)
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
    if (isOffscreen && scene.current.visible) {
      scene.current.visible = false
    } else if (!isOffscreen && !scene.current.visible) {
      scene.current.visible = visible
    }

    if (scene.current.visible) {
      // move scene
      if (!positionFixed) {
        scene.current.position.y = -newY * config.scaleMultiplier
      }

      const positiveYUpBottom = size.height * 0.5 - (newY + scale.pixelHeight * 0.5) // inverse Y
      if (scissor) {
        renderScissor({
          scene: scene.current,
          camera,
          left: bounds.left - margin,
          top: positiveYUpBottom - margin,
          width: bounds.width + margin * 2,
          height: bounds.height + margin * 2,
        })
      } else {
        renderFullscreen()
      }

      // calculate progress of passing through viewport (0 = just entered, 1 = just exited)
      const pxInside = bounds.top - lerpY - bounds.top + size.height - bounds.centerOffset
      bounds.progress = MathUtils.mapLinear(pxInside, 0, size.height + scale.pixelHeight, 0, 1) // percent of total visible distance
      bounds.visibility = MathUtils.mapLinear(pxInside, 0, scale.pixelHeight, 0, 1) // percent of item height in view
      bounds.viewport = MathUtils.mapLinear(pxInside, 0, size.height, 0, 1) // percent of window height scrolled since visible
    }

    // render another frame if delta is large enough
    if (!isOffscreen && delta > config.scrollRestDelta) {
      requestFrame()
    }
  }, config.PRIORITY_SCISSORS + renderOrder)

  // Clear scene from canvas on unmount
  // useEffect(() => {
  //   return () => {
  //     gl.clear()
  //   }
  // }, [])

  // meshBasicMaterial shaders are excluded from prod build
  const renderDebugMesh = () => (
    <mesh>
      <planeBufferGeometry attach="geometry" args={[scale.width, scale.height, 1, 1]} />
      <meshBasicMaterial color="pink" attach="material" transparent opacity={0.5} />
    </mesh>
  )

  return (
    <scene ref={scene} visible={transient.bounds.inViewport && visible}>
      <group renderOrder={renderOrder}>
        {(!children || debug) && renderDebugMesh()}
        {children &&
          children({
            // inherited props
            el,
            lerp,
            lerpOffset,
            margin,
            visible,
            renderOrder,
            // new props
            scale,
            state: transient, // @deprecated
            scrollState: transient.bounds,
            scene: scene.current,
            inViewport,
            // useFrame render priority (in case children need to run after)
            priority: config.PRIORITY_SCISSORS + renderOrder,
            // tunnel the rest
            ...props,
          })}
      </group>
    </scene>
  )
}

ScrollScene = React.memo(ScrollScene)

ScrollScene.propTypes = {
  el: PropTypes.object, // DOM element to track,
  lerp: PropTypes.number, // Base lerp ratio
  lerpOffset: PropTypes.number, // Offset applied to `lerp`
  renderOrder: PropTypes.number, // threejs render order
  visible: PropTypes.bool, // threejs render order,
  margin: PropTypes.number, // custom margin around DOM el to avoid clipping
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
    }),
  }),
  scene: PropTypes.object, // Parent scene,
  inViewport: PropTypes.bool, // {x,y} to scale
}

ScrollScene.priority = config.PRIORITY_SCISSORS

export { ScrollScene }
export default ScrollScene
