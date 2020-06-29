import { useEffect, useRef } from 'react'
import { useThree } from 'react-three-fiber'
import useUIContext from 'context/ui'

import { useScrollRig } from 'components/three/scroll-rig'

/**
 * Manages Scroll rig resize events by trigger a reflow instead of individual resize listeners in each component
 * The order is carefully scripted:
 *  1. reflow() will cause VirtualScrollbar to recalculate positions
 *  2. VirtualScrollbar triggers `pageReflowCompleted`
 *  3. Canvas scroll components listen to  `pageReflowCompleted` and recalc positions
 */
const ResizeManager = () => {
  const mounted = useRef(false)
  const { size } = useThree()
  const { reflow } = useScrollRig()
  const isMobile = useUIContext((s) => s.isMobile)

  // The reason for not resizing on height on "mobile" is because the height changes when the URL bar disapears in the browser chrome
  // Can we base this on something better - or is there another way to avoid?
  const resizeOnHeight = isMobile ? null : size.height

  // Detect only resize events
  useEffect(() => {
    if (mounted.current) {
      reflow()
    } else {
      mounted.current = true
    }
  }, [size.width, resizeOnHeight])

  return null
}

export default ResizeManager
