import React, { memo, useEffect, useState, useCallback, MutableRefObject, ReactNode } from 'react'
import { Scene } from 'three'
import { useFrame, createPortal, useThree } from '@react-three/fiber'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { config } from '../config'
import { useScrollRig } from '../hooks/useScrollRig'
import { DebugMesh } from './DebugMesh'
import { useTracker } from '../hooks/useTracker'
import type { Tracker } from '../hooks/useTracker.d'
import { PerspectiveCamera } from './PerspectiveCamera'
import { OrthographicCamera } from './OrthographicCamera'

import type { ScrollSceneChildProps } from './ScrollScene'

interface ViewportScrollScene {
  track: MutableRefObject<HTMLElement>
  children: (state: ScrollSceneChildProps) => ReactNode
  margin?: number
  inViewportMargin?: string
  inViewportThreshold?: number
  visible?: boolean
  hideOffscreen?: boolean
  debug?: boolean
  orthographic?: boolean
  priority?: number
  hud?: boolean // clear depth to render on top
  camera?: any
}

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is rendered into a GL viewport matching the DOM position for better performance
 *
 * Adapted to @react-three/fiber from https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
 * @author david@14islands.com
 */
const Viewport = ({
  track,
  children,
  margin = 0, // Margin outside viewport to avoid clipping vertex displacement (px)
  visible = true,
  hideOffscreen = true,
  debug = false,
  orthographic = false,
  priority = config.PRIORITY_VIEWPORTS,
  inViewport,
  bounds,
  scale,
  scrollState,
  camera,
  hud,
  ...props
}: ViewportScrollScene & Tracker) => {
  const scene = useThree((s) => s.scene)
  const get = useThree((state) => state.get)
  const setEvents = useThree((state) => state.setEvents)

  const { renderViewport } = useScrollRig()

  // Hide scene when outside of viewport if `hideOffscreen` or set to `visible` prop
  useLayoutEffect(() => {
    scene.visible = hideOffscreen ? inViewport && visible : visible
  }, [inViewport, hideOffscreen, visible])

  // From: https://github.com/pmndrs/drei/blob/d22fe0f58fd596c7bfb60a7a543cf6c80da87624/src/web/View.tsx#L80
  useEffect(() => {
    // Connect the event layer to the tracking element
    const old = get().events.connected
    setEvents({ connected: track.current })
    return () => setEvents({ connected: old })
  }, [])

  // RENDER FRAME
  useFrame(({ gl, scene, camera }) => {
    // Render scene to viewport using local camera and limit updates using scissor test
    if (scene.visible) {
      renderViewport({
        gl,
        scene,
        camera,
        left: bounds.left - margin,
        top: bounds.positiveYUpBottom - margin,
        width: bounds.width + margin * 2,
        height: bounds.height + margin * 2,
        clearDepth: !!hud,
      })
    }
  }, priority)

  return (
    <>
      {!orthographic && <PerspectiveCamera manual margin={margin} makeDefault {...camera} />}
      {orthographic && <OrthographicCamera manual margin={margin} makeDefault {...camera} />}
      {(!children || debug) && scale && <DebugMesh scale={scale} />}
      {children &&
        // scene &&
        scale &&
        children({
          // inherited props
          track,
          margin,
          // new props
          scale,
          scrollState,
          inViewport,
          // useFrame render priority (in case children need to run after)
          priority,
          // tunnel the rest
          ...props,
        })}
    </>
  )
}

function ViewportScrollSceneImpl({
  track,
  margin = 0, // Margin outside viewport to avoid clipping vertex displacement (px)
  inViewportMargin,
  inViewportThreshold,
  priority,
  ...props
}: ViewportScrollScene) {
  const [scene] = useState(() => new Scene())

  const { bounds, ...trackerProps } = useTracker(track, {
    rootMargin: inViewportMargin,
    threshold: inViewportThreshold,
  })

  // From: https://github.com/pmndrs/drei/blob/d22fe0f58fd596c7bfb60a7a543cf6c80da87624/src/web/View.tsx#L80
  const compute = useCallback(
    (event: any, state: any) => {
      // limit events to DOM element bounds
      if (track.current && event.target === track.current) {
        const { width, height, left, top } = bounds
        const mWidth = width + margin * 2
        const mHeight = height + margin * 2
        const x = event.clientX - left + margin
        const y = event.clientY - top + margin
        state.pointer.set((x / mWidth) * 2 - 1, -(y / mHeight) * 2 + 1)
        state.raycaster.setFromCamera(state.pointer, state.camera)
      }
    },
    [bounds]
  )

  return (
    bounds &&
    createPortal(
      <Viewport track={track} bounds={bounds} priority={priority} margin={margin} {...props} {...trackerProps} />,
      scene,
      // @ts-ignore
      { events: { compute, priority }, size: { width: bounds.width, height: bounds.height } }
    )
  )
}

const ViewportScrollScene = memo(ViewportScrollSceneImpl)

export { ViewportScrollScene }
