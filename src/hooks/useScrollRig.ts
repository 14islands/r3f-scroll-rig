import { useEffect } from 'react'

import { useCanvasStore } from '../store'
import { preloadScene, requestRender, renderScissor, renderViewport } from '../renderer-api'

export interface ScrollRigState {
  debug: boolean
  isCanvasAvailable: boolean
  hasSmoothScrollbar: boolean
  scaleMultiplier: number
  preloadScene: typeof preloadScene
  requestRender: typeof requestRender
  renderScissor: typeof renderScissor
  renderViewport: typeof renderViewport
  reflow: () => void
}

/**
 * Public interface for ScrollRig
 */
export const useScrollRig = () => {
  const isCanvasAvailable = useCanvasStore((state) => state.isCanvasAvailable)
  const hasSmoothScrollbar = useCanvasStore((state) => state.hasSmoothScrollbar)
  const requestReflow = useCanvasStore((state) => state.requestReflow)
  const pageReflow = useCanvasStore((state) => state.pageReflow)
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
    hasSmoothScrollbar,
    // scale
    scaleMultiplier,
    // render API
    preloadScene,
    requestRender,
    renderScissor,
    renderViewport,
    // recalc all tracker positions
    reflow: requestReflow,
    reflowCompleted: pageReflow,
  } as ScrollRigState
}
