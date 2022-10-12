import { useThree, useFrame, invalidate } from '@react-three/fiber'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import config from '../config'
import { useCanvasStore } from '../store'
import { useScrollRig } from '../hooks/useScrollRig'

/**
 * Global render loop to avoid double renders on the same frame
 */
const GlobalRenderer = () => {
  const gl = useThree((s) => s.gl)
  const frameloop = useThree((s) => s.frameloop)
  const globalClearDepth = useCanvasStore((state) => state.globalClearDepth)
  const globalAutoClear = useCanvasStore((state) => state.globalAutoClear)
  const globalPriority = useCanvasStore((state) => state.globalPriority)
  const scrollRig = useScrollRig()

  // https://threejs.org/docs/#api/en/renderers/WebGLRenderer.debug
  useLayoutEffect(() => {
    gl.debug.checkShaderErrors = scrollRig.debug
  }, [scrollRig.debug])

  // PRELOAD RENDER LOOP
  useFrame(() => {
    if (!config.preloadQueue.length) return
    gl.autoClear = false
    // Render preload frames first and clear directly
    // @ts-ignore
    config.preloadQueue.forEach((render) => render(gl))
    // cleanup
    gl.clear()
    config.preloadQueue = []
    gl.autoClear = true
    // trigger new frame to get correct visual state after all preloads
    scrollRig.debug && console.log('GlobalRenderer', 'preload complete. trigger global render')
    scrollRig.requestRender()
    invalidate()
  }, config.PRIORITY_PRELOAD)

  // GLOBAL RENDER LOOP
  useFrame(({ camera, scene }) => {
    const globalRenderQueue = useCanvasStore.getState().globalRenderQueue

    // Render if requested or if always on
    if (frameloop === 'always' || globalRenderQueue) {
      gl.autoClear = globalAutoClear // false will fail in Oculus Quest VR

      // render default layer, scene, camera
      camera.layers.disableAll()
      if (globalRenderQueue) {
        // @ts-ignore
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
  }, globalPriority) // Take over rendering

  return null
}

export default GlobalRenderer
