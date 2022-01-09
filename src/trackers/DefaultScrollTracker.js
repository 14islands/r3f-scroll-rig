import { useEffect, useCallback } from 'react'

import { useCanvasStore } from '../store'

// Track scroll position and update store
export const DefaultScrollTracker = () => {
  const hasVirtualScrollbar = useCanvasStore((state) => state.hasVirtualScrollbar)
  const setScrollY = useCanvasStore((state) => state.setScrollY)

  const setScroll = useCallback(() => {
    setScrollY(window.pageYOffset)
  }, [setScrollY])

  useEffect(() => {
    if (!hasVirtualScrollbar) {
      window.addEventListener('scroll', setScroll)
    }
    return () => window.removeEventListener('scroll', setScroll)
  }, [hasVirtualScrollbar])
  return null
}

export default DefaultScrollTracker
