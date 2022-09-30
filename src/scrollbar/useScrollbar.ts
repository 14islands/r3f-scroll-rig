import { useCanvasStore } from '../store'
import { LenisScrollCallback } from './LenisScrollbar'

export interface Scroll {
  y: number
  x: number
  limit: number
  velocity: number
  progress: number
  direction: string
}

interface UseScrollbarProps {
  enabled: boolean
  scroll: Scroll
  scrollTo: (target: any) => void
  onScroll: (cb: LenisScrollCallback) => () => void
}

/**
 * Public interface for ScrollRig
 */
export const useScrollbar = () => {
  const hasSmoothScrollbar = useCanvasStore((state) => state.hasSmoothScrollbar)
  const scroll = useCanvasStore((state) => state.scroll)
  const scrollTo = useCanvasStore((state) => state.scrollTo)
  const onScroll = useCanvasStore((state) => state.onScroll)

  return {
    enabled: hasSmoothScrollbar,
    scroll,
    scrollTo,
    onScroll,
  } as UseScrollbarProps
}

export default useScrollbar
