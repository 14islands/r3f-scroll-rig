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
  clearDepth = false,
}: any) => {
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
  scissor = true,
  autoClear = false,
  clearDepth = false,
}: any) => {
  if (!scene || !camera) return
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
}

export const preloadScene = (
  { scene, camera, layer = 0 }: { scene?: Scene; camera?: Camera; layer?: number },
  callback?: () => void
) => {
  config.preloadQueue.push((gl: WebGLRenderer, globalScene: Scene, globalCamera: Camera) => {
    gl.setScissorTest(false)
    setAllCulled(scene || globalScene, false)
    ;(camera || globalCamera).layers.set(layer)
    gl.render(scene || globalScene, camera || globalCamera)
    setAllCulled(scene || globalScene, true)
    callback && callback()
  })
  // auto trigger a new frame for the preload
  invalidate()
}
