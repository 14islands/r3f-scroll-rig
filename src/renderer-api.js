import config from './config'
import * as utils from './utils'

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
