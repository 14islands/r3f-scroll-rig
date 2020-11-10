import { useEffect, useRef } from 'react'
import { useWindowSize } from '@react-hook/window-size'
import config from './config'
/**
 * Manages Scroll rig resize events by trigger a reflow instead of individual resize listeners in each component
 * The order is carefully scripted:
 *  1. reflow() will cause VirtualScrollbar to recalculate positions
 *  2. VirtualScrollbar triggers `pageReflowCompleted`
 *  3. Canvas scroll components listen to  `pageReflowCompleted` and recalc positions
 */
const ResizeManager = ({ reflow, resizeOnHeight = true, resizeOnWebFontLoaded = true }) => {
  const mounted = useRef(false)
  // must be debounced more than the GlobalCanvas so all components have the correct value from useThree({ size })
  const [windowWidth, windowHeight] = useWindowSize({ wait: 300 })

  // The reason for not resizing on height on "mobile" is because the height changes when the URL bar disapears in the browser chrome
  // Can we base this on something better - or is there another way to avoid?
  const height = resizeOnHeight ? windowHeight : null

  // Detect only resize events
  useEffect(() => {
    if (mounted.current) {
      config.debug && console.log('ResizeManager', 'reflow()')
      reflow()
    } else {
      mounted.current = true
    }
  }, [windowWidth, height])

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
