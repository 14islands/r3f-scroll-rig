import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import config from '../config'
import useCanvasStore from '../store'
import requestIdleCallback from '../hooks/requestIdleCallback'
import ResizeManager from '../ResizeManager'

// FIXME test on touch devices - handle touchmove/pointermove event

// if r3f frameloop should be used, pass these props:
// const R3F_HijackedScrollbar = props => {
//   return <HijackedScrollbar {...props} useFrameLoop={addEffect} invalidate={invalidate} />
// }

function map_range(value, low1, high1, low2, high2) {
  return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1)
}

function _lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t
}

const DRAG_ACTIVE_LERP = 0.3
const DRAG_INERTIA_LERP = 0.05

export const HijackedScrollbar = ({
  children,
  disabled,
  onUpdate,
  speed = 1,
  lerp,
  restDelta,
  location,
  // useFrameLoop,
  invalidate,
  subpixelScrolling = false,
}) => {
  const setVirtualScrollbar = useCanvasStore((state) => state.setVirtualScrollbar)
  const requestReflow = useCanvasStore((state) => state.requestReflow)
  const pageReflowRequested = useCanvasStore((state) => state.pageReflowRequested)
  const setScrollY = useCanvasStore((state) => state.setScrollY)

  const y = useRef({ current: 0, target: 0 }).current
  const roundedY = useRef(0)
  const scrolling = useRef(false)
  const documentHeight = useRef(0)
  const delta = useRef(0)

  const animate = (ts) => {
    if (!scrolling.current) return

    // use internal target with floating point precision to make sure lerp is smooth
    const newTarget = _lerp(y.current, y.target, lerp || config.scrollLerp)

    delta.current = Math.abs(y.current - newTarget)

    y.current = newTarget

    // round for scrollbar
    roundedY.current = Math.floor(y.current)

    // if (!useFrameLoop) {
    setScrollPosition()
    // }
  }

  const setScrollPosition = () => {
    if (!scrolling.current) return
    window.scrollTo(0, roundedY.current)

    // Trigger optional callback here
    onUpdate && onUpdate(y)

    // TODO set scrolling.current = false here instead to avoid trailing scroll event
    if (delta.current <= (restDelta || config.scrollRestDelta)) {
      scrolling.current = false
    } else {
      invalidate ? invalidate() : window.requestAnimationFrame(animate)
    }
  }

  // update scroll position last
  // useEffect(() => {
  //   if (useFrameLoop) {
  //     return addAfterEffect(setScrollPosition)
  //   }
  // }, [])

  // disable subpixelScrolling for better visual sync with canvas
  useEffect(() => {
    const ssBefore = config.subpixelScrolling
    config.subpixelScrolling = subpixelScrolling
    return () => {
      config.subpixelScrolling = ssBefore
    }
  }, [])

  // reset scroll on mount/unmount FIX history?!
  useEffect(() => {
    setScrollY(window.pageYOffset)
    return () => {
      setScrollY(window.pageYOffset)
    }
  }, [])

  // Check if we are using an external frame loop
  // useEffect(() => {
  //   if (useFrameLoop) {
  //     // update scroll target before everything else
  //     return useFrameLoop(animate)
  //   }
  // }, [useFrameLoop])

  const onScrollEvent = (e) => {
    e.preventDefault()

    // Scroll manually using keys or drag scrollbars
    if (!scrolling.current) {
      y.current = window.scrollY
      y.target = window.scrollY

      // set lerp to 1 temporarily so stuff moves immediately
      if (!config._scrollLerp) {
        config._scrollLerp = config.scrollLerp
      }
      config.scrollLerp = 1

      setScrollY(y.target)
      onUpdate && onUpdate(y)
    }
  }

  const onTouchStart = (e) => {
    e.preventDefault()
    const startY = e.touches[0].clientY
    let deltaY = 0
    let velY = 0
    let lastEventTs = 0
    let frameDelta

    y.target = y.current
    setScrollY(y.target)

    function calculateTouchScroll(touch) {
      const newDeltaY = touch.clientY - startY
      frameDelta = deltaY - newDeltaY
      deltaY = newDeltaY

      const now = Date.now()
      const elapsed = now - lastEventTs
      lastEventTs = now

      // calculate velocity
      const v = (1000 * frameDelta) / (1 + elapsed)

      // smooth using moving average filter (https://ariya.io/2013/11/javascript-kinetic-scrolling-part-2)
      velY = 0.1 * v + 0.9 * velY
    }

    const onTouchMove = (e) => {
      e.preventDefault()
      calculateTouchScroll(e.touches[0])

      config.scrollLerp = DRAG_ACTIVE_LERP

      y.target = Math.min(Math.max(y.target + frameDelta * speed, 0), documentHeight.current)

      if (!scrolling.current) {
        scrolling.current = true
        invalidate ? invalidate() : window.requestAnimationFrame(animate)
      }

      setScrollY(y.target)
    }

    const onTouchCancel = (e) => {
      e.preventDefault()
      window.removeEventListener('touchmove', onTouchMove, { passive: false })
      window.removeEventListener('touchend', onTouchEnd, { passive: false })
      window.removeEventListener('touchcancel', onTouchCancel, { passive: false })
    }

    const onTouchEnd = (e) => {
      e.preventDefault()
      window.removeEventListener('touchmove', onTouchMove, { passive: false })
      window.removeEventListener('touchend', onTouchEnd, { passive: false })
      window.removeEventListener('touchcancel', onTouchCancel, { passive: false })

      // reduce velocity if took time to release finger
      const elapsed = Date.now() - lastEventTs
      const time = Math.min(1, Math.max(0, map_range(elapsed, 0, 100, 0, 1)))
      velY = _lerp(velY, 0, time)

      // inertia lerp
      config.scrollLerp = DRAG_INERTIA_LERP

      y.target = Math.min(Math.max(y.current + velY, 0), documentHeight.current)

      if (!scrolling.current) {
        scrolling.current = true
        invalidate ? invalidate() : window.requestAnimationFrame(animate)
      }

      setScrollY(y.target)
    }

    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: false })
    window.addEventListener('touchcancel', onTouchCancel, { passive: false })
  }

  // find available scroll height
  useEffect(() => {
    requestIdleCallback(() => {
      documentHeight.current = document.body.clientHeight - window.innerHeight
    })
  }, [pageReflowRequested, location])

  const onWheelEvent = (e) => {
    e.preventDefault()

    y.target = Math.min(Math.max(y.target + e.deltaY * speed, 0), documentHeight.current)

    if (!scrolling.current) {
      scrolling.current = true
      invalidate ? invalidate() : window.requestAnimationFrame(animate)
    }

    // restore lerp from saved value in case scrolled manually
    config.scrollLerp = config._scrollLerp || config.scrollLerp
    config._scrollLerp = undefined

    setScrollY(y.target)
  }

  useEffect(() => {
    document.documentElement.classList.toggle('js-has-virtual-scrollbar', !disabled)
    setVirtualScrollbar(!disabled)
    if (disabled) return
    // TODO use use-gesture and also handle touchmove
    window.addEventListener('wheel', onWheelEvent, { passive: false })
    window.addEventListener('scroll', onScrollEvent)
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheelEvent, { passive: false })
      window.removeEventListener('scroll', onScrollEvent)
      window.removeEventListener('touchstart', onTouchStart, { passive: false })
    }
  }, [disabled])

  return (
    <>
      {children({})}
      {!config.hasGlobalCanvas && <ResizeManager reflow={requestReflow} />}
    </>
  )
}

HijackedScrollbar.propTypes = {
  disabled: PropTypes.bool,
  onUpdate: PropTypes.func,
  speed: PropTypes.number,
  lerp: PropTypes.number,
  restDelta: PropTypes.number,
  location: PropTypes.any,
  // useFrameLoop: PropTypes.func,
  invalidate: PropTypes.func,
  subpixelScrolling: PropTypes.bool,
}
