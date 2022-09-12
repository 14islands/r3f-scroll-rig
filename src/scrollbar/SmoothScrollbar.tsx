import { useEffect, useRef, useCallback, useLayoutEffect, Children } from 'react'
import * as React from 'react'
import debounce from 'debounce'

import useCanvasStore from '../store'

import LenisScrollbar, { ILenisScrollbar } from './LenisScrollbar'

interface ISmoothScrobbar {
  children: (props: any) => typeof Children
  scrollRestoration: ScrollRestoration
  smooth: boolean
  paused: boolean
  disablePointerOnScroll: boolean
}

export const SmoothScrollbar = ({
  children,
  smooth = true,
  paused = false,
  scrollRestoration = 'auto',
  disablePointerOnScroll = true,
}: ISmoothScrobbar) => {
  const ref = useRef<HTMLElement>()
  const lenis = useRef<ILenisScrollbar>()
  const preventPointer = useRef(false)
  const setVirtualScrollbar = useCanvasStore((state) => state.setVirtualScrollbar)
  const scrollState = useCanvasStore((state) => state.scroll)

  // disable pointer events while scrolling to avoid slow event handlers
  const preventPointerEvents = (prevent) => {
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

  useEffect(() => {
    // update global scroll store
    lenis.current?.onScroll(({ scroll, limit, velocity, direction, progress }) => {
      scrollState.y = direction === 'vertical' ? scroll : 0
      scrollState.x = direction === 'horizontal' ? scroll : 0
      scrollState.limit = limit
      scrollState.velocity = velocity
      scrollState.direction = direction
      scrollState.progress = progress

      // disable pointer logic
      const disablePointer = debounce(() => preventPointerEvents(true), 100, true)
      if (Math.abs(velocity) > 1.4) {
        disablePointer()
      } else {
        preventPointerEvents(false)
      }
    })

    // expose scrollTo function
    useCanvasStore.setState({ scrollTo: lenis.current?.scrollTo })

    window.addEventListener('pointermove', onMouseMove)
    return () => {
      window.removeEventListener('pointermove', onMouseMove)
    }
  }, [smooth])

  useEffect(() => {
    document.documentElement.classList.toggle('js-has-smooth-scrollbar', smooth)
    setVirtualScrollbar(smooth)
  }, [smooth])

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = scrollRestoration
    }
  }, [])

  useEffect(() => {
    paused ? lenis.current?.stop() : lenis.current?.start()
  }, [paused])

  return (
    <LenisScrollbar ref={lenis} smooth={smooth}>
      {/* Use functio child so we can spread props
        - for instance disable pointer events while scrolling */}
      {(bind) => children({ ...bind, ref })}
    </LenisScrollbar>
  )
}
