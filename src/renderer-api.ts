import { config } from './config'
import { Vector2, WebGLRenderer, Scene, Camera } from 'three'
import { invalidate } from '@react-three/fiber'

import { setAllCulled } from './utils/helpers'
import { useCanvasStore } from './store'

const viewportSize = new Vector2()

// Flag that we need global rendering (full screen)
export const requestRender = (layers = [0]) => {
  useCanvasStore.getState().globalRenderQueue = useCanvasStore.getState().globalRenderQueue || [0]
  useCanvasStore.getState().globalRenderQueue = [...(useCanvasStore.getState().globalRenderQueue || []), ...layers]
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
}: any) => {
  if (!scene || !camera) return
  const _autoClear = gl.autoClear
  gl.autoClear = autoClear
  gl.setScissor(left, top, width, height)
  gl.setScissorTest(true)
  camera.layers.set(layer)
  clearDepth && gl.clearDepth()
  gl.render(scene, camera)
  gl.setScissorTest(false)
  gl.autoClear = _autoClear
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
  scissor = true,
  autoClear = false,
  clearDepth = true,
}: any) => {
  if (!scene || !camera) return
  const _autoClear = gl.autoClear
  gl.getSize(viewportSize)
  gl.autoClear = autoClear
  gl.setViewport(left, top, width, height)
  gl.setScissor(left, top, width, height)
  gl.setScissorTest(scissor)
  camera.layers.set(layer)
  clearDepth && gl.clearDepth()
  gl.render(scene, camera)
  gl.setScissorTest(false)
  gl.setViewport(0, 0, viewportSize.x, viewportSize.y)
  gl.autoClear = _autoClear
}

export const preloadScene = (scene: Scene, camera: Camera, layer = 0, callback?: () => void) => {
  if (!scene || !camera) return
  config.preloadQueue.push((gl: WebGLRenderer) => {
    gl.setScissorTest(false)
    setAllCulled(scene, false)
    camera.layers.set(layer)
    gl.render(scene, camera)
    setAllCulled(scene, true)
    callback && callback()
  })
  // auto trigger a new frame for the preload
  invalidate()
}
