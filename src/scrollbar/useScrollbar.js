import { useCanvasStore } from '../store'

/**
 * Public interface for ScrollRig
 */
export const useScrollbar = () => {
  const hasVirtualScrollbar = useCanvasStore((state) => state.hasVirtualScrollbar)
  const requestReflow = useCanvasStore((state) => state.requestReflow)
  const pageReflowCompleted = useCanvasStore((state) => state.pageReflowCompleted)

  return {
    hasVirtualScrollbar,
    reflow: requestReflow,
    reflowCompleted: pageReflowCompleted,
  }
}

export default useScrollbar
