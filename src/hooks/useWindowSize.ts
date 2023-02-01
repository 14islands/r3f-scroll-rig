import { useState, useEffect } from 'react'
import { ResizeObserver as Polyfill } from '@juggle/resize-observer'
import pkg from 'debounce'

const isBrowser = typeof window !== 'undefined'
export interface WindowSize {
  width: number
  height: number
}

type ConfigProps = {
  debounce?: number
}

/*
 * Triggers a resize only if the Canvas DOM element changed dimensions - not on window resize event
 *
 * This is to avoid costly re-renders when the URL bar is scrolled away on mobile
 *
 * Based on: https://usehooks.com/useWindowSize/
 */

export function useWindowSize({ debounce = 0 }: ConfigProps = {}) {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: isBrowser ? window.innerWidth : Infinity,
    height: isBrowser ? window.innerHeight : Infinity,
  })

  useEffect(() => {
    // check if we can find a canvas - if so, base size on canvas instead of window
    // since 100vh !== window.innerHeight on mobile
    const canvasEl = document.getElementById('ScrollRig-canvas')

    // Handler to call on window resize
    function handleResize() {
      const width = canvasEl ? canvasEl.clientWidth : window.innerWidth
      const height = canvasEl ? canvasEl.clientHeight : window.innerHeight

      if (width !== windowSize.width || height !== windowSize.height) {
        // Set window width/height to state
        setWindowSize({
          width,
          height,
        })
      }
    }

    const debouncedResize = pkg.debounce(handleResize, debounce)

    // Add event listener
    const ResizeObserver = window.ResizeObserver || Polyfill
    let observer: ResizeObserver
    if (canvasEl) {
      observer = new ResizeObserver(debouncedResize)
      observer.observe(canvasEl)
    } else {
      window.addEventListener('resize', debouncedResize)
    }
    // Call handler right away so state gets updated with initial window size
    handleResize()
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('resize', debouncedResize)
      observer?.disconnect()
    }
  }, [windowSize, setWindowSize])

  return windowSize
}
