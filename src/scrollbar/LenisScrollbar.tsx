import { useRef, useEffect, forwardRef, useImperativeHandle, ReactElement } from 'react'

// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import Lenis from '@studio-freight/lenis'

type LenisScrollCallback = (props: {
  scroll: number
  limit: number
  velocity: number
  direction: string
  progress: number
}) => void

type LenisScrollToTarget = number | HTMLElement | string
type LenisScrollToConfig = { offset: number; immediate: boolean; duration: number; easing: (t: number) => number }
type LenisScrollTo = (target: LenisScrollToTarget, props: LenisScrollToConfig) => void

type LenisScrollbarProps = {
  children: (props: any) => ReactElement
  duration?: number
  easing?: (t: number) => number
  smooth?: boolean
  direction?: string
  config?: any
}

export interface ILenisScrollbar {
  stop: () => void
  start: () => void
  on: (event: string, cb: LenisScrollCallback) => void
  scrollTo: LenisScrollTo
  raf: (time: number) => void
}

const EASE_EXP_OUT = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) // https://easings.net/

export function LenisScrollbar(
  {
    children,
    duration = 1,
    easing = EASE_EXP_OUT,
    smooth = true,
    direction = 'vertical',
    config,
    ...props
  }: LenisScrollbarProps,
  ref: any
) {
  const lenisImpl = useRef<ILenisScrollbar>()

  // Expose lenis imperative API
  useImperativeHandle(ref, () => ({
    start: () => lenisImpl.current?.start(),
    stop: () => lenisImpl.current?.stop(),
    on: (event: string, cb: LenisScrollCallback) => lenisImpl.current?.on(event, cb),
    scrollTo: (target: LenisScrollToTarget, props: LenisScrollToConfig) => lenisImpl.current?.scrollTo(target, props),
    raf: (time: number) => lenisImpl.current?.raf(time),
  }))

  useEffect(
    function initLenis() {
      const lenis = (lenisImpl.current = new Lenis({
        duration,
        easing,
        smooth,
        direction,
        ...config,
      }))

      // cleanup on unmount
      return () => {
        lenis.destroy()
      }
    },
    [duration, easing, smooth, direction, config]
  )

  // Support a render function as child
  return children && children(props)
}

export default forwardRef(LenisScrollbar)
