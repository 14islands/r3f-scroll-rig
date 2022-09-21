import { useCanvasStore } from '../store'

/**
 * Public interface for ScrollRig
 */
export const useScrollbar = () => {
  const hasVirtualScrollbar = useCanvasStore((state) => state.hasVirtualScrollbar)
  const scroll = useCanvasStore((state) => state.scroll)
  const scrollTo = useCanvasStore((state) => state.scrollTo)
  const onScroll = useCanvasStore((state) => state.onScroll)

  return {
    enabled: hasVirtualScrollbar,
    scroll,
    scrollTo,
    onScroll,
  }
}

export default useScrollbar
