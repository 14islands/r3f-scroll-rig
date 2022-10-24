import { useState, useEffect, useMemo } from 'react'
import pkg from 'debounce'

const isBrowser = typeof window !== 'undefined'

// https://usehooks.com/useWindowSize/

export interface WindowSize {
  width: number
  height: number
}

export function useWindowSize() {
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
      // Set window width/height to state
      setWindowSize({
        width: canvasEl ? canvasEl.clientWidth : window.innerWidth,
        height: canvasEl ? canvasEl.clientHeight : window.innerHeight,
      })
    }

    const debouncedResize = pkg.debounce(handleResize, 200)

    // Add event listener
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
  }, []) // Empty array ensures that effect is only run on mount

  return windowSize
}
