import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import { Math as MathUtils } from 'three'
import { useFrame, useThree } from 'react-three-fiber'
import { useViewportScroll } from 'framer-motion'

import requestIdleCallback from 'lib/requestIdleCallback'
import { config, useCanvasStore, useScrollRig } from 'components/three/scroll-rig'

// Camera layer to not affect global scene
const LAYER = 2

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
  margin = 14, // Margin outside viewport to avoid clipping vertex displacement (px)
  visible = true,
  renderOrder,
  debug = false,
  setInViewportProp = false,
  ...props
}) => {
  const scene = useRef()
  const camera = useRef()

  const state = useRef({
    mounted: false,
    bounds: { top: 0, left: 0, width: 0, height: 0, inViewport: false, progress: 0 },
    prevBounds: { top: 0, left: 0, width: 0, height: 0 },
  }).current

  const [inViewport, setInViewport] = useState(false)
  const [scale, setScale] = useState({ width: 1, height: 1 })
  const { scrollY } = useViewportScroll()
  const { size } = useThree()
  const { requestFrame, renderViewport } = useScrollRig()

  const pageReflowCompleted = useCanvasStore((state) => state.pageReflowCompleted)

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

    setScale({ width, height })

    if (camera.current) {
      camera.current.aspect = (width + margin * 2) / (height + margin * 2)
      camera.current.fov =
        2 * (180 / Math.PI) * Math.atan((height + margin * 2) / (2 * config.cameraDistancePerspective))
      camera.current.updateProjectionMatrix()
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
    if (isOffscreen && scene.current.visible) {
      scene.current.visible = false
    } else if (!isOffscreen && !scene.current.visible) {
      scene.current.visible = visible
    }

    // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas
    if (scene.current.visible) {
      const positiveYUpBottom = size.height - (lerpTop + bounds.height) // inverse Y

      renderViewport(
        scene.current,
        camera.current,
        bounds.left - margin,
        positiveYUpBottom - margin,
        bounds.width + margin * 2,
        bounds.height + margin * 2,
        LAYER,
      )

      // calculate progress of passing through viewport (0 = just entered, 1 = just exited)
      const pxInside = bounds.top - lerpTop - bounds.top + size.height
      bounds.progress = MathUtils.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1)
    }

    // render another frame if delta is large enough
    if (!isOffscreen && delta > config.scrollRestDelta) {
      requestFrame() // FIXME should only requestFrame this render
    }
  }, config.PRIORITY_VIEWPORTS)

  const renderDebugMesh = () => (
    <mesh layers={LAYER}>
      <planeBufferGeometry attach="geometry" args={[config.planeSize, config.planeSize, 1, 1]} />
      <meshBasicMaterial color="pink" attach="material" transparent opacity={0.5} />
    </mesh>
  )

  return (
    <scene ref={scene} visible={visible}>
      {/* Use local camera for viewport rendering */}
      <perspectiveCamera
        ref={camera}
        position={[0, 0, config.cameraDistancePerspective]}
        onUpdate={(self) => self.updateProjectionMatrix()}
      />
      <group scale={[scale.width, scale.height, 1]} renderOrder={renderOrder}>
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
            scale,
            layers: LAYER,
            inViewport,
            // tunnel the rest
            ...props,
          })}
      </group>
    </scene>
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
  layers: PropTypes.number, // webglm renderer layer for child mesh
  inViewport: PropTypes.bool, // {x,y} to scale
}

export default PerspectiveCameraScene
