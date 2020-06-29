import React, { useEffect, useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Canvas } from 'react-three-fiber'
import { ResizeObserver } from '@juggle/resize-observer'
import queryString from 'query-string'

import { config, useCanvasStore } from 'components/three/scroll-rig'
import GlobalRenderer from './GlobalRenderer'
import PerformanceMonitor from './PerformanceMonitor'
import StatsDebug from './StatsDebug'
import ResizeManager from './ResizeManager'

import CanvasErrorBoundary from './CanvasErrorBoundary'

const GlobalCanvas = ({ children, gl, ...props }) => {
  const pixelRatio = useCanvasStore((state) => state.pixelRatio)

  useEffect(() => {
    const qs = queryString.parse(window.location.search)

    // show FPS counter?
    if (typeof qs.fps !== 'undefined') {
      const script = document.createElement('script')
      script.onload = function () {
        // eslint-disable-next-line no-undef
        const stats = new Stats()
        document.body.appendChild(stats.dom)
        window.requestAnimationFrame(function loop() {
          stats.update()
          window.requestAnimationFrame(loop)
        })
      }
      script.src = '//mrdoob.github.io/stats.js/build/stats.min.js'
      document.head.appendChild(script)
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
        stencil: false,
        depth: false,
        powerPreference: 'high-performance',
        // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
        failIfMajorPerformanceCaveat: true, // skip webgl if slow device
        preserveDrawingBuffer: false,
        premultipliedAlpha: true, // if false, shader antialias becomes a grey-isch outline
        ...gl,
      }}
      colorManagement={true}
      noEvents={true}
      resize={{ scroll: false, debounce: 0, polyfill: ResizeObserver }}
      // concurrent // zustand (state mngr) is not compatible with concurrent mode yet
      orthographic
      gl2={false}
      pixelRatio={pixelRatio}
      camera={{
        near: 0.1,
        far: config.cameraDistance * 1.5,
        position: [0, 0, config.cameraDistance],
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '100vh', // use 100vh to avoid resize on iOS when url bar goes away
        zIndex: 1, // to sit on top of the page-transition-links styles
        pointerEvents: 'none',
        transform: 'translateZ(0)',
      }}
      {...props}
    >
      <GlobalRenderer>{children}</GlobalRenderer>
      {config.debug && <StatsDebug />}
      <PerformanceMonitor />
      <ResizeManager />
    </Canvas>
  )
}

GlobalCanvas.propTypes = {
  gl: PropTypes.object,
}

const GlobalCanvasIfSupported = ({ onError, ...props }) => {
  const portalEl = useRef()
  const setCanvasAvailable = useCanvasStore((state) => state.setCanvasAvailable)

  useLayoutEffect(() => {
    document.documentElement.classList.add('js-has-global-canvas')
  }, [])

  useEffect(() => {
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
