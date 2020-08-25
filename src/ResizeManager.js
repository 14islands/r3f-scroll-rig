import { useEffect, useRef } from 'react'
import { useThree } from 'react-three-fiber'
/**
 * Manages Scroll rig resize events by trigger a reflow instead of individual resize listeners in each component
 * The order is carefully scripted:
 *  1. reflow() will cause VirtualScrollbar to recalculate positions
 *  2. VirtualScrollbar triggers `pageReflowCompleted`
 *  3. Canvas scroll components listen to  `pageReflowCompleted` and recalc positions
 */
const ResizeManager = ({ useScrollRig, resizeOnHeight = true, resizeOnWebFontLoaded = true }) => {
  const mounted = useRef(false)
  const { size } = useThree()
  const { reflow } = useScrollRig()

  // The reason for not resizing on height on "mobile" is because the height changes when the URL bar disapears in the browser chrome
  // Can we base this on something better - or is there another way to avoid?
  const height = resizeOnHeight ? null : size.height

  // Detect only resize events
  useEffect(() => {
    if (mounted.current) {
      reflow()
    } else {
      mounted.current = true
    }
  }, [size.width, height])

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
