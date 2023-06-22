import { useCanvasStore } from '../store'

/**
 * Public interface for ScrollRig
 */
export const useScrollbar = () => {
  const enabled = useCanvasStore((state) => state.hasSmoothScrollbar)
  const scroll = useCanvasStore((state) => state.scroll)
  const scrollTo = useCanvasStore((state) => state.scrollTo)
  const onScroll = useCanvasStore((state) => state.onScroll)
  const __lenis = useCanvasStore((state) => state.__lenis)

  return {
    enabled,
    scroll,
    scrollTo,
    onScroll,
    __lenis,
  }
}
