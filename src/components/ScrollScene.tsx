import React, { useEffect, useState, useCallback, MutableRefObject, ReactNode } from 'react'
import { Scene } from 'three'
import { useFrame, createPortal } from '@react-three/fiber'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { config } from '../config'
import { useCanvasStore } from '../store'
import { useScrollRig } from '../hooks/useScrollRig'
import { DebugMesh } from './DebugMesh'
import { useTracker } from '../hooks/useTracker'
import type { ScrollState, Bounds } from '../hooks/useTrackerTypes'

export interface ScrollSceneChildProps {
  track: MutableRefObject<HTMLElement>
  margin: number
  priority: number
  scale: vec3 | undefined
  scrollState: ScrollState
  inViewport: boolean
  scene: Scene
}

interface IScrollScene {
  track: MutableRefObject<HTMLElement>
  children: (state: ScrollSceneChildProps) => ReactNode
  margin?: number
  inViewportMargin?: string
  inViewportThreshold?: number
  visible?: boolean
  hideOffscreen?: boolean
  scissor?: boolean
  debug?: boolean
  as?: string
  priority?: number
}

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned and scaled exactly above DOM element
 *
 * @author david@14islands.com
 */
function ScrollScene({
  track,
  children,
  margin = 0, // Margin outside scissor to avoid clipping vertex displacement (px)
  inViewportMargin,
  inViewportThreshold,
  visible = true,
  hideOffscreen = true,
  scissor = false,
  debug = false,
  as = 'scene',
  priority = config.PRIORITY_SCISSORS,
  ...props
}: IScrollScene) {
  const inlineSceneRef = useCallback((node: any) => {
    if (node !== null) {
      setScene(node)
    }
  }, [])

  const [scene, setScene] = useState<Scene | null>(scissor ? new Scene() : null)
  const { requestRender, renderScissor } = useScrollRig()
  const globalRender = useCanvasStore((state) => state.globalRender)

  const { bounds, scale, position, scrollState, inViewport } = useTracker(track, {
    rootMargin: inViewportMargin,
    threshold: inViewportThreshold,
  })

  // Hide scene when outside of viewport if `hideOffscreen` or set to `visible` prop
  useLayoutEffect(() => {
    if (scene) scene.visible = hideOffscreen ? inViewport && visible : visible
  }, [scene, inViewport, hideOffscreen, visible])

  // move scene into place on first position and on resize
  useEffect(() => {
    if (!scene) return
    scene.position.y = position.y
    scene.position.x = position.x
  }, [scale, scene]) // scale updates on resize

  // RENDER FRAME
  useFrame(
    ({ gl, camera }) => {
      if (!scene) return

      if (scene.visible) {
        // move scene
        scene.position.y = position.y
        scene.position.x = position.x

        if (scissor) {
          renderScissor({
            gl,
            scene,
            camera,
            left: bounds.left - margin,
            top: bounds.positiveYUpBottom - margin,
            width: bounds.width + margin * 2,
            height: bounds.height + margin * 2,
          })
        } else {
          requestRender()
        }
      }
    },
    globalRender ? priority : undefined
  )

  const content = (
    <>
      {(!children || debug) && scale && <DebugMesh scale={scale} />}
      {children &&
        scene &&
        scale &&
        children({
          // inherited props
          track,
          margin,
          scene,
          // new props from tracker
          scale,
          scrollState,
          inViewport,
          // useFrame render priority (in case children need to run after)
          priority: priority,
          // tunnel the rest
          ...props,
        })}
    </>
  )

  // portal if scissor or inline nested scene
  const InlineElement: any = as
  // @ts-ignore
  return scissor && scene ? createPortal(content, scene) : <InlineElement ref={inlineSceneRef}>{content}</InlineElement>
}

export { ScrollScene }
