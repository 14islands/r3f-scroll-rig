import React, { Suspense, Fragment, useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useThree, useFrame } from 'react-three-fiber'
import { sRGBEncoding, NoToneMapping } from 'three'

import * as utils from './utils'
import config from './config'
import { useCanvasStore } from './store'

// Flag that we need global rendering (full screen)
export const renderFullscreen = (layers = [0]) => {
  config.globalRender = config.globalRender || [0]
  config.globalRender = [...config.globalRender, ...layers]
}

export const renderScissor = ({ scene, camera, left, top, width, height, layer = 0 }) => {
  if (!scene || !camera) return
  config.scissorQueue.push((gl, camera) => {
    gl.setScissor(left, top, width, height)
    gl.setScissorTest(true)
    camera.layers.set(layer)
    gl.clearDepth()
    gl.render(scene, camera)
    gl.setScissorTest(false)
  })
}

export const renderViewport = ({ scene, camera, left, top, width, height, layer = 0, renderOnTop = false }) => {
  if (!scene || !camera) return
  config[renderOnTop ? 'viewportQueueAfter' : 'viewportQueueBefore'].push((gl, size) => {
    // console.log('VIEWPORT RENDER', layer)
    gl.setViewport(left, top, width, height)
    gl.setScissor(left, top, width, height)
    gl.setScissorTest(true)
    camera.layers.set(layer)
    gl.clearDepth()
    gl.render(scene, camera)
    gl.setScissorTest(false)
    gl.setViewport(0, 0, size.width, size.height)
  })
}

export const preloadScene = (scene, camera, layer = 0, callback) => {
  if (!scene || !camera) return
  config.preloadQueue.push((gl) => {
    gl.setScissorTest(false)
    utils.setAllCulled(scene, false)
    camera.layers.set(layer)
    gl.render(scene, camera)
    utils.setAllCulled(scene, true)
    callback && callback()
  })
}

/**
 * Global render loop to avoid double renders on the same frame
 */
const GlobalRenderer = ({ useScrollRig, children }) => {
  const scene = useRef()
  const { gl, size } = useThree()
  const canvasChildren = useCanvasStore((state) => state.canvasChildren)
  const scrollRig = useScrollRig()

  useLayoutEffect(() => {
    gl.outputEncoding = sRGBEncoding
    gl.autoClear = false // we do our own rendering
    gl.setClearColor(null, 0)
    gl.debug.checkShaderErrors = config.debug
    gl.toneMapping = NoToneMapping
  }, [])

  // GLOBAL RENDER LOOP
  useFrame(({ camera, scene }) => {
    // Render preload frames first and clear directly
    config.preloadQueue.forEach((render) => render(gl))
    if (config.preloadQueue.length) gl.clear()

    // Render viewport scissors first
    config.viewportQueueBefore.forEach((render) => render(gl, size))

    if (config.globalRender) {
      // console.log('GLOBAL RENDER')

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

      // cleanup for next frame
      config.globalRender = false
      config.preRender = []
      config.postRender = []
    } else {
      // console.log('GLOBAL SCISSORS')
      config.scissorQueue.forEach((render) => render(gl, camera))
    }

    // Render viewports last
    config.viewportQueueAfter.forEach((render) => render(gl))

    config.preloadQueue = []
    config.scissorQueue = []
    config.viewportQueueBefore = []
    config.viewportQueueAfter = []
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
