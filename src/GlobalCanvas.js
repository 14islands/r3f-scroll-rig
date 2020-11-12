import React, { useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Canvas } from 'react-three-fiber'
import { ResizeObserver } from '@juggle/resize-observer'
import queryString from 'query-string'
import { Stats } from '@react-three/drei'

import config from './config'
import { useCanvasStore } from './store'
import GlobalRenderer from './GlobalRenderer'
import PerformanceMonitor from './PerformanceMonitor'
import StatsDebug from './StatsDebug'
import ResizeManager from './ResizeManager'
import PerspectiveCamera from './PerspectiveCamera'
import OrthographicCamera from './OrthographicCamera'

import CanvasErrorBoundary from './CanvasErrorBoundary'

export const GlobalCanvas = ({
  children,
  gl,
  resizeOnHeight,
  orthographic,
  noEvents = true,
  config: confOverrides,
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

  return (
    <Canvas
      className="ScrollRigCanvas"
      invalidateFrameloop={true}
      gl={{
        antialias: false,
        alpha: true,
        depth: false, // turned off by default as optimization
        powerPreference: 'high-performance',
        // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
        failIfMajorPerformanceCaveat: true, // skip webgl if slow device
        ...gl,
      }}
      colorManagement={true} // ACESFilmic seems incorrect for non-HDR settings - images get weird colors?
      noEvents={noEvents}
      resize={{ scroll: false, debounce: 0, polyfill: ResizeObserver }}
      // concurrent // zustand (state mngr) is not compatible with concurrent mode yet
      pixelRatio={pixelRatio}
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
      updateDefaultCamera={false}
      // allow to override anything of the above
      {...props}
    >
      <GlobalRenderer>{children}</GlobalRenderer>
      {!orthographic && <PerspectiveCamera makeDefault={true} />}
      {orthographic && <OrthographicCamera makeDefault={true} />}
      {config.debug && <StatsDebug />}
      {config.fps && <Stats />}
      {config.autoPixelRatio && <PerformanceMonitor />}
      <ResizeManager reflow={requestReflow} resizeOnHeight={resizeOnHeight} />
    </Canvas>
  )
}

GlobalCanvas.propTypes = {
  gl: PropTypes.object,
  resizeOnHeight: PropTypes.bool,
  orthographic: PropTypes.bool,
  noEvents: PropTypes.bool,
  config: PropTypes.bool, // scrollrig config overrides
}

const GlobalCanvasIfSupported = ({ onError, ...props }) => {
  const portalEl = useRef()
  const setCanvasAvailable = useCanvasStore((state) => state.setCanvasAvailable)

  useLayoutEffect(() => {
    document.documentElement.classList.add('js-has-global-canvas')
  }, [])

  useLayoutEffect(() => {
    config.portalEl = portalEl.current
  }, [portalEl])

  return (
    <CanvasErrorBoundary
      onError={(err) => {
        onError && onError(err)
        setCanvasAvailable(false) /* WebGL failed to init */
        document.documentElement.classList.remove('js-has-global-canvas')
      }}
    >
      <GlobalCanvas {...props} />
      <div ref={portalEl}></div>
    </CanvasErrorBoundary>
  )
}

GlobalCanvasIfSupported.propTypes = {
  onError: PropTypes.func,
}

export default GlobalCanvasIfSupported
