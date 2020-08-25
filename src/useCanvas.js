import { useLayoutEffect, useMemo } from 'react'
import { uuid } from 'uuidv4'

import requestIdleCallback from './hooks/requestIdleCallback'
import { useCanvasStore } from './store'

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted
 * @param {object} object THREE.js object3d
 */
const useCanvas = (object, deps = [], key) => {
  const updateCanvas = useCanvasStore((state) => state.updateCanvas)
  const renderToCanvas = useCanvasStore((state) => state.renderToCanvas)
  const removeFromCanvas = useCanvasStore((state) => state.removeFromCanvas)

  // auto generate uuid v4 key
  const uniqueKey = useMemo(() => key || uuid(), [])

  useLayoutEffect(() => {
    renderToCanvas(uniqueKey, object)
    return () => removeFromCanvas(uniqueKey)
  }, deps)

  // return function that can set new props on the canvas component
  const set = (props) => {
    requestIdleCallback(() => updateCanvas(uniqueKey, props), { timeout: 100 })
  }

  return set
}

export default useCanvas
