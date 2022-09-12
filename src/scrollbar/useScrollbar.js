import { useCanvasStore } from '../store'

/**
 * Public interface for ScrollRig
 */
export const useScrollbar = () => {
  const hasVirtualScrollbar = useCanvasStore((state) => state.hasVirtualScrollbar)
  const scroll = useCanvasStore((state) => state.scroll)
  const scrollTo = useCanvasStore((state) => state.scrollTo)

  return {
    enabled: hasVirtualScrollbar,
    scroll,
    scrollTo,
  }
}

export default useScrollbar
