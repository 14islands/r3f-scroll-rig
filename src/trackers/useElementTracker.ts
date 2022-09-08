import { useMemo, useEffect, useRef, useState, startTransition } from 'react'
import { useThree, useFrame, invalidate } from '@react-three/fiber'
import _lerp from '@14islands/lerp'
import { MathUtils } from 'three'

import config from '../config'
import { useCanvasStore } from '../store'

import type {
  ElementTrackerProps,
  ElementTracker,
  ScrollPosition,
  ScrollState,
  PropsOrElement,
} from './useElementTracker.d'

function isElementProps(obj: any): obj is ElementTrackerProps {
  return typeof obj === 'object' && 'element' in obj
}

const defaultArgs = { lerp: undefined, inViewportMargin: 0.33, onPositionChange: () => {} }

/**
 * Returns the current Scene position of the DOM element
 * based on initial getBoundingClientRect and scroll delta from start
 */
function useElementTracker(args: PropsOrElement, deps: any[] = []): ElementTracker {
  const size = useThree((s) => s.size)
  const [inViewport, setInViewport] = useState(false)

  useEffect(
    () =>
      useCanvasStore.subscribe(
        (state) => state.scrollY,
        (y) => {
          // TODO move to scrollbars?
          invalidate() // Trigger render on scroll
        }
      ),
    []
  )

  const { element, lerp, inViewportMargin, onPositionChange } = isElementProps(args)
    ? { ...defaultArgs, ...args }
    : { ...defaultArgs, element: args }
  const scrollMargin = size.height * inViewportMargin

  // cache the return object
  const position: ScrollPosition = useRef({
    x: 0, // bounds?.x * config.scaleMultiplier, // lerp position
    y: 0, // -1 * bounds?.y * config.scaleMultiplier, // lerp position
    top: 0,
    left: 0,
    positiveYUpBottom: 0,
    realX: 0, // bounds?.x * config.scaleMultiplier, // exact position
    realY: 0, //-1 * bounds?.y * config.scaleMultiplier, // exact position
  }).current

  // DOM rect bounds
  const bounds = useMemo(() => {
    const { top, left, width, height } = element.current?.getBoundingClientRect() || {}

    // Offset to Threejs scene which has 0,0 in the center of the screen
    const sceneOffset = { x: size.width * 0.5 - width * 0.5, y: size.height * 0.5 - height * 0.5 }
    const bounds = {
      top: top + window.pageYOffset,
      left: left + window.pageXOffset,
      width,
      height,
      sceneOffset,
      x: left + window.pageXOffset - sceneOffset.x, // 0 middle of screen
      y: top + window.pageYOffset - sceneOffset.y, // 0 middle of screen
    }

    // update position
    // position.x = bounds?.x * config.scaleMultiplier // lerp position
    // position.y = -1 * bounds?.y * config.scaleMultiplier // lerp position
    position.top = position.y + bounds.sceneOffset.y
    position.left = position.x + bounds.sceneOffset.x
    position.positiveYUpBottom = 0
    position.realX = (bounds?.x - useCanvasStore.getState().scrollX) * config.scaleMultiplier // exact position
    position.realY = -1 * (bounds?.y - useCanvasStore.getState().scrollY) * config.scaleMultiplier // exact position

    return bounds
  }, [element, size, ...deps])

  // scale in viewport units and pixel
  const scale = useMemo(() => {
    return [bounds?.width * config.scaleMultiplier, bounds?.height * config.scaleMultiplier, 1]
  }, [element, size, ...deps]) as [width: number, height: number, depth: number]

  const scrollState: ScrollState = useRef({
    inViewport: false,
    progress: -1,
    visibility: -1,
    viewport: -1,
    deltaY: 0,
  }).current

  useFrame((_, frameDelta) => {
    if (!element.current) return

    position.realY = -1 * (bounds.y - useCanvasStore.getState().scrollY) * config.scaleMultiplier
    position.realX = (bounds.x - useCanvasStore.getState().scrollX) * config.scaleMultiplier

    // frame delta
    const dY = position.y - position.realY
    const delta = Math.abs(dY)

    // lerp Y
    position.y = _lerp(position.y, position.realY, lerp || config.scrollLerp, frameDelta)
    position.top = position.y + bounds.sceneOffset.y

    // lerp X
    position.x = _lerp(position.x, position.realX, lerp || config.scrollLerp, frameDelta)
    position.left = position.x + bounds.sceneOffset.x

    position.positiveYUpBottom = size.height * 0.5 - (position.y + bounds.height * 0.5) // inverse Y

    // Scroll State stuff
    scrollState.inViewport =
      position.realY + size.height * 0.5 + bounds.height * 0.5 > 0 - scrollMargin &&
      position.realY + size.height * 0.5 - bounds.height * 0.5 < size.height + scrollMargin

    // set inViewport state using a transition to avoid lagging
    if (scrollState.inViewport && !inViewport) startTransition(() => setInViewport(true))
    else if (!scrollState.inViewport && inViewport) startTransition(() => setInViewport(false))

    // calculate progress of passing through viewport (0 = just entered, 1 = just exited)
    const pxInside = bounds.top + position.y - bounds.top + size.height - bounds.sceneOffset.y
    scrollState.progress = MathUtils.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1) // percent of total visible distance
    scrollState.visibility = MathUtils.mapLinear(pxInside, 0, bounds.height, 0, 1) // percent of item height in view
    scrollState.viewport = MathUtils.mapLinear(pxInside, 0, size.height, 0, 1) // percent of window height scrolled since visible
    scrollState.deltaY = dY // scroll delta

    // render another frame if delta is large enough
    if (scrollState.inViewport && delta > config.scrollRestDelta) {
      invalidate()
      onPositionChange()
    }
  })

  return {
    bounds, // HTML bounds
    scale, // Scene scale - includes z-axis so it can be spread onto mesh directly
    getScrollState: () => scrollState,
    getPosition: () => position, // get current Scene position with scroll taken into account
    inViewport,
  }
}

export { useElementTracker }
export default useElementTracker
