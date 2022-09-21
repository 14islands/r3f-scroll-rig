import { useEffect } from 'react'

import { useCanvasStore } from '../store'
import { preloadScene, requestRender, renderScissor, renderViewport } from '../renderer-api'

/**
 * Public interface for ScrollRig
 */
export const useScrollRig = () => {
  const isCanvasAvailable = useCanvasStore((state) => state.isCanvasAvailable)
  const hasVirtualScrollbar = useCanvasStore((state) => state.hasVirtualScrollbar)
  const requestReflow = useCanvasStore((state) => state.requestReflow)
  const debug = useCanvasStore((state) => state.debug)
  const scaleMultiplier = useCanvasStore((state) => state.scaleMultiplier)

  useEffect(() => {
    if (debug) {
      // @ts-ignore
      window._scrollRig = window._scrollRig || {}
      // @ts-ignore
      window._scrollRig.reflow = requestReflow
    }
  }, [])

  return {
    // boolean state
    debug,
    isCanvasAvailable,
    hasVirtualScrollbar,
    // scale
    scaleMultiplier,
    // render API
    preloadScene,
    requestRender,
    renderScissor,
    renderViewport,
    // recalc all tracker positions
    reflow: requestReflow,
  }
}

export default useScrollRig
