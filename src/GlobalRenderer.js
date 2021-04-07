import React, { Suspense, Fragment, useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useThree, useFrame } from '@react-three/fiber'

import config from './config'
import { useCanvasStore } from './store'
import { useScrollRig } from './useScrollRig'

/**
 * Global render loop to avoid double renders on the same frame
 */
const GlobalRenderer = ({ children }) => {
  const scene = useRef()
  const { gl } = useThree()
  const canvasChildren = useCanvasStore((state) => state.canvasChildren)
  const scrollRig = useScrollRig()

  useLayoutEffect(() => {
    gl.debug.checkShaderErrors = config.debug
  }, [])

  // PRELOAD RENDER LOOP
  useFrame(({ camera, scene }) => {
    gl.autoClear = false
    // Render preload frames first and clear directly
    config.preloadQueue.forEach((render) => render(gl))
    if (config.preloadQueue.length) gl.clear()
    // cleanup
    config.preloadQueue = []
    gl.autoClear = true
  }, config.PRIORITY_PRELOAD)

  // GLOBAL RENDER LOOP
  useFrame(({ camera, scene }) => {
    // Global render pass
    if (config.globalRender) {
      if (config.disableAutoClear) {
        gl.autoClear = false // will fail in VR
      }

      // render default layer, scene, camera
      camera.layers.disableAll()
      config.globalRender.forEach((layer) => {
        camera.layers.enable(layer)
      })
      config.clearDepth && gl.clearDepth() // render as HUD over any other renders
      gl.render(scene, camera)

      // cleanup for next frame
      config.globalRender = false

      gl.autoClear = true
    }
  }, config.PRIORITY_GLOBAL) // Take over rendering

  config.debug && console.log('GlobalRenderer', Object.keys(canvasChildren).length)
  return (
    <scene ref={scene}>
      <Suspense fallback={null}>
        {Object.keys(canvasChildren).map((key, i) => {
          const { mesh, props } = canvasChildren[key]

          if (typeof mesh === 'function') {
            return <Fragment key={key}>{mesh({ key, ...scrollRig, ...props })}</Fragment>
          }

          return React.cloneElement(mesh, {
            key,
            ...props,
          })
        })}
        {children}
      </Suspense>
    </scene>
  )
}

GlobalRenderer.propTypes = {
  useScrollRig: PropTypes.func.required,
}

export default GlobalRenderer
