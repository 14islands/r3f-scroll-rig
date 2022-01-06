import React, { memo, useRef, useEffect, forwardRef } from 'react'
import ReactDOM from 'react-dom'
import _lerp from '@14islands/lerp'
import PropTypes from 'prop-types'
import { useWindowHeight } from '@react-hook/window-size'

import { requestIdleCallback, cancelIdleCallback } from '../polyfills/requestIdleCallback'

import config from '../config'
import { useCanvasStore } from '../store'

// Linear interpolation from last position - high performance easing
const LAYOUT_LERP = 0.1

/**
 * Render child element in portal and move using useFrame so we can and match the lerp of the VirtualScrollbar
 * TThe original el used for position
 * @author david@14islands.com
 */
const ScrollDomPortal = forwardRef(
  (
    {
      el,
      portalEl,
      lerp, // override global lerp. don't change if you want to stay synched with the virtual scrollbar
      lerpOffset = 1, // change current lerp by a factor - use this instead of `lerp`
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
    const local = useRef({ needUpdate: false, offsetY: 0, offsetX: 0, raf: -1, lastFrame: -1 }).current
    const bounds = useRef({ top: 0, left: 0, width: 0, height: 0 }).current
    const prevBounds = useRef({ top: 0, wasOffscreen: false }).current
    const viewportHeight = useWindowHeight()

    const pageReflowCompleted = useCanvasStore((state) => state.pageReflowCompleted)

    const invalidate = () => {
      window.cancelAnimationFrame(local.raf)
      local.raf = window.requestAnimationFrame(frame)
    }

    // get initial scrollY and listen for transient updates
    const scrollY = useRef(useCanvasStore.getState().scrollY)
    useEffect(
      () =>
        useCanvasStore.subscribe(
          (state) => state.scrollY,
          (y) => {
            scrollY.current = y
            invalidate() // Trigger render on scroll
          },
        ),
      [],
    )

    // Find initial position of proxy element on mount
    useEffect(() => {
      if (!el || !el.current) return

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
      copyEl.current.style.zIndex = zIndex
      copyEl.current.style.position = 'fixed'

      // trigger render
      local.needUpdate = true
      invalidate()
    }, [el]) // TODO: decide if react to size.height to avoid mobile viewport scroll bugs

    const updateSizeAndPosition = () => {
      if (!el || !el.current) return

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
      invalidate()
    }

    // Update position on window resize
    useEffect(() => {
      updateSizeAndPosition()
    }, [pageReflowCompleted])

    // Update position if `live` flag changes
    useEffect(() => {
      const id = requestIdleCallback(updateSizeAndPosition, { timeout: 100 })
      return () => cancelIdleCallback(id)
    }, [live])

    // RENDER FRAME
    const frame = (ts) => {
      const { top, height } = bounds
      if (!local.lastFrame) {
        local.lastFrame = ts
      }
      const frameDelta = (ts - local.lastFrame) * 0.001
      local.lastFrame = ts

      // get offset from resizing window + offset from callback function from parent
      const offsetX = local.offsetX + ((live && getOffset()?.x) || 0)
      const offsetY = local.offsetY + ((live && getOffset()?.y) || 0)

      // add scroll value to bounds to get current position
      const scrollTop = -scrollY.current

      // frame delta
      const deltaScroll = prevBounds.top - scrollTop
      const delta = Math.abs(deltaScroll) + Math.abs(prevBounds.x - offsetX) + Math.abs(prevBounds.y - offsetY)

      if (!local.needUpdate && delta < config.scrollRestDelta) {
        // abort if no delta change
        return
      }

      // Lerp the distance
      const lerpScroll = _lerp(prevBounds.top, scrollTop, (lerp || config.scrollLerp) * lerpOffset, frameDelta)
      const lerpX = _lerp(prevBounds.x, offsetX, layoutLerp, frameDelta)
      const lerpY = _lerp(prevBounds.y, offsetY, layoutLerp, frameDelta)

      // Abort if element not in screen
      const elTop = top + lerpScroll + lerpY
      const isOffscreen = elTop + height < -100 || elTop > viewportHeight + 100

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
        invalidate()
        local.needUpdate = true
      }
    }

    if (!children) {
      return null
    }

    const child = React.Children.only(React.cloneElement(children, { ref: copyEl }))
    if (portalEl) {
      return ReactDOM.createPortal(child, portalEl)
    }
    return child
  },
)

ScrollDomPortal.displayName = 'ScrollDomPortal'

ScrollDomPortal.propTypes = {
  el: PropTypes.object, // DOM element to track,
  portalEl: PropTypes.object, // DOM element to portal into,
  lerp: PropTypes.number, // Base lerp ratio
  lerpOffset: PropTypes.number, // Offset factor applied to `lerp`
  zIndex: PropTypes.number, // z-index to apply to the cloned element
  getOffset: PropTypes.func, // called for every frame to get {x,y} translation offset
  live: PropTypes.bool,
  layoutLerp: PropTypes.number,
  style: PropTypes.object,
}

export { ScrollDomPortal }
export default memo(ScrollDomPortal)
