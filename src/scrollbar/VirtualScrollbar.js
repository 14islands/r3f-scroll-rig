import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import _lerp from '@14islands/lerp'

import config from '../config'
import useCanvasStore from '../store'
import ResizeManager from '../ResizeManager'

const FakeScroller = ({
  el,
  lerp = config.scrollLerp,
  restDelta = config.scrollRestDelta,
  onUpdate,
  threshold = 100,
}) => {
  const pageReflowRequested = useCanvasStore((state) => state.pageReflowRequested)
  const triggerReflowCompleted = useCanvasStore((state) => state.triggerReflowCompleted)
  const setScrollY = useCanvasStore((state) => state.setScrollY)

  const heightEl = useRef()
  const lastFrame = useRef(0)

  const [fakeHeight, setFakeHeight] = useState()

  const state = useRef({
    preventPointer: false,
    total: 0,
    scroll: {
      target: 0,
      current: 0,
      lerp,
      direction: 0,
      velocity: 0,
    },
    bounds: {
      height: window.innerHeight,
      scrollHeight: 0,
    },
    isResizing: false,
    sectionEls: null,
    sections: null,
  }).current

  // ANIMATION LOOP
  const run = (ts) => {
    const frameDelta = ts - lastFrame.current
    lastFrame.current = ts
    state.frame = window.requestAnimationFrame(run)
    const { scroll } = state

    scroll.current = _lerp(scroll.current, scroll.target, scroll.lerp, frameDelta * 0.001)
    const delta = scroll.current - scroll.target
    scroll.velocity = Math.abs(delta) // TODO fps independent velocity
    scroll.direction = Math.sign(delta)

    transformSections()

    // update callback
    onUpdate && onUpdate(scroll)

    // stop animation if delta is low
    if (scroll.velocity < restDelta) {
      window.cancelAnimationFrame(state.frame)
      state.frame = null
      // el.current && el.current.classList.remove('is-scrolling')
      preventPointerEvents(false)
    }
  }

  const transformSections = () => {
    const { total, isResizing, scroll, sections } = state
    const translate = `translate3d(0, ${-scroll.current}px, 0)`

    if (!sections) return

    for (let i = 0; i < total; i++) {
      const data = sections[i]
      const { el, bounds } = data

      if (isVisible(bounds) || isResizing) {
        Object.assign(data, { out: false })
        el.style.transform = translate
      } else if (!data.out) {
        Object.assign(data, { out: true })
        el.style.transform = translate
      }
    }
  }

  const isVisible = (bounds) => {
    const { height } = state.bounds
    const { current } = state.scroll
    const { top, bottom } = bounds

    const start = top - current
    const end = bottom - current
    const isVisible = start < threshold + height && end > -threshold

    return isVisible
  }

  const getSections = () => {
    if (!state.sectionEls) return
    state.sections = []
    state.sectionEls.forEach((el) => {
      el.style.transform = 'translate3d(0, 0, 0)'
      // FF complains that we exceed the budget for willChange and will ignore the rest
      // Testing to remove this to see if it speeds up other things
      // el.style.willChange = 'transform'
      const { top, bottom } = el.getBoundingClientRect()
      state.sections.push({
        el,
        bounds: {
          top,
          bottom,
        },
        out: true,
      })
    })
  }

  // disable pointer events while scrolling to avoid slow event handlers
  const preventPointerEvents = (prevent) => {
    if (el.current) {
      el.current.style.pointerEvents = prevent ? 'none' : ''
    }
    state.preventPointer = prevent
  }

  const onScroll = (val) => {
    // check if use with scroll wrapper or native scroll event
    state.scroll.target = window.pageYOffset
    setScrollY(state.scroll.target)

    // restart animation loop if needed
    if (!state.frame && !state.isResizing) {
      state.frame = window.requestAnimationFrame(run)
    }

    if (!state.preventPointer && state.scroll.velocity > 100) {
      setTimeout(() => {
        // el.current && el.current.classList.add('is-scrolling')
        state.preventPointer = true
        preventPointerEvents(true)
      }, 0)
    }
  }

  // reset pointer events when moving mouse
  const onMouseMove = () => {
    if (state.preventPointer) {
      preventPointerEvents(false)
    }
  }

  // Bind mouse event
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  // Bind scroll event
  useEffect(() => {
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (el.current) {
      state.sectionEls = Array.from(el.current.children)
      state.total = state.sectionEls.length
      getSections()
    }
    // reset on umount
    return () => {
      const { sections } = state
      if (sections) {
        sections.forEach(({ el, bounds }) => {
          el.style.transform = ''
        })
        state.sections = null
      }
    }
  }, [el.current])

  // RESIZE calculate fake height and move elemnts into place
  const handleResize = () => {
    const { total, bounds, sections, scroll } = state

    state.isResizing = true
    bounds.height = window.innerHeight

    // move els back into place and measure their offset
    if (sections) {
      sections.forEach(({ el, bounds }) => {
        el.style.transform = 'translate3d(0, 0, 0)'
        const { top, bottom } = el.getBoundingClientRect()
        bounds.top = top
        bounds.bottom = bottom
      })
    }

    // set viewport height and fake document height
    const { bottom } = state.sectionEls[total - 1].getBoundingClientRect()
    bounds.scrollHeight = bottom

    // update fake height
    setFakeHeight(`${bounds.scrollHeight}px`)

    setTimeout(() => {
      // get new scroll position (changes if window height became smaller)
      scroll.current = window.pageYOffset

      // move all items into place
      transformSections()

      // notify canvas components to refresh positions
      triggerReflowCompleted()

      state.isResizing = false
    }, 0)
  }

  useEffect(() => {
    handleResize()
  }, [pageReflowRequested])

  return <div className="js-fake-scroll" ref={heightEl} style={{ height: fakeHeight }}></div>
}

FakeScroller.propTypes = {
  el: PropTypes.object,
  threshold: PropTypes.number, // when to stop translating outside viewport
  lerp: PropTypes.number,
  restDelta: PropTypes.number,
  onUpdate: PropTypes.func,
}

/**
 * Wrapper for virtual scrollbar
 * @param {*} param0
 */
const VirtualScrollbar = ({ disabled, resizeOnHeight, children, scrollToTop = false, ...rest }) => {
  const ref = useRef()
  const [active, setActive] = useState(false)

  // FakeScroller wont trigger resize without touching the store here..
  // due to code splitting maybe? two instances of the store?
  const requestReflow = useCanvasStore((state) => state.requestReflow)
  const setVirtualScrollbar = useCanvasStore((state) => state.setVirtualScrollbar)

  // Optional: scroll to top when scrollbar mounts
  useLayoutEffect(() => {
    if (!scrollToTop) return
    // __tl_back_button_pressed is set by `gatsby-plugin-transition-link`
    if (!window.__tl_back_button_pressed) {
      // make sure we start at top if scrollbar is active (transition)
      !disabled && window.scrollTo(0, 0)
    }
  }, [scrollToTop, disabled])

  useEffect(() => {
    document.documentElement.classList.toggle('js-has-virtual-scrollbar', !disabled)
    setVirtualScrollbar(!disabled)
    // allow webgl components to find positions first on page load
    const timer = setTimeout(() => {
      setActive(!disabled)
      // tell GlobalCanvas that VirtualScrollbar is active
      config.hasVirtualScrollbar = !disabled
    }, 0)
    return () => {
      clearTimeout(timer)
      config.hasVirtualScrollbar = false
    }
  }, [disabled])

  const activeStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    // overflow: 'hidden',  // prevents tabbing to links in Chrome
  }

  const style = active ? activeStyle : {}
  return (
    <>
      {/* Always render children to prevent double mount */}
      {children({ ref, style })}
      {active && <FakeScroller el={ref} {...rest} />}
      {!config.hasGlobalCanvas && <ResizeManager reflow={requestReflow} resizeOnHeight={resizeOnHeight} />}
    </>
  )
}

VirtualScrollbar.propTypes = {
  disabled: PropTypes.bool,
  resizeOnHeight: PropTypes.bool,
  onUpdate: PropTypes.func,
  scrollToTop: PropTypes.bool,
}

export { VirtualScrollbar }
