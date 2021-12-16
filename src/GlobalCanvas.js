import React, { useEffect, useLayoutEffect, useMemo, Suspense } from 'react'
import PropTypes from 'prop-types'
import { Canvas } from '@react-three/fiber'
import { ResizeObserver } from '@juggle/resize-observer'
import queryString from 'query-string'

import config from './config'
import { Stats } from './Stats'
import { useCanvasStore } from './store'
import GlobalRenderer from './GlobalRenderer'
import PerformanceMonitor from './PerformanceMonitor'
import StatsDebug from './StatsDebug'
import ResizeManager from './ResizeManager'
import PerspectiveCamera from './PerspectiveCamera'
import OrthographicCamera from './OrthographicCamera'
import DefaultScrollTracker from './DefaultScrollTracker'
import CanvasErrorBoundary from './CanvasErrorBoundary'

const GlobalCanvas = ({
  as = Canvas,
  children,
  gl,
  style,
  orthographic,
  config: confOverrides,
  camera,
  fallback = null,
  ...props
}) => {
  const requestReflow = useCanvasStore((state) => state.requestReflow)

  // override config
  useMemo(() => {
    Object.assign(config, confOverrides)
  }, [confOverrides])

  // flag that global canvas is active
  useEffect(() => {
    config.hasGlobalCanvas = true
    return () => {
      config.hasGlobalCanvas = false
    }
  }, [])

  useEffect(() => {
    const qs = queryString.parse(window.location.search)

    // show FPS counter on request
    if (typeof qs.fps !== 'undefined') {
      config.fps = true
    }

    // show debug statements
    if (typeof qs.debug !== 'undefined') {
      config.debug = true
    }
  }, [])

  const CanvasElement = as

  return (
    <CanvasElement
      className="ScrollRigCanvas"

      // use our own default camera
      camera={null}

      // Some sane defaults
      gl={{
        antialias: true,
        alpha: true,
        depth: true,
        powerPreference: 'high-performance',
        // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
        failIfMajorPerformanceCaveat: true, // skip webgl if slow device
        ...gl,
      }}

      // polyfill old iOS safari
      resize={{ scroll: false, debounce: 0, polyfill: ResizeObserver }}

      // default pixelratio
      dpr={[1, 2]}

      // default styles
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '100vh', // use 100vh to avoid resize on iOS when url bar goes away
        transform: 'translateZ(0)',
        ...style
      }}

      // allow to override anything of the above
      {...props}
    >
      <Suspense fallback={fallback}>
        {children}
        <GlobalRenderer />
      </Suspense>
      {!orthographic && <PerspectiveCamera makeDefault={true} {...camera} />}
      {orthographic && <OrthographicCamera makeDefault={true} {...camera} />}
      {config.debug && <StatsDebug />}
      {config.fps && <Stats />}
      {config.autoPixelRatio && <PerformanceMonitor />}
      <ResizeManager reflow={requestReflow} />
      <DefaultScrollTracker />
    </CanvasElement>
  )
}

GlobalCanvas.propTypes = {
  gl: PropTypes.object,
  orthographic: PropTypes.bool,
  style: PropTypes.object,
  config: PropTypes.bool, // scrollrig config overrides
  as: PropTypes.any, // renders as @react-three/fiber Canvas by default
  camera: PropTypes.object,
  fallback: PropTypes.element,
}

const GlobalCanvasIfSupported = ({ onError, ...props }) => {
  const setCanvasAvailable = useCanvasStore((state) => state.setCanvasAvailable)

  useLayoutEffect(() => {
    document.documentElement.classList.add('js-has-global-canvas')
  }, [])

  return (
    <CanvasErrorBoundary
      onError={(err) => {
        onError && onError(err)
        setCanvasAvailable(false) /* WebGL failed to init */
        document.documentElement.classList.remove('js-has-global-canvas')
        document.documentElement.classList.add('js-global-canvas-error')
      }}
    >
      <GlobalCanvas {...props} />
    </CanvasErrorBoundary>
  )
}

GlobalCanvasIfSupported.propTypes = {
  onError: PropTypes.func,
}

export default GlobalCanvasIfSupported
