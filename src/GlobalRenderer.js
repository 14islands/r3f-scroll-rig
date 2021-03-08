import React, { Suspense, Fragment, useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useThree, useFrame } from 'react-three-fiber'
import { sRGBEncoding, NoToneMapping } from 'three'

import config from './config'
import { useCanvasStore } from './store'
import { useScrollRig } from './useScrollRig'

/**
 * Global render loop to avoid double renders on the same frame
 */
const GlobalRenderer = ({ children }) => {
  const scene = useRef()
  const { gl, size } = useThree()
  const canvasChildren = useCanvasStore((state) => state.canvasChildren)
  const scrollRig = useScrollRig()

  useLayoutEffect(() => {
    gl.outputEncoding = sRGBEncoding
    gl.setClearColor(0x000000, 0)
    gl.debug.checkShaderErrors = config.debug
    gl.toneMapping = NoToneMapping
  }, [])

  // GLOBAL RENDER LOOP
  useFrame(({ camera, scene }) => {
    // Render preload frames first and clear directly
    config.preloadQueue.forEach((render) => render(gl))
    if (config.preloadQueue.length) gl.clear()

    // prevent viewport from being cleared if we have multiple render passes
    if (config.viewportQueueBefore.length || config.viewportQueueAfter.length || config.scissorQueue.length) {
      gl.autoClear = false
    }

    // Render viewports passes before
    if (config.viewportQueueBefore.length) {
      config.viewportQueueBefore.forEach((render) => render(gl, size))
    }

    // Global render pass
    if (config.globalRender) {
      // run any pre-process frames
      config.preRender.forEach((render) => render(gl))

      // render default layer, scene, camera
      camera.layers.disableAll()
      config.globalRender.forEach((layer) => {
        camera.layers.enable(layer)
      })
      gl.clearDepth() // render as HUD over any other renders
      gl.render(scene, camera)

      // run any post-render frame (additional layers etc)
      config.postRender.forEach((render) => render(gl))
    }

    // Render global scissors
    if (config.scissorQueue.length) {
      config.scissorQueue.forEach((render) => render(gl, camera))
    }

    // Render viewports after
    if (config.viewportQueueAfter.length) {
      gl.autoClear = false
      config.viewportQueueAfter.forEach((render) => render(gl, size))
    }

    // cleanup for next frame
    config.globalRender = false
    config.preRender = []
    config.postRender = []
    config.preloadQueue = []
    config.scissorQueue = []
    config.viewportQueueBefore = []
    config.viewportQueueAfter = []
    gl.autoClear = true
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
