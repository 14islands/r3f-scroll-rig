import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import Lenis from '@studio-freight/lenis'
import { addEffect } from '@react-three/fiber'

type LenisScrollCallback = ({ scroll, limit, velocity, direction, progress }) => void
type LenisScrollTo = (target: number | HTMLElement | string, { offset, immediate, duration, easing }) => void

interface ILenisImpl {
  stop: () => void
  start: () => void
  on: (event: string, cb: LenisScrollCallback) => void
  scrollTo: LenisScrollTo
}

export interface ILenisScrollbar {
  stop: () => void
  start: () => void
  onScroll: (cb: LenisScrollCallback) => void
  scrollTo: LenisScrollTo
}

const EASE_EXP_OUT = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) // https://easings.net/

export function LenisScrollbar(
  { children, duration = 1, easing = EASE_EXP_OUT, smooth = true, direction = 'vertical', config, ...props },
  ref: any
) {
  const lenisImpl = useRef<ILenisImpl>()

  useImperativeHandle(ref, () => ({
    start: () => lenisImpl.current?.start(),
    stop: () => lenisImpl.current?.stop(),
    onScroll: (cb: LenisScrollCallback) => lenisImpl.current?.on('scroll', cb),
    scrollTo: (target, props) => lenisImpl.current?.scrollTo(target, props),
  }))

  useEffect(() => {
    const lenis = (lenisImpl.current = new Lenis({
      duration,
      easing,
      smooth,
      direction,
      ...config,
    }))

    // let r3f drive the frameloop
    const removeEffect = addEffect((time) => lenis.raf(time))

    // cleanup on unmount
    return () => {
      removeEffect()
      lenis.destroy()
    }
  }, [smooth])

  return children && children(props)
}

export default forwardRef(LenisScrollbar)
