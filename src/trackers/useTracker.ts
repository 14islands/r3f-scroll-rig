import { useMemo, useRef, useState, startTransition, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { MathUtils } from 'three'

import config from '../config'
import { useScrollbar } from '../scrollbar/useScrollbar'

import type { ElementTrackerProps, ElementTracker, ScrollPosition, ScrollState, PropsOrElement } from './useTracker.d'

function isElementProps(obj: any): obj is ElementTrackerProps {
  return typeof obj === 'object' && 'track' in obj
}

const defaultArgs = { inViewportMargin: 0.33 }

/**
 * Returns the current Scene position of the DOM element
 * based on initial getBoundingClientRect and scroll delta from start
 */
function useTracker(args: PropsOrElement, deps: any[] = []): ElementTracker {
  const size = useThree((s) => s.size)
  const [inViewport, setInViewport] = useState(false)
  const { scroll } = useScrollbar()

  const { track, inViewportMargin } = isElementProps(args)
    ? { ...defaultArgs, ...args }
    : { ...defaultArgs, track: args }
  const scrollMargin = size.height * inViewportMargin

  // cache the return object
  const position: ScrollPosition = useRef({
    x: 0, // exact position on page
    y: 0, // exact position on page
    top: 0,
    left: 0,
    positiveYUpBottom: 0,
  }).current

  // DOM rect bounds
  const bounds = useMemo(() => {
    const { top, bottom, left, right, width, height } = track.current?.getBoundingClientRect() || {}

    // Offset to Threejs scene which has 0,0 in the center of the screen
    const sceneOffset = { x: size.width * 0.5 - width * 0.5, y: size.height * 0.5 - height * 0.5 }
    const bounds = {
      top: top + window.scrollY,
      bottom: bottom + window.scrollY,
      left: left + window.scrollX,
      right: right + window.scrollX,
      width,
      height,
      sceneOffset,
      x: left + window.scrollX - sceneOffset.x, // 0 middle of screen
      y: top + window.scrollY - sceneOffset.y, // 0 middle of screen
    }

    // update position
    position.x = (bounds?.x - window.scrollX) * config.scaleMultiplier // exact position
    position.y = -1 * (bounds?.y - window.scrollY) * config.scaleMultiplier // exact position

    position.top = position.y + bounds.sceneOffset.y
    position.left = position.x + bounds.sceneOffset.x
    position.positiveYUpBottom = 0

    return bounds
  }, [track, size, ...deps])

  // scale in viewport units and pixel
  const scale = useMemo(() => {
    return [bounds?.width * config.scaleMultiplier, bounds?.height * config.scaleMultiplier, 1]
  }, [track, size, ...deps]) as [width: number, height: number, depth: number]

  const scrollState: ScrollState = useRef({
    inViewport: false,
    progress: -1,
    visibility: -1,
    viewport: -1,
  }).current

  const update = useCallback(() => {
    if (!track.current) return

    position.x = (bounds.x - scroll.x) * config.scaleMultiplier
    position.y = -1 * (bounds.y - scroll.y) * config.scaleMultiplier
    position.top = position.y + bounds.sceneOffset.y
    position.left = position.x + bounds.sceneOffset.x
    position.positiveYUpBottom = size.height * 0.5 + (position.y / config.scaleMultiplier - bounds.height * 0.5) // inverse Y

    // viewportscene
    // const positiveYUpBottom = size.height - (newTop / config.scaleMultiplier + bounds.height) // inverse Y

    // Scroll State stuff
    scrollState.inViewport =
      position.y + size.height * 0.5 + bounds.height * 0.5 > 0 - scrollMargin &&
      position.y + size.height * 0.5 - bounds.height * 0.5 < size.height + scrollMargin

    // set inViewport state using a transition to avoid lagging
    if (scrollState.inViewport && !inViewport) startTransition(() => setInViewport(true))
    else if (!scrollState.inViewport && inViewport) startTransition(() => setInViewport(false))

    if (scrollState.inViewport) {
      // calculate progress of passing through viewport (0 = just entered, 1 = just exited)
      const pxInside = bounds.top + position.y - bounds.top + size.height - bounds.sceneOffset.y
      scrollState.progress = MathUtils.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1) // percent of total visible distance
      scrollState.visibility = MathUtils.mapLinear(pxInside, 0, bounds.height, 0, 1) // percent of item height in view
      scrollState.viewport = MathUtils.mapLinear(pxInside, 0, size.height, 0, 1) // percent of window height scrolled since visible
    }
  }, [bounds, track, size])

  return {
    bounds, // HTML initial bounds
    scale, // Scene scale - includes z-axis so it can be spread onto mesh directly
    scrollState,
    position, // get current Scene position with scroll taken into account
    inViewport,
    update, // call in rAF to update with latest scroll position
  }
}

export { useTracker }
export default useTracker
