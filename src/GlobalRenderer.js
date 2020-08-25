import React, { Suspense, Fragment, useLayoutEffect, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import { useThree, useFrame } from 'react-three-fiber'
import { sRGBEncoding, WebGLRenderTarget, NoToneMapping } from 'three'

import * as utils from './utils'
import config from './config'
import { useCanvasStore } from './store'

// Flag that we need global rendering (full screen)
export const renderFullscreen = (layers = [0]) => {
  config.globalRender = config.globalRender || [0]
  config.globalRender = [...config.globalRender, ...layers]
}

export const renderScissor = (gl, scene, camera, left, top, width, height, layer = 0) => {
  if (!scene || !camera) return
  config.hasRenderQueue = true
  config.scissorQueue.push(() => {
    // console.log('SCISSOR RENDER', layer)
    gl.setScissor(left, top, width, height)
    gl.setScissorTest(true)
    camera.layers.set(layer)
    gl.clearDepth()
    gl.render(scene, camera)
    gl.setScissorTest(false)
  })
}

export const renderViewport = (gl, scene, camera, left, top, width, height, layer = 0, size) => {
  if (!scene || !camera) return
  config.hasRenderQueue = true
  config.viewportQueue.push(() => {
    // console.log('VIEWPORT RENDER', layer)
    gl.setViewport(left, top, width, height)
    gl.setScissor(left, top, width, height)
    gl.setScissorTest(true)
    // camera.layers.set(layer)
    gl.clearDepth()
    gl.render(scene, camera)
    gl.setScissorTest(false)
    gl.setViewport(0, 0, size.width, size.height)
  })
}

export const preloadScene = (gl, scene, camera, layer = 0, callback) => {
  if (!scene || !camera) return
  config.preloadQueue.push(() => {
    gl.setScissorTest(false)
    utils.setAllCulled(scene, false)
    camera.layers.set(layer)
    gl.render(scene, camera)
    utils.setAllCulled(scene, true)
    callback && callback()
  })
}

const useFBO = () => {
  const { size } = useThree()
  const pixelRatio = useCanvasStore((state) => state.pixelRatio)

  useMemo(() => {
    const ratio = Math.min(1, Math.max(2, pixelRatio)) // contrain FBO to 1.5 pixel ratio to improve perf
    const width = size.width * ratio
    const height = size.height * ratio
    if (config.fboWidth === width && config.fboHeight === height) {
      return
    }
    config.debug && console.log('=================')
    config.debug && console.log('===== INIT FBO ==', size, pixelRatio)
    config.debug && console.log('=================')
    const f = new WebGLRenderTarget(width, height, {
      // anisotropy: gl.capabilities.getMaxAnisotropy(), // reduce blurring at glancing angles
    })
    config.fbo = f
    config.fboWidth = width
    config.fboHeight = height
  }, [size])
}

/**
 * Global render loop to avoid double renders on the same frame
 */
const GlobalRenderer = ({ useScrollRig, children }) => {
  const scene = useRef()
  const { gl } = useThree()
  const canvasChildren = useCanvasStore((state) => state.canvasChildren)
  const scrollRig = useScrollRig()

  useFBO()

  useLayoutEffect(() => {
    gl.outputEncoding = sRGBEncoding
    // gl.getContext().disable(gl.getContext().DEPTH_TEST)
    gl.autoClear = false // we do our own rendering
    gl.setClearColor(null, 0)
    gl.debug.checkShaderErrors = config.debug
    gl.toneMapping = NoToneMapping
  }, [])

  // GLOBAL RENDER LOOP
  useFrame(({ camera, scene }) => {
    config.hasRenderQueue = false

    // Render preload frames first and clear directly
    config.preloadQueue.forEach((render) => render())

    gl.clear()

    // Render viewport scissors first
    // config.viewportQueue.forEach((render) => render())

    if (config.globalRender) {
      // console.log('GLOBAL RENDER')

      // run any pre-process frames
      config.preRender.forEach((render) => render())

      // render default layer, scene, camera
      camera.layers.disableAll()
      config.globalRender.forEach((layer) => {
        camera.layers.enable(layer)
      })
      gl.clearDepth() // render as HUD over any other renders
      gl.render(scene, camera)

      // run any post-render frame (additional layers etc)
      config.postRender.forEach((render) => render())

      // cleanup for next frame
      config.globalRender = false
      config.preRender = []
      config.postRender = []
    } else {
      // console.log('GLOBAL SCISSORS')
      config.scissorQueue.forEach((render) => render())
    }

    // Render viewport scissors last
    config.viewportQueue.forEach((render) => render())

    config.preloadQueue = []
    config.scissorQueue = []
    config.viewportQueue = []
  }, config.PRIORITY_GLOBAL) // render as HUD over ViewportCameraScenes

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
