import React, { useEffect, useRef, useCallback, ReactElement, useMemo } from 'react'
import { addEffect, invalidate } from '@react-three/fiber'
import pkg from 'debounce'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { useCanvasStore } from '../store'

import LenisScrollbar, { ILenisScrollbar, LenisScrollCallback } from './LenisScrollbar'
interface ISmoothScrobbar {
  children: (props: any) => ReactElement
  scrollRestoration?: ScrollRestoration
  enabled?: boolean
  locked?: boolean
  disablePointerOnScroll?: boolean
  config?: object
  horizontal?: boolean
  scrollInContainer?: boolean
}

export const SmoothScrollbar = ({
  children,
  enabled = true,
  locked = false,
  scrollRestoration = 'auto',
  disablePointerOnScroll = true,
  horizontal = false,
  scrollInContainer = false,
  config,
}: ISmoothScrobbar) => {
  const ref = useRef<HTMLElement>()
  const lenis = useRef<ILenisScrollbar>()
  const preventPointer = useRef(false)
  const globalScrollState = useCanvasStore((state) => state.scroll)

  // set initial scroll direction
  // need to be updated before children render
  globalScrollState.direction = horizontal ? 'horizontal' : 'vertical'

  // disable pointer events while scrolling to avoid slow event handlers
  const preventPointerEvents = (prevent: boolean) => {
    if (!disablePointerOnScroll) return
    if (ref.current && preventPointer.current !== prevent) {
      preventPointer.current = prevent
      ref.current.style.pointerEvents = prevent ? 'none' : 'auto'
    }
  }

  // reset pointer events when moving mouse
  const onMouseMove = useCallback(() => {
    preventPointerEvents(false)
  }, [])

  // function to bind to scroll event
  // return function that will unbind same callback
  const onScroll = useCallback((cb: LenisScrollCallback) => {
    lenis.current?.on('scroll', cb)
    return () => lenis.current?.off('scroll', cb)
  }, [])

  // apply chosen scroll restoration
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = scrollRestoration
    }
  }, [])

  useEffect(() => {
    // let r3f drive the frameloop
    const removeEffect = addEffect((time: number) => lenis.current?.raf(time))

    // update global scroll store
    lenis.current?.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
      globalScrollState.y = direction === 'vertical' ? scroll : 0
      globalScrollState.x = direction === 'horizontal' ? scroll : 0
      globalScrollState.limit = limit
      globalScrollState.velocity = velocity
      globalScrollState.direction = direction
      globalScrollState.progress = progress

      // disable pointer logic
      const disablePointer = pkg.debounce(() => preventPointerEvents(true), 100, true)
      if (Math.abs(velocity) > 1.4) {
        disablePointer()
      } else {
        preventPointerEvents(false)
      }

      invalidate()
    })
    lenis.current?.notify()

    // expose global scrollTo function
    // @ts-ignore
    useCanvasStore.setState({ scrollTo: lenis.current?.scrollTo })

    // expose global onScroll function to subscribe to scroll events
    // @ts-ignore
    useCanvasStore.setState({ onScroll })

    // Set current scroll position on load in case reloaded further down
    useCanvasStore.getState().scroll.y = window.scrollY
    useCanvasStore.getState().scroll.x = window.scrollX

    // Set active
    document.documentElement.classList.toggle('js-smooth-scrollbar-enabled', enabled)
    document.documentElement.classList.toggle('js-smooth-scrollbar-disabled', !enabled)
    useCanvasStore.setState({ hasSmoothScrollbar: enabled })

    // make sure R3F loop is invalidated when scrolling
    const invalidateOnWheelEvent = () => invalidate()

    window.addEventListener('pointermove', onMouseMove)
    window.addEventListener('wheel', invalidateOnWheelEvent)
    return () => {
      removeEffect()
      window.removeEventListener('pointermove', onMouseMove)
      window.removeEventListener('wheel', invalidateOnWheelEvent)
    }
  }, [enabled])

  useEffect(() => {
    locked ? lenis.current?.stop() : lenis.current?.start()
  }, [locked])

  // Set up scroll containers - allows scrolling without resizing window on iOS/mobile
  const { wrapper, content } = useMemo(() => {
    if (typeof document === 'undefined') return {}
    const html = document.documentElement
    const wrapper = document.body
    const content = document.body.firstElementChild

    html.classList.toggle('ScrollRig-scrollHtml', scrollInContainer)
    wrapper.classList.toggle('ScrollRig-scrollWrapper', scrollInContainer)

    return {
      wrapper,
      content,
    }
  }, [scrollInContainer])

  return (
    <LenisScrollbar
      ref={lenis}
      smooth={enabled}
      direction={horizontal ? 'horizontal' : 'vertical'}
      config={
        scrollInContainer
          ? {
              smoothTouch: true,
              wrapper,
              content,
              ...config,
            }
          : { ...config }
      }
    >
      {/* Use function child so we can spread props
        - for instance disable pointer events while scrolling */}
      {(bind: any) => children({ ...bind, ref })}
    </LenisScrollbar>
  )
}
