import { useEffect, useRef, useCallback, useLayoutEffect, ReactElement } from 'react'
import { debounce } from 'debounce'
import { addEffect, invalidate } from '@react-three/fiber'

import useCanvasStore from '../store'

import LenisScrollbar, { ILenisScrollbar } from './LenisScrollbar'

interface ISmoothScrobbar {
  children: (props: any) => ReactElement
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

  useEffect(() => {
    // let r3f drive the frameloop
    const removeEffect = addEffect((time) => lenis.current?.raf(time))

    // update global scroll store
    lenis.current?.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
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

      invalidate()
    })

    // expose global scrollTo function
    // @ts-ignore
    useCanvasStore.setState({ scrollTo: lenis.current?.scrollTo })

    // Set active
    document.documentElement.classList.toggle('js-has-smooth-scrollbar', smooth)
    setVirtualScrollbar(smooth)

    // make sure R3F loop is invalidated when scrolling
    const invalidateOnWheelEvent = () => invalidate()

    window.addEventListener('pointermove', onMouseMove)
    window.addEventListener('wheel', invalidateOnWheelEvent)
    return () => {
      removeEffect()
      window.removeEventListener('pointermove', onMouseMove)
      window.removeEventListener('wheel', invalidateOnWheelEvent)
    }
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
      {(bind: any) => children({ ...bind, ref })}
    </LenisScrollbar>
  )
}
