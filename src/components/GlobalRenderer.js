import React, { Fragment, useEffect, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import { useThree, useFrame, invalidate } from '@react-three/fiber'
import { Color } from 'three'

import config from '../config'
import { useCanvasStore } from '../store'
import { useScrollRig } from '../hooks/useScrollRig'

const col = new Color()

/**
 * Global render loop to avoid double renders on the same frame
 */
const GlobalRenderer = () => {
  const gl = useThree((s) => s.gl)
  const frameloop = useThree((s) => s.frameloop)
  const canvasChildren = useCanvasStore((state) => state.canvasChildren)
  const globalRender = useCanvasStore((state) => state.globalRender)
  const globalClearDepth = useCanvasStore((state) => state.globalClearDepth)
  const globalAutoClear = useCanvasStore((state) => state.globalAutoClear)
  const globalPriority = useCanvasStore((state) => state.globalPriority)

  const { debug, requestRender } = useScrollRig()

  // https://threejs.org/docs/#api/en/renderers/WebGLRenderer.debug
  useLayoutEffect(() => {
    gl.debug.checkShaderErrors = debug
  }, [debug])

  useEffect(() => {
    // clear canvas automatically if all children were removed
    if (!Object.keys(canvasChildren).length) {
      debug && console.log('GlobalRenderer', 'auto clear empty canvas')
      gl.getClearColor(col)
      gl.setClearColor(col, gl.getClearAlpha())
      gl.clear(true, true)
    }
  }, [canvasChildren])

  // PRELOAD RENDER LOOP
  useFrame(
    () => {
      if (!config.preloadQueue.length) return
      gl.autoClear = false
      // Render preload frames first and clear directly
      config.preloadQueue.forEach((render) => render(gl))
      // cleanup
      gl.clear()
      config.preloadQueue = []
      gl.autoClear = true
      // trigger new frame to get correct visual state after all preloads
      debug && console.log('GlobalRenderer', 'preload complete. trigger global render')
      requestRender()
      invalidate()
    },
    globalRender ? config.PRIORITY_PRELOAD : -1 //negative priority doesn't take over render loop
  )

  // GLOBAL RENDER LOOP
  useFrame(
    ({ camera, scene }) => {
      const globalRenderQueue = useCanvasStore.getState().globalRenderQueue

      // Render if requested or if always on
      if (globalRender && (frameloop === 'always' || globalRenderQueue)) {
        gl.autoClear = globalAutoClear // false will fail in Oculus Quest VR

        // render default layer, scene, camera
        camera.layers.disableAll()
        if (globalRenderQueue) {
          globalRenderQueue.forEach((layer) => {
            camera.layers.enable(layer)
          })
        } else {
          camera.layers.enable(0)
        }

        // render as HUD over any other renders by default
        globalClearDepth && gl.clearDepth()
        gl.render(scene, camera)

        gl.autoClear = true
      }
      // cleanup for next frame
      useCanvasStore.getState().clearGlobalRenderQueue()
    },
    globalRender ? globalPriority : undefined
  ) // Take over rendering

  debug && console.log('GlobalRenderer', Object.keys(canvasChildren).length)
  return (
    <>
      {Object.keys(canvasChildren).map((key) => {
        const { mesh, props } = canvasChildren[key]

        if (typeof mesh === 'function') {
          return <Fragment key={key}>{mesh({ key, ...scrollRig, ...props })}</Fragment>
        }

        return React.cloneElement(mesh, {
          key,
          ...props,
        })
      })}
    </>
  )
}

GlobalRenderer.propTypes = {
  useScrollRig: PropTypes.func.required,
}

export default GlobalRenderer
