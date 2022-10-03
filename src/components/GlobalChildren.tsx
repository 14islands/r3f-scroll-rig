import { Fragment, useEffect, ReactNode, cloneElement } from 'react'
import { invalidate } from '@react-three/fiber'

import { useCanvasStore } from '../store'
import { useScrollRig } from '../hooks/useScrollRig'

/**
 * Renders global children from useCanvas hook
 */
const GlobalChildren = ({ children }: { children?: ReactNode }) => {
  const canvasChildren = useCanvasStore((state) => state.canvasChildren)
  const scrollRig = useScrollRig()

  useEffect(() => {
    // render empty canvas automatically if all children were removed
    if (!Object.keys(canvasChildren).length) {
      scrollRig.debug && console.log('GlobalRenderer', 'auto render empty canvas')
      scrollRig.requestRender()
      invalidate()
    }
  }, [canvasChildren])

  scrollRig.debug && console.log('GlobalChildren', Object.keys(canvasChildren).length)
  return (
    <>
      {children}
      {Object.keys(canvasChildren).map((key) => {
        const { mesh, props } = canvasChildren[key]

        if (typeof mesh === 'function') {
          return <Fragment key={key}>{mesh({ key, ...scrollRig, ...props })}</Fragment>
        }

        return cloneElement(mesh, {
          key,
          ...props,
        })
      })}
    </>
  )
}

export default GlobalChildren
