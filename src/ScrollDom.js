import React, { memo, useRef, useEffect, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Math as MathUtils } from 'three'
import { useFrame, useThree } from 'react-three-fiber'
import { useViewportScroll } from 'framer-motion'

import { requestIdleCallback, cancelIdleCallback } from './hooks/requestIdleCallback'

import config from './config'
import { useCanvasStore } from './store'
import useScrollRig from './useScrollRig'

// Linear interpolation from last position - high performance easing
const LAYOUT_LERP = 0.1

/**
 * Make DOM element fixed and move using useFrame so we can and match the lerp of a PerspectiveCameraScene
 * The referenced DOM element will be cloned and made position:fixed. The original el is hidden.
 * @author david@14islands.com
 */
const ScrollDom = forwardRef(
  (
    {
      el,
      appendTo,
      lerp = config.scrollLerp,
      lerpOffset = 0,
      children,
      zIndex = 0,
      getOffset = () => {},
      live = false, // detect new changes from the DOM (useful if aimating el position with CSS)
      layoutLerp = LAYOUT_LERP, // easing to apply to layout transition
      style,
    },
    ref,
  ) => {
    const copyEl = useRef()
    const local = useRef({ needUpdate: false, offsetY: 0, offsetX: 0 }).current
    const bounds = useRef({ top: 0, left: 0, width: 0, height: 0, windowHeight: -1, windowWidth: -1 }).current
    const prevBounds = useRef({ top: 0, wasOffscreen: false }).current
    const { scrollY } = useViewportScroll()
    const { size } = useThree()
    const { requestFrame } = useScrollRig()

    const pageReflowCompleted = useCanvasStore((state) => state.pageReflowCompleted)

    // El is rendered
    useEffect(() => {
      // hide DOM element visually - leave in DOM to measure and get events
      if (!el?.current) return
      copyEl.current = el.current.cloneNode(true)
      copyEl.current.style.position = 'fixed'
      copyEl.current.style.visibility = 'visible'
      copyEl.current.style.zIndex = zIndex
      ;(appendTo?.current || document.documentElement).appendChild(copyEl.current)
      el.current.style.visibility = 'hidden'
      ref && ref(copyEl.current)
      return () => {
        ;(appendTo?.current || document.documentElement).removeChild(copyEl.current)
        if (el && el.current) {
          el.current.style.visibility = ''
        }
      }
    }, [el.current])

    // Trigger render on scroll
    useEffect(
      () =>
        scrollY.onChange(() => {
          local.needUpdate = true
          requestFrame()
        }),
      [],
    )

    // Find initial position of proxy element on mount
    useEffect(() => {
      if (!el || !el.current) return

      copyEl.current.className = el.current.className

      const { top, left, width, height } = el.current.getBoundingClientRect()
      bounds.top = top + window.pageYOffset
      bounds.left = left
      bounds.width = width
      bounds.height = height
      prevBounds.top = -window.pageYOffset
      prevBounds.left = 0
      prevBounds.x = 0
      prevBounds.y = 0

      copyEl.current.style.top = bounds.top + 'px'
      copyEl.current.style.left = left + 'px'
      copyEl.current.style.width = width + 'px'
      copyEl.current.style.height = height + 'px'

      local.windowWidth = size.width
      local.windowHeight = size.height

      // trigger render
      local.needUpdate = true
      requestFrame()
    }, [el]) // TODO: decide if react to size.height to avoid mobile viewport scroll bugs

    // Update position on window resize or if `live` flag changes
    useEffect(() => {
      if (!el || !el.current) return

      const id = requestIdleCallback(
        () => {
          if (!el || !el.current) return

          const classNames = el.current.className
          if (!classNames !== copyEl.current.className) {
            copyEl.current.className = classNames
          }

          const { top, left } = bounds
          const { top: newTop, left: newLeft, height: newHeight, width: newWidth } = el.current.getBoundingClientRect()

          if (bounds.height !== newHeight) {
            copyEl.current.style.height = newHeight + 'px'
          }
          if (bounds.width !== newWidth) {
            copyEl.current.style.width = newWidth + 'px'
            // TODO adjust left position if floating from right. possible to detect?
          }

          local.offsetY = newTop - top + window.pageYOffset
          local.offsetX = newLeft - left
          bounds.height = newHeight
          bounds.width = newWidth
          prevBounds.top = -window.pageYOffset

          // trigger render
          local.needUpdate = true
          requestFrame()
        },
        { timeout: 100 },
      )
      return () => cancelIdleCallback(id)
    }, [live, pageReflowCompleted])

    useEffect(() => {
      local.needUpdate = true
      requestFrame()
    }, [style])

    // RENDER FRAME
    useFrame(({ gl }) => {
      const { top, height } = bounds

      // get offset from resizing window + offset from callback function from parent
      const offsetX = local.offsetX + ((live && getOffset()?.x) || 0)
      const offsetY = local.offsetY + ((live && getOffset()?.y) || 0)

      // add scroll value to bounds to get current position
      const scrollTop = -scrollY.get()

      // frame delta
      const deltaScroll = prevBounds.top - scrollTop
      const delta = Math.abs(deltaScroll) + Math.abs(prevBounds.x - offsetX) + Math.abs(prevBounds.y - offsetY)

      if (!local.needUpdate && delta < config.scrollRestDelta) {
        // abort if no delta change
        return
      }

      // parallax position
      // const progress = MathUtils.lerp(1, -1, MathUtils.clamp((size.height - scrollTop) / (size.height + height), 0, 1))
      // const offset = transform(progress, [1, 0, -1], [0, 0, 400])
      // scrollTop += offset

      // Lerp the distance to simulate easing
      const lerpScroll = MathUtils.lerp(prevBounds.top, scrollTop, lerp + lerpOffset)
      const lerpX = MathUtils.lerp(prevBounds.x, offsetX, layoutLerp)
      const lerpY = MathUtils.lerp(prevBounds.y, offsetY, layoutLerp)

      // Abort if element not in screen
      const elTop = top + lerpScroll + lerpY
      const isOffscreen = elTop + height < -100 || elTop > size.height + 100

      // Update DOM element position if in view, or if was in view last frame
      if (!isOffscreen) {
        if (copyEl.current) {
          Object.assign(copyEl.current.style, {
            visibility: '',
            ...style,
            transform: `translate3d(${lerpX}px, ${lerpScroll + lerpY}px, 0)`,
          })
        }
      } else {
        if (copyEl.current) {
          copyEl.current.style.visibility = 'hidden'
        }
      }

      // store values for next frame
      prevBounds.top = lerpScroll
      prevBounds.wasOffscreen = isOffscreen
      prevBounds.x = lerpX
      prevBounds.y = lerpY
      local.needUpdate = false

      // render another frame if delta is large enough
      if (!isOffscreen && delta > config.scrollRestDelta) {
        requestFrame()
        local.needUpdate = true
      }
    })

    return <></>
  },
)

ScrollDom.displayName = 'ScrollDom'

ScrollDom.propTypes = {
  el: PropTypes.object, // DOM element to track,
  lerp: PropTypes.number, // Base lerp ratio
  lerpOffset: PropTypes.number, // Offset applied to `lerp`
  zIndex: PropTypes.number, // z-index to apply to the cloned element
  getOffset: PropTypes.func, // called for every frame to get {x,y} translation offset
  appendTo: PropTypes.any,
  live: PropTypes.bool,
  layoutLerp: PropTypes.number,
  style: PropTypes.object,
}

export default memo(ScrollDom)
