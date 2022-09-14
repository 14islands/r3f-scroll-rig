import { useLayoutEffect, RefObject } from 'react'

type HiddenProps = {
  debug?: boolean
  style?: Partial<CSSStyleDeclaration>
  className?: string
}

export function useHideElementWhileMounted(
  el: RefObject<HTMLElement>,
  deps: any[] = [],
  { debug, style = { opacity: '0' }, className }: HiddenProps
) {
  // Hide DOM element
  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!el?.current) return

    if (debug) {
      el.current.style.opacity = '0.5'
    } else {
      className && el.current.classList.add(className)
      Object.assign(el.current.style, {
        ...style,
      })
    }

    return () => {
      if (!el?.current) return
      // @ts-ignore
      Object.keys(style).forEach((key) => (el.current.style[key] = ''))
      className && el.current.classList.remove(className)
    }
  }, deps)
}

export default useHideElementWhileMounted
