import React, { useEffect, useLayoutEffect, useMemo, Suspense } from 'react'
import PropTypes from 'prop-types'
import { Canvas } from '@react-three/fiber'
import { NoToneMapping } from 'three'
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
  resizeOnHeight,
  orthographic,
  noEvents = true,
  config: confOverrides,
  camera,
  fallback = null,
  ...props
}) => {
  const pixelRatio = useCanvasStore((state) => state.pixelRatio)
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
      frameloop="demand"
      gl={{
        antialias: true,
        alpha: true,
        depth: true,
        powerPreference: 'high-performance',
        // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
        failIfMajorPerformanceCaveat: true, // skip webgl if slow device
        ...gl,
      }}
      linear={false} // use sRGB
      raycaster={{ enabled: !noEvents }}
      resize={{ scroll: false, debounce: 0, polyfill: ResizeObserver }}
      mode="blocking" // concurrent // zustand (state mngr) is not compatible with concurrent mode yet
      dpr={pixelRatio}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '100vh', // use 100vh to avoid resize on iOS when url bar goes away
        zIndex: 1, // to sit on top of the page-transition-links styles
        pointerEvents: noEvents ? 'none' : 'auto',
        transform: 'translateZ(0)',
      }}
      // use our own default camera
      camera={null}
      onCreated={({ gl }) => {
        // ACESFilmic seems incorrect for non-HDR settings - images get weird color and hex won't match DOM
        gl.toneMapping = NoToneMapping // turn off tonemapping by default to provide better hex matching
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
      <ResizeManager reflow={requestReflow} resizeOnHeight={resizeOnHeight} />
      <DefaultScrollTracker />
    </CanvasElement>
  )
}

GlobalCanvas.propTypes = {
  gl: PropTypes.object,
  resizeOnHeight: PropTypes.bool,
  orthographic: PropTypes.bool,
  noEvents: PropTypes.bool,
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
