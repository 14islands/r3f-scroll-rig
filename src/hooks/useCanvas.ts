import { useEffect, useLayoutEffect, useMemo, useCallback, ReactNode } from 'react'
import { MathUtils } from 'three'
import { useCanvasStore } from '../store'

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted
 * @param {object} object THREE.js object3d
 */
function useCanvas(
  object: ReactNode,
  deps: any = {},
  { key, dispose = true }: { key?: string; dispose?: boolean } = {}
) {
  const updateCanvas = useCanvasStore((state) => state.updateCanvas)
  const renderToCanvas = useCanvasStore((state) => state.renderToCanvas)
  const removeFromCanvas = useCanvasStore((state) => state.removeFromCanvas)

  // auto generate uuid v4 key
  const uniqueKey = useMemo(() => key || MathUtils.generateUUID(), [])

  // render to canvas if not mounted already
  useLayoutEffect(() => {
    renderToCanvas(uniqueKey, object, { inactive: false })
  }, [uniqueKey])

  // remove from canvas if no usage (after render so new users have time to register)
  useEffect(() => {
    return () => {
      removeFromCanvas(uniqueKey, dispose)
    }
  }, [uniqueKey])

  // return function that can set new props on the canvas component
  const set = useCallback(
    (props: any) => {
      updateCanvas(uniqueKey, props)
    },
    [updateCanvas, uniqueKey]
  )

  // auto update props when deps change
  useEffect(() => {
    set(deps)
  }, [...Object.values(deps)])

  return set
}

export { useCanvas }
export default useCanvas
