import config from './config'
import * as utils from './utils'
import { Vector2 } from 'three'
import { invalidate } from '@react-three/fiber'

import { useCanvasStore } from './store'

const viewportSize = new Vector2()

// Flag that we need global rendering (full screen)
export const requestRender = (layers = [0]) => {
  useCanvasStore.getState().globalRenderQueue = useCanvasStore.getState().globalRenderQueue || [0]
  useCanvasStore.getState().globalRenderQueue = [...useCanvasStore.getState().globalRenderQueue, ...layers]
}

export const renderScissor = ({
  gl,
  scene,
  camera,
  left,
  top,
  width,
  height,
  layer = 0,
  autoClear = false,
  clearDepth = true,
}) => {
  if (!scene || !camera) return
  gl.autoClear = autoClear
  gl.setScissor(left, top, width, height)
  gl.setScissorTest(true)
  camera.layers.set(layer)
  clearDepth && gl.clearDepth()
  gl.render(scene, camera)
  gl.setScissorTest(false)
}

export const renderViewport = ({
  gl,
  scene,
  camera,
  left,
  top,
  width,
  height,
  layer = 0,
  autoClear = false,
  clearDepth = true,
}) => {
  if (!scene || !camera) return
  gl.getSize(viewportSize)
  gl.autoClear = autoClear
  gl.setViewport(left, top, width, height)
  gl.setScissor(left, top, width, height)
  gl.setScissorTest(true)
  camera.layers.set(layer)
  clearDepth && gl.clearDepth()
  gl.render(scene, camera)
  gl.setScissorTest(false)
  gl.setViewport(0, 0, viewportSize.x, viewportSize.y)
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
  // auto trigger a new frame for the preload
  invalidate()
}
