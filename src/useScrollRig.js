import { invalidate } from 'react-three-fiber'

import { useCanvasStore } from './store'

import { preloadScene, requestRender, renderScissor, renderViewport } from './renderer-api'

/**
 * Public interface for ScrollRig
 */
export const useScrollRig = () => {
  const isCanvasAvailable = useCanvasStore((state) => state.isCanvasAvailable)
  const hasVirtualScrollbar = useCanvasStore((state) => state.hasVirtualScrollbar)
  const requestReflow = useCanvasStore((state) => state.requestReflow)
  const pageReflowCompleted = useCanvasStore((state) => state.pageReflowCompleted)
  const pixelRatio = useCanvasStore((state) => state.pixelRatio)

  return {
    isCanvasAvailable,
    hasVirtualScrollbar,
    pixelRatio,
    invalidate,
    preloadScene,
    requestRender,
    renderScissor,
    renderViewport,
    reflow: requestReflow,
    reflowCompleted: pageReflowCompleted,
  }
}

export default useScrollRig
