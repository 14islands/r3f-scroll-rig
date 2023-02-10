import { useEffect } from 'react'
import { ResizeObserver as Polyfill } from '@juggle/resize-observer'

import { useCanvasStore } from '../store'

/**
 * Trigger reflow when WebFonts loaded
 */
export const ResizeManager = () => {
  const requestReflow = useCanvasStore((state) => state.requestReflow)
  const debug = useCanvasStore((state) => state.debug)

  // reflow on webfont loaded to prevent misalignments
  useEffect(() => {
    const ResizeObserver = window.ResizeObserver || Polyfill

    // watch out for any random height change
    let observer = new ResizeObserver(() => {
      requestReflow()
      debug && console.log('ResizeManager', 'document.body height changed')
    })
    observer.observe(document.body)
    return () => {
      observer?.disconnect()
    }
  }, [])

  return null
}
