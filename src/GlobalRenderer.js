import React, { Suspense, Fragment, useEffect, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import { useThree, useFrame, invalidate } from '@react-three/fiber'

import config from './config'
import { useCanvasStore } from './store'
import { useScrollRig } from './useScrollRig'

/**
 * Global render loop to avoid double renders on the same frame
 */
const GlobalRenderer = ({ children }) => {
  const { gl } = useThree()
  const canvasChildren = useCanvasStore((state) => state.canvasChildren)
  const scrollRig = useScrollRig()

  useLayoutEffect(() => {
    gl.debug.checkShaderErrors = config.debug
  }, [])

  useEffect(() => {
    // clear canvas automatically if all children were removed
    if (!children && !Object.keys(canvasChildren).length) {
      config.debug && console.log('GlobalRenderer', 'auto clear empty canvas')
      gl.clear()
    }
  }, [children, canvasChildren])

  // PRELOAD RENDER LOOP
  useFrame(({ camera, scene }) => {
    if (!config.preloadQueue.length) return
    gl.autoClear = false
    // Render preload frames first and clear directly
    config.preloadQueue.forEach((render) => render(gl))
    // cleanup
    gl.clear()
    config.preloadQueue = []
    gl.autoClear = true
    // trigger new frame to get correct visual state after all preloads
    config.debug && console.log('GlobalRenderer', 'preload complete. trigger global render')
    scrollRig.requestRender()
    invalidate()
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
  )
}

GlobalRenderer.propTypes = {
  useScrollRig: PropTypes.func.required,
}

export default GlobalRenderer
