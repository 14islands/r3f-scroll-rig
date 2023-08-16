import React, { ReactNode, startTransition } from 'react'
import { Canvas, Props } from '@react-three/fiber'
import { ResizeObserver as Polyfill } from '@juggle/resize-observer'
import { parse } from 'query-string'

import { useLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { useCanvasStore } from '../store'
import { ResizeManager } from './ResizeManager'
import { PerspectiveCamera } from './PerspectiveCamera'
import { OrthographicCamera } from './OrthographicCamera'

import { GlobalChildren } from './GlobalChildren'
import { GlobalRenderer } from './GlobalRenderer'
import { CanvasErrorBoundary } from './CanvasErrorBoundary'

import { config } from '../config'
import { version } from '../../package.json'

let polyfill: new (callback: ResizeObserverCallback) => ResizeObserver
if (typeof window !== 'undefined') {
  polyfill = window.ResizeObserver || Polyfill
}

interface IGlobalCanvas extends Omit<Props, 'children'> {
  children?: ReactNode | ((globalChildren: ReactNode) => ReactNode)
  as?: any
  orthographic?: boolean
  onError?: (props: any) => void
  camera?: any
  // state
  debug?: boolean
  scaleMultiplier?: number
  globalRender?: boolean
  globalPriority?: number
  globalClearDepth?: boolean
}

const GlobalCanvasImpl = ({
  children,
  as = Canvas,
  gl,
  style,
  orthographic,
  camera,
  debug,
  scaleMultiplier = config.DEFAULT_SCALE_MULTIPLIER,
  globalRender = true,
  globalPriority = config.PRIORITY_GLOBAL,
  globalClearDepth = false,
  ...props
}: Omit<IGlobalCanvas, 'onError'>) => {
  const useGlobalRenderer = useCanvasStore((state) => state.globalRender)

  // enable debug mode
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.__r3f_scroll_rig = version
    }

    // Querystring overridess
    const qs = parse(window.location.search)

    // show debug statements
    if (debug || typeof qs.debug !== 'undefined') {
      useCanvasStore.setState({ debug: true })
      console.info('@14islands/r3f-scroll-rig@' + version)
    }
  }, [debug])

  // update state
  useLayoutEffect(() => {
    // update as transition so we don't interrupt active suspenses
    startTransition(() => {
      useCanvasStore.setState({
        scaleMultiplier,
        globalRender,
        globalPriority,
        globalClearDepth,
      })
    })
  }, [scaleMultiplier, globalPriority, globalRender, globalClearDepth])

  const As = as

  return (
    <As
      id="ScrollRig-canvas"
      // use our own default camera
      camera={{
        manual: true,
      }}
      // Some sane defaults
      gl={{
        // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
        failIfMajorPerformanceCaveat: true, // skip webgl if slow device
        ...gl,
      }}
      // polyfill old iOS safari
      resize={{ scroll: false, debounce: 0, polyfill }}
      // default styles
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '100vh', // use 100vh to avoid resize on iOS when url bar goes away
        ...style,
      }}
      // allow to override anything of the above
      {...props}
    >
      {/* @ts-ignore */}
      {!orthographic && <PerspectiveCamera manual makeDefault {...camera} />}
      {/* @ts-ignore */}
      {orthographic && <OrthographicCamera manual makeDefault {...camera} />}

      {useGlobalRenderer && <GlobalRenderer />}

      {typeof children === 'function' ? children(<GlobalChildren />) : <GlobalChildren>{children}</GlobalChildren>}

      <ResizeManager />
    </As>
  )
}

export const GlobalCanvas = ({ children, onError, ...props }: IGlobalCanvas) => {
  useLayoutEffect(() => {
    document.documentElement.classList.add('js-has-global-canvas')
  }, [])

  return (
    // @ts-ignore
    <CanvasErrorBoundary
      onError={(err: any) => {
        onError && onError(err)
        useCanvasStore.setState({ isCanvasAvailable: false }) /* WebGL failed to init */
        document.documentElement.classList.remove('js-has-global-canvas')
        document.documentElement.classList.add('js-global-canvas-error')
      }}
    >
      <GlobalCanvasImpl {...props}>{children}</GlobalCanvasImpl>
      <noscript>
        <style>
          {`
          .ScrollRig-visibilityHidden,
          .ScrollRig-transparentColor {
            visibility: unset;
            color: unset;
          }
          `}
        </style>
      </noscript>
    </CanvasErrorBoundary>
  )
}
