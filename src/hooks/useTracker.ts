import { useMemo, useRef, useCallback, useLayoutEffect, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { useWindowSize } from 'react-use'
import { mapLinear } from '../utils/math'
// @ts-ignore
import { vec3 } from 'vecn'

import { useCanvasStore } from '../store'
import { useScrollbar, Scroll } from '../scrollbar/useScrollbar'

import type { Rect, Bounds, ElementTrackerProps, ElementTracker, ScrollState, PropsOrElement } from './useTracker.d'

function isElementProps(obj: any): obj is ElementTrackerProps {
  return typeof obj === 'object' && 'track' in obj
}

function updateBounds(bounds: Bounds, rect: Rect, scroll: Scroll, size: any) {
  bounds.top = rect.top - scroll.y
  bounds.bottom = rect.bottom - scroll.y
  bounds.left = rect.left - scroll.x
  bounds.right = rect.right - scroll.x
  bounds.width = rect.width
  bounds.height = rect.height
  // move coordinate system so 0,0 is at center of screen
  bounds.x = bounds.left + rect.width * 0.5 - size.width * 0.5
  bounds.y = bounds.top + rect.height * 0.5 - size.height * 0.5
  bounds.positiveYUpBottom = size.height - bounds.bottom // inverse Y
}

function updatePosition(position: vec3, bounds: Bounds, scaleMultiplier: number) {
  position.x = bounds.x * scaleMultiplier
  position.y = -1 * bounds.y * scaleMultiplier
}

const defaultArgs = { rootMargin: '50%', threshold: 0, autoUpdate: true }

/**
 * Returns the current Scene position of the DOM element
 * based on initial getBoundingClientRect and scroll delta from start
 */
function useTracker(args: PropsOrElement, deps: any[] = []): ElementTracker {
  const size = useWindowSize()
  const { scroll, onScroll } = useScrollbar()
  const scaleMultiplier = useCanvasStore((state) => state.scaleMultiplier)
  const pageReflow = useCanvasStore((state) => state.pageReflow)

  const { track, rootMargin, threshold, autoUpdate } = isElementProps(args)
    ? { ...defaultArgs, ...args }
    : { ...defaultArgs, track: args }

  // check if element is in viewport
  const { ref, inView: inViewport } = useInView({ rootMargin, threshold })

  // bind useInView ref to current tracking element
  useLayoutEffect(() => {
    ref(track.current)
  }, [track])

  const scrollState: ScrollState = useRef({
    inViewport: false,
    progress: -1,
    visibility: -1,
    viewport: -1,
  }).current

  // DOM rect (initial position in pixels offset by scroll value on page load)
  const rect = useMemo(() => {
    const rect = track.current?.getBoundingClientRect() || {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
    }
    const top = rect.top + window.scrollY
    const left = rect.left + window.scrollX
    return {
      top,
      bottom: rect.bottom + window.scrollY,
      left,
      right: rect.right + window.scrollX,
      width: rect.width,
      height: rect.height,
      x: left + rect.width * 0.5,
      y: top + rect.height * 0.5,
    }
  }, [track, size, pageReflow, ...deps])

  // bounding rect in pixels - updated by scroll
  const bounds = useMemo(() => {
    const bounds = {
      ...rect,
      positiveYUpBottom: 0,
    }
    updateBounds(bounds, rect, scroll, size)
    return bounds
  }, [])

  // position in viewport units - updated by scroll
  const position = useMemo(() => {
    const position = vec3(0, 0, 0)
    updatePosition(position, bounds, scaleMultiplier)
    return position
  }, [])

  // scale in viewport units
  const scale = useMemo(() => {
    return vec3(rect?.width * scaleMultiplier, rect?.height * scaleMultiplier, 1)
  }, [rect, scaleMultiplier])

  const update = useCallback(
    ({ onlyUpdateInViewport = true } = {}) => {
      if (!track.current || (onlyUpdateInViewport && !scrollState.inViewport)) {
        return
      }

      updateBounds(bounds, rect, scroll, size)
      updatePosition(position, bounds, scaleMultiplier)

      // scrollState setup based on scroll direction
      const isVertical = scroll.direction === 'vertical'
      const sizeProp = isVertical ? 'height' : 'width'
      const startProp = isVertical ? 'top' : 'left'

      // calculate progress of passing through viewport (0 = just entered, 1 = just exited)
      const pxInside = size[sizeProp] - bounds[startProp]
      scrollState.progress = mapLinear(pxInside, 0, size[sizeProp] + bounds[sizeProp], 0, 1) // percent of total visible distance
      scrollState.visibility = mapLinear(pxInside, 0, bounds[sizeProp], 0, 1) // percent of item height in view
      scrollState.viewport = mapLinear(pxInside, 0, size[sizeProp], 0, 1) // percent of window height scrolled since visible
    },
    [position, bounds, size, rect, scaleMultiplier, scroll]
  )

  // update scrollState in viewport
  useLayoutEffect(() => {
    scrollState.inViewport = inViewport
  }, [inViewport])

  // re-run if the callback updated
  useLayoutEffect(() => {
    update({ onlyUpdateInViewport: false })
  }, [update])

  // auto-update on scroll
  useEffect(() => {
    if (autoUpdate) return onScroll((_scroll) => update())
  }, [autoUpdate, update, onScroll])

  return {
    rect, // Dom rect - doesn't change on scroll - reactive
    bounds, // scrolled bounding rect in pixels - not reactive
    scale, // reactive scene scale - includes z-axis so it can be spread onto mesh directly
    position, // scrolled element position in viewport units - not reactive
    scrollState, // scroll progress stats - not reactive
    inViewport, // reactive prop for when inside viewport
    update: () => update({ onlyUpdateInViewport: false }), // optional manual update
  }
}

export { useTracker }
export default useTracker
