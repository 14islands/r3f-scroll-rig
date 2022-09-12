import { useEffect } from 'react'

import { useCanvasStore } from '../store'
import { preloadScene, requestRender, renderScissor, renderViewport } from '../renderer-api'
import config from '../config'

/**
 * Public interface for ScrollRig
 */
export const useScrollRig = () => {
  const isCanvasAvailable = useCanvasStore((state) => state.isCanvasAvailable)
  const hasVirtualScrollbar = useCanvasStore((state) => state.hasVirtualScrollbar)
  const requestReflow = useCanvasStore((state) => state.requestReflow)

  useEffect(() => {
    if (config.debug) {
      window._scrollRig = window._scrollRig || {}
      window._scrollRig.reflow = requestReflow
    }
  }, [])

  return {
    isCanvasAvailable,
    hasVirtualScrollbar,
    preloadScene,
    requestRender,
    renderScissor,
    renderViewport,
    reflow: requestReflow,
  }
}

export default useScrollRig
