import React, { useLayoutEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Canvas } from '@react-three/fiber'
import { ResizeObserver } from '@juggle/resize-observer'
import queryString from 'query-string'

import { useCanvasStore } from '../store'
import config from '../config'
import ResizeManager from '../utils/ResizeManager'
import PerspectiveCamera from '../cameras/PerspectiveCamera'
import OrthographicCamera from '../cameras/OrthographicCamera'

import GlobalRenderer from './GlobalRenderer'
import CanvasErrorBoundary from './CanvasErrorBoundary'

const GlobalCanvas = ({ as = Canvas, children, gl, style, orthographic, config: confOverrides, camera, ...props }) => {
  // override config
  useMemo(() => {
    Object.assign(config, confOverrides)

    // Querystring overrides
    const qs = queryString.parse(window.location.search)

    // show debug statements
    if (typeof qs.debug !== 'undefined') {
      config.debug = true
    }
  }, [confOverrides])

  const CanvasElement = as

  return (
    <CanvasElement
      className="ScrollRigCanvas"
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

      {!orthographic && <PerspectiveCamera makeDefault={true} {...camera} />}
      {orthographic && <OrthographicCamera makeDefault={true} {...camera} />}

      <ResizeManager />
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
