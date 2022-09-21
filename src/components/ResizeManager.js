import { useEffect } from 'react'

import requestIdleCallback from '../polyfills/requestIdleCallback'
import { useCanvasStore } from '../store'

/**
 * Trigger reflow when WebFonts loaded
 */
const ResizeManager = () => {
  const requestReflow = useCanvasStore((state) => state.requestReflow)

  // reflow on webfont loaded to prevent misalignments
  useEffect(() => {
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        requestIdleCallback(requestReflow)
      })
    }
  }, [])

  return null
}

export default ResizeManager
