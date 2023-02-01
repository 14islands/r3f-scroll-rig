import { useEffect, useRef, useCallback, ReactElement, forwardRef, useImperativeHandle } from 'react'
import Lenis from '@studio-freight/lenis'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { useCanvasStore } from '../store'

export type ScrollCallback = (props: {
  scroll: number
  limit: number
  velocity: number
  direction: number
  progress: number
}) => void

export type ScrollToTarget = number | HTMLElement | string
export type ScrollToConfig = {
  offset: number
  immediate: boolean
  duration: number
  easing: (t: number) => number
}

export interface ISmoothScrollbar {
  children: (props: any) => ReactElement
  enabled?: boolean
  locked?: boolean
  scrollRestoration?: ScrollRestoration
  disablePointerOnScroll?: boolean
  horizontal?: boolean
  scrollInContainer?: boolean
  updateGlobalState?: boolean
  onScroll?: ScrollCallback
  config?: object
  invalidate?: () => void
  addEffect?: (cb: any) => () => void
}

const SmoothScrollbarImpl = (
  {
    children,
    enabled = true,
    locked = false,
    scrollRestoration = 'auto',
    disablePointerOnScroll = true,
    horizontal = false,
    scrollInContainer = false,
    updateGlobalState = true,
    onScroll,
    config = {},
    invalidate = () => {},
    addEffect,
  }: ISmoothScrollbar,
  ref: any
) => {
  const innerRef = useRef<HTMLElement>()
  const lenis = useRef<Lenis>()
  const preventPointer = useRef(false)
  const globalScrollState = useCanvasStore((state) => state.scroll)

  // Expose lenis imperative API
  useImperativeHandle(ref, () => ({
    start: () => lenis.current?.start(),
    stop: () => lenis.current?.stop(),
    on: (event: string, cb: ScrollCallback) => lenis.current?.on(event, cb),
    once: (event: string, cb: ScrollCallback) => lenis.current?.once(event, cb),
    off: (event: string, cb?: ScrollCallback) => lenis.current?.off(event, cb),
    notify: () => lenis.current?.notify(),
    scrollTo: (target: ScrollToTarget, props: ScrollToConfig) => lenis.current?.scrollTo(target, props),
    raf: (time: number) => lenis.current?.raf(time),
    __lenis: lenis.current,
  }))

  // disable pointer events while scrolling to avoid slow event handlers
  const preventPointerEvents = (prevent: boolean) => {
    if (!disablePointerOnScroll) return
    if (innerRef.current && preventPointer.current !== prevent) {
      preventPointer.current = prevent
      console.log(prevent)
      innerRef.current.style.pointerEvents = prevent ? 'none' : 'auto'
    }
  }

  // reset pointer events when moving mouse
  const onMouseMove = useCallback(() => {
    preventPointerEvents(false)
  }, [])

  // function to bind to scroll event
  // return function that will unbind same callback
  const globalOnScroll = useCallback((cb: ScrollCallback) => {
    lenis.current?.on('scroll', cb)
    return () => lenis.current?.off('scroll', cb)
  }, [])

  // apply chosen scroll restoration
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = scrollRestoration
    }
  }, [])

  // INIT LENIS
  useLayoutEffect(() => {
    // Set up scroll containers - allows scrolling without resizing window on iOS/mobile
    const html = document.documentElement
    const wrapper = document.body
    const content = document.body.firstElementChild

    html.classList.toggle('ScrollRig-scrollHtml', scrollInContainer)
    wrapper.classList.toggle('ScrollRig-scrollWrapper', scrollInContainer)

    if (scrollInContainer) {
      Object.assign(config, {
        smoothTouch: true,
        wrapper,
        content,
      })
    }

    lenis.current = new Lenis({
      direction: horizontal ? 'horizontal' : 'vertical',
      ...config,
    })

    // let r3f drive the frameloop
    let removeEffect: () => void
    if (addEffect) {
      removeEffect = addEffect((time: number) => lenis.current?.raf(time))
    } else {
      // manual animation frame
      let _raf: number
      function raf(time: number) {
        lenis.current?.raf(time)
        _raf = requestAnimationFrame(raf)
      }
      _raf = requestAnimationFrame(raf)
      removeEffect = () => cancelAnimationFrame(_raf)
    }

    return () => {
      removeEffect()
      lenis.current?.destroy()
    }
  }, [])

  // BIND TO LENIS SCROLL EVENT
  useLayoutEffect(() => {
    // update global scroll store
    lenis.current?.on('scroll', ({ scroll, limit, velocity, direction, progress }: any) => {
      const y = !horizontal ? scroll : 0
      const x = horizontal ? scroll : 0

      if (updateGlobalState) {
        globalScrollState.y = y
        globalScrollState.x = x
        globalScrollState.limit = limit
        globalScrollState.velocity = velocity
        globalScrollState.direction = direction
        globalScrollState.progress = progress
      }

      preventPointerEvents(Math.abs(velocity) > 0.14)

      onScroll && onScroll({ scroll, limit, velocity, direction, progress })

      invalidate()
    })

    // update global state
    if (updateGlobalState) {
      globalScrollState.scrollDirection = horizontal ? 'horizontal' : 'vertical'

      // expose global scrollTo function
      // @ts-ignore
      useCanvasStore.setState({ scrollTo: lenis.current?.scrollTo })

      // expose global onScroll function to subscribe to scroll events
      // @ts-ignore
      useCanvasStore.setState({ onScroll: globalOnScroll })

      // Set current scroll position on load in case reloaded further down
      useCanvasStore.getState().scroll.y = window.scrollY
      useCanvasStore.getState().scroll.x = window.scrollX
    }

    // trigger initial scroll event to update global state
    lenis.current?.notify()

    // make sure R3F loop is invalidated when scrolling
    const invalidateOnWheelEvent = () => invalidate()

    window.addEventListener('pointermove', onMouseMove)
    window.addEventListener('wheel', invalidateOnWheelEvent)
    return () => {
      lenis.current?.off('scroll')
      window.removeEventListener('pointermove', onMouseMove)
      window.removeEventListener('wheel', invalidateOnWheelEvent)
    }
  }, [])

  useEffect(() => {
    // Mark as enabled in global state
    if (updateGlobalState) {
      document.documentElement.classList.toggle('js-smooth-scrollbar-enabled', enabled)
      document.documentElement.classList.toggle('js-smooth-scrollbar-disabled', !enabled)
      useCanvasStore.setState({ hasSmoothScrollbar: enabled })
    }
  }, [enabled])

  useEffect(() => {
    locked ? lenis.current?.stop() : lenis.current?.start()
  }, [locked])

  {
    /* Use function child so we can spread props
    - for instance disable pointer events while scrolling */
  }
  return children({ ref: innerRef })
}

export const SmoothScrollbar = forwardRef<any, ISmoothScrollbar>(SmoothScrollbarImpl)
