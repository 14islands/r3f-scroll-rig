import { useThree, useFrame, invalidate } from '@react-three/fiber'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { config } from '../config'
import { useCanvasStore } from '../store'
import { useScrollRig } from '../hooks/useScrollRig'

/**
 * Global render loop to avoid double renders on the same frame
 */
export const GlobalRenderer = () => {
  const gl = useThree((s) => s.gl)
  const frameloop = useThree((s) => s.frameloop)
  const globalClearDepth = useCanvasStore((state) => state.globalClearDepth)
  const globalPriority = useCanvasStore((state) => state.globalPriority)
  const scrollRig = useScrollRig()

  // https://threejs.org/docs/#api/en/renderers/WebGLRenderer.debug
  useLayoutEffect(() => {
    gl.debug.checkShaderErrors = scrollRig.debug
  }, [scrollRig.debug])

  // PRELOAD RENDER LOOP
  useFrame(({ camera, scene }) => {
    if (!config.preloadQueue.length) return
    // Render preload frames first and clear directly
    config.preloadQueue.forEach((render) => render(gl, scene, camera))
    // cleanup
    gl.clear()
    config.preloadQueue = []
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
    }
    // cleanup for next frame
    useCanvasStore.getState().clearGlobalRenderQueue()
  }, globalPriority) // Take over rendering

  return null
}
