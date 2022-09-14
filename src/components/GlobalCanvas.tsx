import { useLayoutEffect } from 'react'
import { Canvas, Props } from '@react-three/fiber'
import { ResizeObserver } from '@juggle/resize-observer'
import { parse } from 'query-string'
import { useCanvasStore } from '../store'
import ResizeManager from './ResizeManager'
import PerspectiveCamera from './PerspectiveCamera'
import OrthographicCamera from './OrthographicCamera'

import GlobalRenderer from './GlobalRenderer'
import CanvasErrorBoundary from './CanvasErrorBoundary'

import config from '../config'

interface IGlobalCanvas extends Props {
  as?: any
  orthographic?: boolean
  onError?: (props: any) => void
  camera?: any
  // state
  debug?: boolean
  scaleMultiplier?: number
  globalRender?: boolean
  globalPriority?: number
  globalAutoClear?: boolean
  globalClearDepth?: boolean
}

const GlobalCanvas = ({
  as = Canvas,
  children,
  gl,
  style,
  orthographic,
  camera,
  debug,
  scaleMultiplier = config.DEFAULT_SCALE_MULTIPLIER,
  globalRender = true,
  globalPriority = config.PRIORITY_GLOBAL,
  globalAutoClear = false, // don't clear viewports
  globalClearDepth = true,
  ...props
}: Omit<IGlobalCanvas, 'onError'>) => {
  // enable debug mode
  useLayoutEffect(() => {
    // Querystring overrides
    const qs = parse(window.location.search)

    // show debug statements
    if (debug || typeof qs.debug !== 'undefined') {
      useCanvasStore.setState({ debug: true })
    }
  }, [debug])

  // update state
  useLayoutEffect(() => {
    useCanvasStore.setState({
      scaleMultiplier,
      globalRender,
      globalPriority,
      globalAutoClear,
      globalClearDepth,
    })
  }, [scaleMultiplier, globalPriority, globalRender, globalAutoClear, globalClearDepth])

  const CanvasElement = as

  return (
    <CanvasElement
      // use our own default camera
      camera={null}
      // Some sane defaults
      gl={{
        // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
        failIfMajorPerformanceCaveat: true, // skip webgl if slow device
        ...gl,
      }}
      // polyfill old iOS safari
      resize={{ scroll: false, debounce: 0, polyfill: ResizeObserver }}
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
      {children}
      <GlobalRenderer />

      {/* @ts-ignore */}
      {!orthographic && <PerspectiveCamera makeDefault={true} {...camera} />}
      {/* @ts-ignore */}
      {orthographic && <OrthographicCamera makeDefault={true} {...camera} />}

      <ResizeManager />
    </CanvasElement>
  )
}

const GlobalCanvasIfSupported = ({ children, onError, ...props }: IGlobalCanvas) => {
  const setCanvasAvailable = useCanvasStore((state) => state.setCanvasAvailable)

  useLayoutEffect(() => {
    document.documentElement.classList.add('js-has-global-canvas')
  }, [])

  return (
    // @ts-ignore
    <CanvasErrorBoundary
      onError={(err) => {
        onError && onError(err)
        setCanvasAvailable(false) /* WebGL failed to init */
        document.documentElement.classList.remove('js-has-global-canvas')
        document.documentElement.classList.add('js-global-canvas-error')
      }}
    >
      <GlobalCanvas {...props}>{children}</GlobalCanvas>
    </CanvasErrorBoundary>
  )
}

export default GlobalCanvasIfSupported
