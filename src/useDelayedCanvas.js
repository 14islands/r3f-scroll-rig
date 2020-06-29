import { useLayoutEffect, useMemo } from 'react'
import { uuid } from 'uuidv4'

import useDelayedEffect from 'lib/useDelayedEffect'
import requestIdleCallback from 'lib/requestIdleCallback'
import useCanvasStore from 'components/three/scroll-rig/store'

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted after initial delay (ms)
 * @param {object} object THREE.js object3d
 */
export const useDelayedCanvas = (object, ms, deps = [], key) => {
  const updateCanvas = useCanvasStore((state) => state.updateCanvas)
  const renderToCanvas = useCanvasStore((state) => state.renderToCanvas)
  const removeFromCanvas = useCanvasStore((state) => state.removeFromCanvas)

  // auto generate uuid v4 key
  const uniqueKey = useMemo(() => key || uuid(), [])

  // remove on unmount
  useLayoutEffect(() => {
    return () => removeFromCanvas(uniqueKey)
  }, [])

  useDelayedEffect(
    () => {
      renderToCanvas(uniqueKey, object)
    },
    deps,
    ms,
  )

  // return function that can set new props on the canvas component
  const set = (props) => {
    requestIdleCallback(() => updateCanvas(uniqueKey, props), { timeout: 100 })
  }

  return set
}

export default useDelayedCanvas
