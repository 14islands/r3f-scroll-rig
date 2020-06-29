import { useCallback } from 'react'
import { useThree } from 'react-three-fiber'
import { config, useCanvasStore } from 'components/three/scroll-rig'
import { preloadScene, renderFullscreen, renderScissor, renderViewport } from './GlobalRenderer'

/**
 * Public interface for ScrollRig
 */
export const useScrollRig = () => {
  const isCanvasAvailable = useCanvasStore((state) => state.isCanvasAvailable)
  const hasVirtualScrollbar = useCanvasStore((state) => state.hasVirtualScrollbar)
  const paused = useCanvasStore((state) => state.paused)
  const suspended = useCanvasStore((state) => state.suspended)
  const setPaused = useCanvasStore((state) => state.setPaused)
  const requestReflow = useCanvasStore((state) => state.requestReflow)
  const pixelRatio = useCanvasStore((state) => state.pixelRatio)

  const { gl, invalidate, size } = useThree()

  const requestFrame = useCallback(() => {
    if (!paused && !suspended) {
      invalidate()
    }
  }, [paused, suspended])

  const pause = () => {
    config.debug && console.log('GlobalRenderer.pause()')
    setPaused(true)
  }

  const resume = () => {
    config.debug && console.log('GlobalRenderer.resume()')
    setPaused(false)
    requestFrame()
  }

  return {
    isCanvasAvailable,
    hasVirtualScrollbar,
    pixelRatio,
    requestFrame,
    pause,
    resume,
    preloadScene: (...params) => preloadScene(gl, ...params),
    renderFullscreen,
    renderScissor: (...params) => renderScissor(gl, ...params),
    renderViewport: (...params) => renderViewport(gl, ...params, size),
    reflow: requestReflow,
  }
}

export default useScrollRig
