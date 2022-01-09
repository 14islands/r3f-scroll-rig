import { useEffect, useRef } from 'react'
import { useWindowSize } from '@react-hook/window-size'

import config from '../config'

/**
 * Manages Scroll rig resize events by trigger a reflow instead of individual resize listeners in each component
 * The order is carefully scripted:
 *  1. reflow() will cause VirtualScrollbar to recalculate positions
 *  2. VirtualScrollbar triggers `pageReflowCompleted`
 *  3. Canvas scroll components listen to  `pageReflowCompleted` and recalc positions
 *
 *  HijackedScrollbar does not care about this and only react to window resize to recalculate the total page height
 */
const ResizeManager = ({ reflow, resizeOnWebFontLoaded = true }) => {
  const mounted = useRef(false)
  const [windowWidth, windowHeight] = useWindowSize({ wait: 300 })

  // Detect only resize events
  useEffect(() => {
    if (mounted.current) {
      config.debug && console.log('ResizeManager', 'reflow() because width changed')
      reflow()
    } else {
      mounted.current = true
    }
  }, [windowWidth, windowHeight])

  // reflow on webfont loaded to prevent misalignments
  useEffect(() => {
    if (!resizeOnWebFontLoaded) return

    let fallbackTimer
    if ('fonts' in document) {
      document.fonts.onloadingdone = reflow
    } else {
      fallbackTimer = setTimeout(reflow, 1000)
    }
    return () => {
      if ('fonts' in document) {
        document.fonts.onloadingdone = null
      } else {
        clearTimeout(fallbackTimer)
      }
    }
  }, [])

  return null
}

export default ResizeManager
