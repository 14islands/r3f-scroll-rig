import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import { Math as MathUtils, Scene } from 'three'
import { useFrame, useThree, createPortal } from 'react-three-fiber'
import { useViewportScroll } from 'framer-motion'

import requestIdleCallback from './hooks/requestIdleCallback'

import config from './config'
import { useCanvasStore } from './store'
import useScrollRig from './useScrollRig'

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is rendered into a GL viewport matching the DOM position for better performance
 *
 * Adapted to react-three-fiber from https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
 * @author david@14islands.com
 */
let PerspectiveCameraScene = ({
  el,
  lerp = config.scrollLerp,
  lerpOffset = 0,
  children,
  margin = 0, // Margin outside viewport to avoid clipping vertex displacement (px)
  visible = true,
  renderOrder,
  debug = false,
  setInViewportProp = false,
  renderOnTop = false,
  ...props
}) => {
  // const scene = useRef()
  const camera = useRef()
  const [scene] = useState(() => new Scene())

  const [inViewport, setInViewport] = useState(false)
  const [scale, setScale] = useState({
    width: 1,
    height: 1,
    multiplier: config.scaleMultiplier,
    pixelWidth: 1,
    pixelHeight: 1,
  })
  const { scrollY } = useViewportScroll()
  const { size } = useThree()
  const { requestFrame, renderViewport } = useScrollRig()

  const pageReflowCompleted = useCanvasStore((state) => state.pageReflowCompleted)

  const [cameraDistance, setCameraDistance] = useState(0)

  // transient state
  const state = useRef({
    mounted: false,
    bounds: { top: 0, left: 0, width: 0, height: 0, inViewport: false, progress: 0, window: size },
    prevBounds: { top: 0, left: 0, width: 0, height: 0 },
  }).current

  // Clear scene from canvas on unmount
  useEffect(() => {
    state.mounted = true
    return () => {
      state.mounted = false
      // gl.clear()
    }
  }, [])

  // El is rendered
  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!el?.current) return
    el.current.style.opacity = debug ? 0.5 : 0
    return () => {
      if (!el?.current) return
      el.current.style.opacity = ''
    }
  }, [el.current])

  // Trigger render on scroll
  useEffect(() => scrollY.onChange(requestFrame), [])

  const updateSizeAndPosition = () => {
    if (!el || !el.current) return

    const { top, left, width, height } = el.current.getBoundingClientRect()

    state.bounds.top = top + window.pageYOffset
    state.bounds.left = left
    state.bounds.width = width
    state.bounds.height = height
    state.prevBounds.top = top

    const viewportWidth = width * config.scaleMultiplier
    const viewportHeight = height * config.scaleMultiplier

    setScale({
      width: viewportWidth,
      height: viewportHeight,
      multiplier: config.scaleMultiplier,
      pixelWidth: width,
      pixelHeight: height,
    })
    const cameraDistance = Math.max(viewportWidth, viewportHeight)
    setCameraDistance(cameraDistance)

    if (camera.current) {
      camera.current.aspect = (viewportWidth + margin * 2) / (viewportHeight + margin * 2)
      camera.current.fov = 2 * (180 / Math.PI) * Math.atan((viewportHeight + margin * 2) / (2 * cameraDistance))
      camera.current.updateProjectionMatrix()
      // https://github.com/react-spring/react-three-fiber/issues/178
      // Update matrix world since the renderer is a frame late
      camera.current.updateMatrixWorld()
    }

    requestFrame() // trigger render
  }

  // Find bounding box & scale mesh on resize
  useLayoutEffect(() => {
    updateSizeAndPosition()
  }, [pageReflowCompleted])

  // RENDER FRAME
  useFrame(() => {
    if (!scene) return
    const { bounds, prevBounds } = state

    // add scroll value to bounds to get current position
    const topY = bounds.top - scrollY.get()

    // frame delta
    const delta = Math.abs(prevBounds.top - topY)

    // Lerp the distance to simulate easing
    const lerpTop = MathUtils.lerp(prevBounds.top, topY, lerp + lerpOffset)

    // Abort if element not in screen
    const isOffscreen = lerpTop + bounds.height < -100 || lerpTop > size.height + 100

    // store top value for next frame
    bounds.inViewport = !isOffscreen
    setInViewportProp && requestIdleCallback(() => state.mounted && setInViewport(!isOffscreen))
    prevBounds.top = lerpTop

    // hide/show scene
    if (isOffscreen && scene.visible) {
      scene.visible = false
    } else if (!isOffscreen && !scene.visible) {
      scene.visible = visible
    }

    // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas
    if (scene.visible) {
      const positiveYUpBottom = size.height - (lerpTop + bounds.height) // inverse Y

      renderViewport({
        scene,
        camera: camera.current,
        left: bounds.left - margin,
        top: positiveYUpBottom - margin,
        width: bounds.width + margin * 2,
        height: bounds.height + margin * 2,
        renderOnTop,
      })

      // calculate progress of passing through viewport (0 = just entered, 1 = just exited)
      const pxInside = bounds.top - lerpTop - bounds.top + size.height
      bounds.progress = MathUtils.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1) // percent of total visible distance
      bounds.visibility = MathUtils.mapLinear(pxInside, 0, bounds.height, 0, 1) // percent of item height in view
      bounds.viewport = MathUtils.mapLinear(pxInside, 0, size.height, 0, 1) // percent of window height scrolled since visible
    }

    // render another frame if delta is large enough
    if (!isOffscreen && delta > config.scrollRestDelta) {
      requestFrame()
    }
  }, config.PRIORITY_VIEWPORTS + renderOrder)

  const renderDebugMesh = () => (
    <mesh>
      <planeBufferGeometry attach="geometry" args={[scale.width, scale.height, 1, 1]} />
      <meshBasicMaterial color="pink" attach="material" transparent opacity={0.5} />
    </mesh>
  )

  return createPortal(
    <>
      {/* Use local camera for viewport rendering */}
      <perspectiveCamera
        ref={camera}
        position={[0, 0, cameraDistance]}
        onUpdate={(self) => self.updateProjectionMatrix()}
      />

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
            state,
            scene,
            camera: camera.current,
            scale,
            inViewport,
            // tunnel the rest
            ...props,
          })}
      </group>
    </>,
    scene,
  )
}

PerspectiveCameraScene = React.memo(PerspectiveCameraScene)

PerspectiveCameraScene.propTypes = {
  el: PropTypes.object, // DOM element to track,
  lerp: PropTypes.number, // Base lerp ratio
  lerpOffset: PropTypes.number, // Offset applied to `lerp`
  visible: PropTypes.bool,
  margin: PropTypes.number, // custom margin around scissor to impact clipping
  renderOrder: PropTypes.number,
  debug: PropTypes.bool, // show debug mesh
  setInViewportProp: PropTypes.bool, // update inViewport property on child (might cause lag)
}

PerspectiveCameraScene.childPropTypes = {
  ...PerspectiveCameraScene.propTypes,
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
    }),
  }),
  scene: PropTypes.object, // Parent scene,
  inViewport: PropTypes.bool, // {x,y} to scale
}

export { PerspectiveCameraScene }
export default PerspectiveCameraScene
