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

function _lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t
}

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

  const animate = () => {
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
    return () => {
      window.removeEventListener('wheel', onWheelEvent, { passive: false })
      window.removeEventListener('scroll', onScrollEvent)
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
