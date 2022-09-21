import { useRef } from 'react'
import { useCanvasStore } from '../store'
import useHideElementWhileMounted from '../hooks/useHideElementWhileMounted'

/**
 * Purpose: Hide tracked DOM elements on mount if GlobalCanvas is in use
 *
 * Creates an HTMLElement ref and applies CSS styles and/or a classname while the the component is mounted
 */
function useCanvasRef({ style, className }: { style?: Partial<CSSStyleDeclaration>; className?: string } = {}) {
  const isCanvasAvailable = useCanvasStore((s) => s.isCanvasAvailable)
  const debug = useCanvasStore((s) => s.debug)
  const ref = useRef<HTMLElement>(null)

  // Apply hidden styles/classname to DOM element
  useHideElementWhileMounted(ref, [isCanvasAvailable], { debug, style, className })

  return ref
}

export { useCanvasRef }
export default useCanvasRef
