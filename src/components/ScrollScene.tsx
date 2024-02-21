import React, { useEffect, useState, useRef, MutableRefObject, ReactNode } from 'react'
import { Scene, Group } from 'three'
import { useFrame, createPortal, useThree } from '@react-three/fiber'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { config } from '../config'
import { useCanvasStore } from '../store'
import { useScrollRig } from '../hooks/useScrollRig'
import { DebugMesh } from './DebugMesh'
import { useTracker } from '../hooks/useTracker'
import type { ScrollState } from '../hooks/useTrackerTypes'

export interface ScrollSceneChildProps {
  track: MutableRefObject<HTMLElement>
  margin: number
  priority: number
  scale: vec3
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
  scene?: Scene
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
  scene,
  ...props
}: IScrollScene) {
  const globalScene = useThree((s) => s.scene)
  const contentRef = useRef<Group>()
  const [portalScene] = useState<Scene | null>(scene || (scissor ? new Scene() : null))
  const { requestRender, renderScissor } = useScrollRig()
  const globalRender = useCanvasStore((state) => state.globalRender)

  const { bounds, scale, position, scrollState, inViewport } = useTracker(track, {
    rootMargin: inViewportMargin,
    threshold: inViewportThreshold,
  })

  // Hide content when outside of viewport if `hideOffscreen` or set to `visible` prop
  useLayoutEffect(() => {
    if (!contentRef.current) return
    contentRef.current.visible = hideOffscreen ? inViewport && visible : visible
  }, [inViewport, hideOffscreen, visible])

  // move content into place visibility or scale changes
  useEffect(() => {
    if (!contentRef.current) return
    contentRef.current.position.y = position.y
    contentRef.current.position.x = position.x
  }, [scale, inViewport]) // scale updates on resize

  // RENDER FRAME
  useFrame(
    ({ gl, camera }) => {
      if (!contentRef.current) return

      if (contentRef.current.visible) {
        // move content
        contentRef.current.position.y = position.y
        contentRef.current.position.x = position.x

        if (scissor) {
          renderScissor({
            gl,
            portalScene,
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

  const InlineElement: any = as
  const content = (
    <InlineElement ref={contentRef}>
      {(!children || debug) && scale && <DebugMesh scale={scale} />}
      {children &&
        scale &&
        children({
          // inherited props
          track,
          margin,
          scene: portalScene || globalScene,
          // new props from tracker
          scale,
          scrollState,
          inViewport,
          // useFrame render priority (in case children need to run after)
          priority: priority,
          // tunnel the rest
          ...props,
        })}
    </InlineElement>
  )

  // render in portal if requested
  return portalScene ? createPortal(content, portalScene) : content
}

export { ScrollScene }
