import { useRef, useCallback, useEffect, useMemo, useState, MutableRefObject } from 'react'
import { useInView } from 'react-intersection-observer'
import { useWindowSize } from './useWindowSize'
import vecn from 'vecn'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { mapLinear } from '../utils/math'
import { useCanvasStore } from '../store'
import { useScrollbar, Scroll } from '../scrollbar/useScrollbar'

import type { Rect, Bounds, TrackerOptions, Tracker, ScrollState, UpdateCallback } from './useTracker.d'

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

/**
 * Returns the current Scene position of the DOM element
 * based on initial getBoundingClientRect and scroll delta from start
 */
function useTracker(track: MutableRefObject<HTMLElement>, options?: TrackerOptions): Tracker {
  const size = useWindowSize()
  const { scroll, onScroll } = useScrollbar()
  const scaleMultiplier = useCanvasStore((state) => state.scaleMultiplier)
  const pageReflow = useCanvasStore((state) => state.pageReflow)

  // extend defaults with optional options
  const { rootMargin, threshold, autoUpdate, wrapper } = useMemo(() => {
    const target = { rootMargin: '0%', threshold: 0, autoUpdate: true } as TrackerOptions
    const opts = options || {}
    Object.keys(opts).map((key: string, index) => {
      if (opts[key] !== undefined) target[key] = opts[key]
    })
    return target
  }, [options])

  // check if element is in viewport
  const { ref, inView: inViewport } = useInView({ rootMargin, threshold })

  // bind useInView ref to current tracking element
  useLayoutEffect(() => {
    ref(track.current)
  }, [track])

  // Using state so it's reactive
  const [scale, setScale] = useState<vec3>()

  // Using ref because
  const scrollState: ScrollState = useRef({
    inViewport: false,
    progress: -1,
    visibility: -1,
    viewport: -1,
  }).current

  // DOM rect (initial position in pixels offset by scroll value on page load)
  // Using ref so we can calculate bounds & position without a re-render
  const rect = useRef({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  }).current

  // expose internal ref as a reactive state as well
  const [reactiveRect, setReactiveRect] = useState<Rect>(rect)

  // bounding rect in pixels - updated by scroll
  const bounds = useRef({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    positiveYUpBottom: 0,
  }).current

  // position in viewport units - updated by scroll
  const position = useRef(vecn.vec3(0, 0, 0)).current

  // Calculate bounding Rect as soon as it's available
  useLayoutEffect(() => {
    const _rect = track.current?.getBoundingClientRect()
    if (!_rect) return
    const initialY = wrapper ? (wrapper as HTMLElement).scrollTop : window.scrollY
    const initialX = wrapper ? (wrapper as HTMLElement).scrollLeft : window.scrollX
    rect.top = _rect.top + initialY
    rect.bottom = _rect.bottom + initialY
    rect.left = _rect.left + initialX
    rect.right = _rect.right + initialX
    rect.width = _rect.width
    rect.height = _rect.height
    rect.x = rect.left + _rect.width * 0.5
    rect.y = rect.top + _rect.height * 0.5
    setReactiveRect({ ...rect })
    setScale(vecn.vec3(rect?.width * scaleMultiplier, rect?.height * scaleMultiplier, 1))
  }, [track, size, pageReflow, scaleMultiplier])

  const update = useCallback(
    ({ onlyUpdateInViewport = true, scroll: overrideScroll }: UpdateCallback = {}) => {
      if (!track.current || (onlyUpdateInViewport && !scrollState.inViewport)) {
        return
      }

      const _scroll = overrideScroll || scroll

      updateBounds(bounds, rect, _scroll, size)
      updatePosition(position, bounds, scaleMultiplier)

      // scrollState setup based on scroll direction
      const isHorizontal = _scroll.scrollDirection === 'horizontal'
      const sizeProp = isHorizontal ? 'width' : 'height'
      const startProp = isHorizontal ? 'left' : 'top'

      // calculate progress of passing through viewport (0 = just entered, 1 = just exited)
      const pxInside = size[sizeProp] - bounds[startProp]
      scrollState.progress = mapLinear(pxInside, 0, size[sizeProp] + bounds[sizeProp], 0, 1) // percent of total visible distance
      scrollState.visibility = mapLinear(pxInside, 0, bounds[sizeProp], 0, 1) // percent of item height in view
      scrollState.viewport = mapLinear(pxInside, 0, size[sizeProp], 0, 1) // percent of window height scrolled since visible
    },
    [track, size, scaleMultiplier, scroll]
  )

  // update scrollState in viewport
  useLayoutEffect(() => {
    scrollState.inViewport = inViewport
    // update once more in case it went out of view
    update({ onlyUpdateInViewport: false })
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
    rect: reactiveRect, // Dom rect - doesn't change on scroll - not - reactive
    bounds, // scrolled bounding rect in pixels - not reactive
    scale, // reactive scene scale - includes z-axis so it can be spread onto mesh directly
    position, // scrolled element position in viewport units - not reactive
    scrollState, // scroll progress stats - not reactive
    inViewport, // reactive prop for when inside viewport
    update: (args) => update({ onlyUpdateInViewport: false, ...args }), // optional manual update
  }
}

export { useTracker }
