import _extends from '@babel/runtime/helpers/esm/extends';
import * as React from 'react';
import React__default, { useEffect, forwardRef, useMemo, useRef, useLayoutEffect, Fragment, useState, useCallback, startTransition, useImperativeHandle } from 'react';
import { useThree, invalidate, useFrame, Canvas, extend, createPortal, addEffect } from '@react-three/fiber';
import { ResizeObserver } from '@juggle/resize-observer';
import queryString from 'query-string';
import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import mergeRefs from 'react-merge-refs';
import { Vector2, Color, MathUtils, Scene, ImageBitmapLoader, TextureLoader, CanvasTexture, sRGBEncoding, LinearFilter, RGBFormat, RGBAFormat } from 'three';
import '@14islands/lerp';
import { shaderMaterial } from '@react-three/drei/core/shaderMaterial.js';
import debounce from 'debounce';
import Lenis from '@studio-freight/lenis';

// Transient shared state for canvas components
// usContext() causes re-rendering which can drop frames
const config = {
  debug: false,
  fps: false,
  autoPixelRatio: true,
  // use PerformanceMonitor
  // Global lerp settings
  scrollLerp: 0.14,
  // Linear interpolation - high performance easing
  scrollRestDelta: 0.014,
  // min delta to trigger animation frame on scroll
  subpixelScrolling: true,
  // Execution order for useFrames (highest = last render)
  PRIORITY_PRELOAD: 0,
  PRIORITY_SCISSORS: 1,
  PRIORITY_VIEWPORTS: 1,
  PRIORITY_GLOBAL: 1000,
  // Scaling
  scaleMultiplier: 1,
  // scale pixels vs viewport units (1:1 by default)
  // Global rendering props
  globalRender: true,
  preloadQueue: [],
  hasGlobalCanvas: false,
  disableAutoClear: true,
  clearDepth: true
};

const useCanvasStore = create(subscribeWithSelector(set => ({
  // //////////////////////////////////////////////////////////////////////////
  // GLOBAL ScrollRig STATE
  // //////////////////////////////////////////////////////////////////////////
  globalRenderQueue: false,
  clearGlobalRenderQueue: () => set(() => ({
    globalRenderQueue: false
  })),
  // true if WebGL initialized without errors
  isCanvasAvailable: true,
  setCanvasAvailable: isCanvasAvailable => set(() => ({
    isCanvasAvailable
  })),
  // true if <VirtualScrollbar> is currently enabled
  hasVirtualScrollbar: false,
  setVirtualScrollbar: hasVirtualScrollbar => set(() => ({
    hasVirtualScrollbar
  })),
  // map of all components to render on the global canvas
  canvasChildren: {},
  // add component to canvas
  renderToCanvas: function (key, mesh) {
    let props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return set(_ref => {
      let {
        canvasChildren
      } = _ref;

      // check if already mounted
      if (Object.getOwnPropertyDescriptor(canvasChildren, key)) {
        // increase usage count
        canvasChildren[key].instances += 1;
        canvasChildren[key].props.inactive = false;
        return {
          canvasChildren
        };
      } else {
        // otherwise mount it
        const obj = { ...canvasChildren,
          [key]: {
            mesh,
            props,
            instances: 1
          }
        };
        return {
          canvasChildren: obj
        };
      }
    });
  },
  // pass new props to a canvas component
  updateCanvas: (key, newProps) => set(_ref2 => {
    let {
      canvasChildren
    } = _ref2;
    if (!canvasChildren[key]) return;
    const {
      [key]: {
        mesh,
        props,
        instances
      }
    } = canvasChildren;
    const obj = { ...canvasChildren,
      [key]: {
        mesh,
        props: { ...props,
          ...newProps
        },
        instances
      }
    }; // console.log('updateCanvas', key, { ...props, ...newProps })

    return {
      canvasChildren: obj
    };
  }),
  // remove component from canvas
  removeFromCanvas: function (key) {
    let dispose = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    return set(_ref3 => {
      var _canvasChildren$key;

      let {
        canvasChildren
      } = _ref3;

      // check if remove or reduce instances
      if (((_canvasChildren$key = canvasChildren[key]) === null || _canvasChildren$key === void 0 ? void 0 : _canvasChildren$key.instances) > 1) {
        // reduce usage count
        canvasChildren[key].instances -= 1;
        return {
          canvasChildren
        };
      } else {
        if (dispose) {
          // unmount since no longer used
          const {
            [key]: _omit,
            ...obj
          } = canvasChildren; // make a separate copy of the obj and omit

          return {
            canvasChildren: obj
          };
        } else {
          // or tell it to "act" hidden
          canvasChildren[key].instances = 0;
          canvasChildren[key].props.inactive = true;
          return {
            canvasChildren
          };
        }
      }
    });
  },
  // Used to ask components to re-calculate their positions after a layout reflow
  pageReflow: 0,
  requestReflow: () => {
    config.debug && console.log('ScrollRig', 'reflow() requested');
    set(state => {
      return {
        pageReflow: state.pageReflow + 1
      };
    });
  },
  // keep track of scrollbar
  scroll: {
    y: 0,
    x: 0,
    limit: 0,
    velocity: 0,
    progress: 0,
    direction: ''
  },
  scrollTo: null,
  // (target) => window.scrollTo(0, target),
  setScrollTo: fn => {
    console.log('setScrollTo', fn);
    set(() => ({
      setScrollTo: fn
    }));
  }
})));

/**
 * runtime check for requestIdleCallback
 */
const requestIdleCallback = function (callback) {
  let {
    timeout = 100
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, {
      timeout
    });
  } else {
    setTimeout(callback, 0);
  }
};
var requestIdleCallback$1 = requestIdleCallback;

/**
 * Trigger reflow when WebFonts loaded
 */

const ResizeManager = () => {
  const requestReflow = useCanvasStore(state => state.requestReflow); // reflow on webfont loaded to prevent misalignments

  useEffect(() => {
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        requestIdleCallback$1(requestReflow);
      });
    }
  }, []);
  return null;
};

var ResizeManager$1 = ResizeManager;

const PerspectiveCamera = /*#__PURE__*/forwardRef((_ref, ref) => {
  let {
    makeDefault = false,
    scaleMultiplier = config.scaleMultiplier,
    ...props
  } = _ref;
  const set = useThree(state => state.set);
  const camera = useThree(state => state.camera);
  const size = useThree(state => state.size);
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const distance = useMemo(() => {
    const width = size.width * scaleMultiplier;
    const height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, pageReflow, scaleMultiplier]);
  const cameraRef = useRef();
  useLayoutEffect(() => {
    const width = size.width * scaleMultiplier;
    const height = size.height * scaleMultiplier;
    cameraRef.current.aspect = width / height;
    cameraRef.current.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance));
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
    // Update matrix world since the renderer is a frame late

    cameraRef.current.updateMatrixWorld();
  }, [distance, size]);
  useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera;
      set({
        camera: cameraRef.current
      });
      return () => set({
        camera: oldCam
      });
    }
  }, [camera, cameraRef, makeDefault, set]);
  return /*#__PURE__*/React__default.createElement("perspectiveCamera", _extends({
    ref: mergeRefs([cameraRef, ref]),
    position: [0, 0, distance],
    onUpdate: self => self.updateProjectionMatrix(),
    near: 0.1,
    far: distance * 2
  }, props));
});
PerspectiveCamera.displayName = 'PerspectiveCamera';
var PerspectiveCamera$1 = PerspectiveCamera;

const OrthographicCamera = /*#__PURE__*/forwardRef((_ref, ref) => {
  let {
    makeDefault = false,
    scaleMultiplier = config.scaleMultiplier,
    ...props
  } = _ref;
  const set = useThree(state => state.set);
  const camera = useThree(state => state.camera);
  const size = useThree(state => state.size);
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const distance = useMemo(() => {
    const width = size.width * scaleMultiplier;
    const height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, pageReflow, scaleMultiplier]);
  const cameraRef = useRef();
  useLayoutEffect(() => {
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
    // Update matrix world since the renderer is a frame late

    cameraRef.current.updateMatrixWorld();
  }, [distance, size]);
  useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera;
      set({
        camera: cameraRef.current
      });
      return () => set({
        camera: oldCam
      });
    }
  }, [camera, cameraRef, makeDefault, set]);
  return /*#__PURE__*/React__default.createElement("orthographicCamera", _extends({
    left: size.width * scaleMultiplier / -2,
    right: size.width * scaleMultiplier / 2,
    top: size.height * scaleMultiplier / 2,
    bottom: size.height * scaleMultiplier / -2,
    far: distance * 2,
    position: [0, 0, distance],
    near: 0.001,
    ref: mergeRefs([cameraRef, ref]),
    onUpdate: self => self.updateProjectionMatrix()
  }, props));
});
OrthographicCamera.displayName = 'OrthographicCamera';
var OrthographicCamera$1 = OrthographicCamera;

// Use to override Frustum temporarily to pre-upload textures to GPU
function setAllCulled(obj, overrideCulled) {
  if (!obj) return;

  if (overrideCulled === false) {
    obj.wasFrustumCulled = obj.frustumCulled;
    obj.wasVisible = obj.visible;
    obj.visible = true;
    obj.frustumCulled = false;
  } else {
    obj.visible = obj.wasVisible;
    obj.frustumCulled = obj.wasFrustumCulled;
  }

  obj.children.forEach(child => setAllCulled(child, overrideCulled));
}

const viewportSize = new Vector2(); // Flag that we need global rendering (full screen)

const requestRender = function () {
  let layers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [0];
  useCanvasStore.getState().globalRenderQueue = useCanvasStore.getState().globalRenderQueue || [0];
  useCanvasStore.getState().globalRenderQueue = [...useCanvasStore.getState().globalRenderQueue, ...layers];
};
const renderScissor = _ref => {
  let {
    gl,
    scene,
    camera,
    left,
    top,
    width,
    height,
    layer = 0,
    autoClear = false,
    clearDepth = true
  } = _ref;
  if (!scene || !camera) return;
  const _autoClear = gl.autoClear;
  gl.autoClear = autoClear;
  gl.setScissor(left, top, width, height);
  gl.setScissorTest(true);
  camera.layers.set(layer);
  clearDepth && gl.clearDepth();
  gl.render(scene, camera);
  gl.setScissorTest(false);
  gl.autoClear = _autoClear;
};
const renderViewport = _ref2 => {
  let {
    gl,
    scene,
    camera,
    left,
    top,
    width,
    height,
    layer = 0,
    scissor = true,
    autoClear = false,
    clearDepth = true
  } = _ref2;
  if (!scene || !camera) return;
  const _autoClear = gl.autoClear;
  gl.getSize(viewportSize);
  gl.autoClear = autoClear;
  gl.setViewport(left, top, width, height);
  gl.setScissor(left, top, width, height);
  gl.setScissorTest(scissor);
  camera.layers.set(layer);
  clearDepth && gl.clearDepth();
  gl.render(scene, camera);
  gl.setScissorTest(false);
  gl.setViewport(0, 0, viewportSize.x, viewportSize.y);
  gl.autoClear = _autoClear;
};
const preloadScene = function (scene, camera) {
  let layer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  let callback = arguments.length > 3 ? arguments[3] : undefined;
  if (!scene || !camera) return;
  config.preloadQueue.push(gl => {
    gl.setScissorTest(false);
    setAllCulled(scene, false);
    camera.layers.set(layer);
    gl.render(scene, camera);
    setAllCulled(scene, true);
    callback && callback();
  }); // auto trigger a new frame for the preload

  invalidate();
};

/**
 * Public interface for ScrollRig
 */

const useScrollRig = () => {
  const isCanvasAvailable = useCanvasStore(state => state.isCanvasAvailable);
  const hasVirtualScrollbar = useCanvasStore(state => state.hasVirtualScrollbar);
  const requestReflow = useCanvasStore(state => state.requestReflow);
  useEffect(() => {
    if (config.debug) {
      window._scrollRig = window._scrollRig || {};
      window._scrollRig.reflow = requestReflow;
    }
  }, []);
  return {
    isCanvasAvailable,
    hasVirtualScrollbar,
    preloadScene,
    requestRender,
    renderScissor,
    renderViewport,
    reflow: requestReflow
  };
};

/**
 * Global render loop to avoid double renders on the same frame
 */

const GlobalRenderer = _ref => {
  let {
    children
  } = _ref;
  const gl = useThree(s => s.gl);
  const frameloop = useThree(s => s.frameloop);
  const canvasChildren = useCanvasStore(state => state.canvasChildren);
  const scrollRig = useScrollRig();
  useLayoutEffect(() => {
    gl.debug.checkShaderErrors = config.debug;
  }, []);
  useEffect(() => {
    // clear canvas automatically if all children were removed
    if (!children && !Object.keys(canvasChildren).length) {
      config.debug && console.log('GlobalRenderer', 'auto clear empty canvas');
      gl.clear();
    }
  }, [children, canvasChildren]); // PRELOAD RENDER LOOP

  useFrame(() => {
    if (!config.preloadQueue.length) return;
    gl.autoClear = false; // Render preload frames first and clear directly

    config.preloadQueue.forEach(render => render(gl)); // cleanup

    gl.clear();
    config.preloadQueue = [];
    gl.autoClear = true; // trigger new frame to get correct visual state after all preloads

    config.debug && console.log('GlobalRenderer', 'preload complete. trigger global render');
    scrollRig.requestRender();
    invalidate();
  }, config.PRIORITY_PRELOAD); // GLOBAL RENDER LOOP

  useFrame(_ref2 => {
    let {
      camera,
      scene
    } = _ref2;
    const globalRenderQueue = useCanvasStore.getState().globalRenderQueue; // Render if requested or if always on

    if (config.globalRender && (frameloop === 'always' || globalRenderQueue)) {
      if (config.disableAutoClear) {
        gl.autoClear = false; // will fail in VR
      } // render default layer, scene, camera


      camera.layers.disableAll();

      if (globalRenderQueue) {
        globalRenderQueue.forEach(layer => {
          camera.layers.enable(layer);
        });
      } else {
        camera.layers.enable(0);
      } // render as HUD over any other renders by default


      config.clearDepth && gl.clearDepth();
      gl.render(scene, camera);
      gl.autoClear = true;
    } // cleanup for next frame


    useCanvasStore.getState().clearGlobalRenderQueue();
  }, config.globalRender ? config.PRIORITY_GLOBAL : undefined); // Take over rendering

  config.debug && console.log('GlobalRenderer', Object.keys(canvasChildren).length);
  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, Object.keys(canvasChildren).map(key => {
    const {
      mesh,
      props
    } = canvasChildren[key];

    if (typeof mesh === 'function') {
      return /*#__PURE__*/React__default.createElement(Fragment, {
        key: key
      }, mesh({
        key,
        ...scrollRig,
        ...props
      }));
    }

    return /*#__PURE__*/React__default.cloneElement(mesh, {
      key,
      ...props
    });
  }), children);
};

var GlobalRenderer$1 = GlobalRenderer;

class CanvasErrorBoundary extends React__default.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: false
    };
    this.props = props;
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return {
      error
    };
  } // componentDidCatch(error, errorInfo) {
  //   // You can also log the error to an error reporting service
  //   // logErrorToMyService(error, errorInfo)
  // }


  render() {
    if (this.state.error) {
      this.props.onError && this.props.onError(this.state.error);
      return null;
    }

    return this.props.children;
  }

}

var CanvasErrorBoundary$1 = CanvasErrorBoundary;

const GlobalCanvas = _ref => {
  let {
    as = Canvas,
    children,
    gl,
    style,
    orthographic,
    config: confOverrides,
    camera,
    ...props
  } = _ref;
  // override config
  useMemo(() => {
    Object.assign(config, confOverrides); // Querystring overrides

    const qs = queryString.parse(window.location.search); // show debug statements

    if (typeof qs.debug !== 'undefined') {
      config.debug = true;
    }
  }, [confOverrides]);
  const CanvasElement = as;
  return /*#__PURE__*/React__default.createElement(CanvasElement, _extends({
    className: "ScrollRigCanvas" // use our own default camera
    ,
    camera: null // Some sane defaults
    ,
    gl: {
      // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
      failIfMajorPerformanceCaveat: true,
      // skip webgl if slow device
      ...gl
    } // polyfill old iOS safari
    ,
    resize: {
      scroll: false,
      debounce: 0,
      polyfill: ResizeObserver
    } // default styles
    ,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '100vh',
      // use 100vh to avoid resize on iOS when url bar goes away
      ...style
    } // allow to override anything of the above

  }, props), children, /*#__PURE__*/React__default.createElement(GlobalRenderer$1, null), !orthographic && /*#__PURE__*/React__default.createElement(PerspectiveCamera$1, _extends({
    makeDefault: true
  }, camera)), orthographic && /*#__PURE__*/React__default.createElement(OrthographicCamera$1, _extends({
    makeDefault: true
  }, camera)), /*#__PURE__*/React__default.createElement(ResizeManager$1, null));
};

const GlobalCanvasIfSupported = _ref2 => {
  let {
    onError,
    ...props
  } = _ref2;
  const setCanvasAvailable = useCanvasStore(state => state.setCanvasAvailable);
  useLayoutEffect(() => {
    document.documentElement.classList.add('js-has-global-canvas');
  }, []);
  return /*#__PURE__*/React__default.createElement(CanvasErrorBoundary$1, {
    onError: err => {
      onError && onError(err);
      setCanvasAvailable(false);
      /* WebGL failed to init */

      document.documentElement.classList.remove('js-has-global-canvas');
      document.documentElement.classList.add('js-global-canvas-error');
    }
  }, /*#__PURE__*/React__default.createElement(GlobalCanvas, props));
};

var GlobalCanvasIfSupported$1 = GlobalCanvasIfSupported;

const DebugMaterial = shaderMaterial({
  color: new Color(1.0, 0.0, 0.0),
  opacity: 1
}, // vertex shader
` varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`, // fragment shader
`
    uniform vec3 color;
    uniform float opacity;
    varying vec2 vUv;
    void main() {
      gl_FragColor.rgba = vec4(color, opacity);
    }
  `);
extend({
  DebugMaterial
});
const DebugMesh = _ref => {
  let {
    scale
  } = _ref;
  return /*#__PURE__*/React__default.createElement("mesh", {
    scale: scale
  }, /*#__PURE__*/React__default.createElement("planeBufferGeometry", null), /*#__PURE__*/React__default.createElement("debugMaterial", {
    color: "hotpink",
    transparent: true,
    opacity: 0.5
  }));
};
var DebugMesh$1 = DebugMesh;

/**
 * Public interface for ScrollRig
 */

const useScrollbar = () => {
  const hasVirtualScrollbar = useCanvasStore(state => state.hasVirtualScrollbar);
  const scroll = useCanvasStore(state => state.scroll);
  const scrollTo = useCanvasStore(state => state.scrollTo);
  return {
    enabled: hasVirtualScrollbar,
    scroll,
    scrollTo
  };
};

function isElementProps(obj) {
  return typeof obj === 'object' && 'track' in obj;
}

const defaultArgs = {
  inViewportMargin: 0.33
};
/**
 * Returns the current Scene position of the DOM element
 * based on initial getBoundingClientRect and scroll delta from start
 */

function useTracker(args) {
  let deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  const size = useThree(s => s.size);
  const [inViewport, setInViewport] = useState(false);
  const {
    scroll
  } = useScrollbar();
  const {
    track,
    inViewportMargin
  } = isElementProps(args) ? { ...defaultArgs,
    ...args
  } : { ...defaultArgs,
    track: args
  };
  const scrollMargin = size.height * inViewportMargin; // cache the return object

  const position = useRef({
    x: 0,
    // exact position on page
    y: 0,
    // exact position on page
    top: 0,
    left: 0,
    positiveYUpBottom: 0
  }).current; // DOM rect bounds

  const bounds = useMemo(() => {
    var _track$current;

    const {
      top,
      bottom,
      left,
      right,
      width,
      height
    } = ((_track$current = track.current) === null || _track$current === void 0 ? void 0 : _track$current.getBoundingClientRect()) || {}; // Offset to Threejs scene which has 0,0 in the center of the screen

    const sceneOffset = {
      x: size.width * 0.5 - width * 0.5,
      y: size.height * 0.5 - height * 0.5
    };
    const bounds = {
      top: top + window.scrollY,
      bottom: bottom + window.scrollY,
      left: left + window.scrollX,
      right: right + window.scrollX,
      width,
      height,
      sceneOffset,
      x: left + window.scrollX - sceneOffset.x,
      // 0 middle of screen
      y: top + window.scrollY - sceneOffset.y // 0 middle of screen

    }; // update position

    position.x = ((bounds === null || bounds === void 0 ? void 0 : bounds.x) - window.scrollX) * config.scaleMultiplier; // exact position

    position.y = -1 * ((bounds === null || bounds === void 0 ? void 0 : bounds.y) - window.scrollY) * config.scaleMultiplier; // exact position

    position.top = position.y + bounds.sceneOffset.y;
    position.left = position.x + bounds.sceneOffset.x;
    position.positiveYUpBottom = 0;
    return bounds;
  }, [track, size, ...deps]); // scale in viewport units and pixel

  const scale = useMemo(() => {
    return [(bounds === null || bounds === void 0 ? void 0 : bounds.width) * config.scaleMultiplier, (bounds === null || bounds === void 0 ? void 0 : bounds.height) * config.scaleMultiplier, 1];
  }, [track, size, ...deps]);
  const scrollState = useRef({
    inViewport: false,
    progress: -1,
    visibility: -1,
    viewport: -1
  }).current;
  const update = useCallback(() => {
    if (!track.current) return;
    position.x = (bounds.x - scroll.x) * config.scaleMultiplier;
    position.y = -1 * (bounds.y - scroll.y) * config.scaleMultiplier;
    position.top = position.y + bounds.sceneOffset.y;
    position.left = position.x + bounds.sceneOffset.x;
    position.positiveYUpBottom = size.height * 0.5 + (position.y / config.scaleMultiplier - bounds.height * 0.5); // inverse Y
    // viewportscene
    // const positiveYUpBottom = size.height - (newTop / config.scaleMultiplier + bounds.height) // inverse Y
    // Scroll State stuff

    scrollState.inViewport = position.y + size.height * 0.5 + bounds.height * 0.5 > 0 - scrollMargin && position.y + size.height * 0.5 - bounds.height * 0.5 < size.height + scrollMargin; // set inViewport state using a transition to avoid lagging

    if (scrollState.inViewport && !inViewport) startTransition(() => setInViewport(true));else if (!scrollState.inViewport && inViewport) startTransition(() => setInViewport(false));

    if (scrollState.inViewport) {
      // calculate progress of passing through viewport (0 = just entered, 1 = just exited)
      const pxInside = bounds.top + position.y - bounds.top + size.height - bounds.sceneOffset.y;
      scrollState.progress = MathUtils.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1); // percent of total visible distance

      scrollState.visibility = MathUtils.mapLinear(pxInside, 0, bounds.height, 0, 1); // percent of item height in view

      scrollState.viewport = MathUtils.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
    }
  }, [bounds, track, size]);
  return {
    bounds,
    // HTML initial bounds
    scale,
    // Scene scale - includes z-axis so it can be spread onto mesh directly
    scrollState,
    position,
    // get current Scene position with scroll taken into account
    inViewport,
    update // call in rAF to update with latest scroll position

  };
}

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned and scaled exactly above DOM element
 *
 * @author david@14islands.com
 */

let ScrollScene = _ref => {
  let {
    track,
    children,
    margin = 0,
    // Margin outside scissor to avoid clipping vertex displacement (px)
    inViewportMargin = 0,
    visible = true,
    scissor = false,
    debug = false,
    positionFixed = false,
    hiddenStyle = {
      opacity: 0
    },
    as = 'scene',
    autoRender = true,
    hideOffscreen = true,
    renderOrder = 1,
    priority = config.PRIORITY_SCISSORS,
    ...props
  } = _ref;
  const inlineSceneRef = useCallback(node => {
    if (node !== null) {
      setScene(node);
    }
  }, []);
  const [scene, setScene] = useState(scissor ? new Scene() : null);
  const {
    requestRender,
    renderScissor
  } = useScrollRig();
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const {
    update,
    bounds,
    scale,
    position,
    scrollState,
    inViewport
  } = useTracker({
    track,
    inViewportMargin
  }, [pageReflow, scene]);
  console.log('ScrollScene', bounds, scale, position, scrollState, inViewport);
  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!(track !== null && track !== void 0 && track.current)) return;

    if (debug) {
      track.current.style.opacity = 0.5;
    } else {
      Object.assign(track.current.style, { ...hiddenStyle
      });
    }

    return () => {
      if (!(track !== null && track !== void 0 && track.current)) return;
      Object.keys(hiddenStyle).forEach(key => track.current.style[key] = '');
    };
  }, [track]); // RENDER FRAME

  useFrame(_ref2 => {
    let {
      gl,
      camera
    } = _ref2;
    if (!scene || !scale) return; // update element tracker

    update();
    const {
      x,
      y,
      positiveYUpBottom
    } = position;
    const {
      inViewport
    } = scrollState; // hide/show scene

    scene.visible = hideOffscreen ? inViewport && visible : visible;

    if (scene.visible) {
      // move scene
      if (!positionFixed) {
        scene.position.y = y;
        scene.position.x = x;
      }

      if (scissor) {
        autoRender && renderScissor({
          gl,
          scene,
          camera,
          left: bounds.left - margin,
          top: positiveYUpBottom - margin,
          width: bounds.width + margin * 2,
          height: bounds.height + margin * 2
        });
      } else {
        autoRender && requestRender();
      }
    }
  }, priority);
  const content = /*#__PURE__*/React__default.createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && scale && /*#__PURE__*/React__default.createElement(DebugMesh$1, {
    scale: scale
  }), children && scene && scale && children({
    // inherited props
    track,
    margin,
    renderOrder,
    // new props
    scale,
    // array
    scaleObj: {
      width: scale[0],
      height: scale[1]
    },
    scrollState,
    scene,
    inViewport,
    // useFrame render priority (in case children need to run after)
    priority: priority + renderOrder,
    // tunnel the rest
    ...props
  })); // portal if scissor or inline nested scene

  const InlineElement = as;
  return scissor ? createPortal(content, scene) : /*#__PURE__*/React__default.createElement(InlineElement, {
    ref: inlineSceneRef
  }, content);
};

ScrollScene = /*#__PURE__*/React__default.memo(ScrollScene);

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is rendered into a GL viewport matching the DOM position for better performance
 *
 * Adapted to @react-three/fiber from https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
 * @author david@14islands.com
 */

let ViewportScrollScene = _ref => {
  let {
    track,
    children,
    margin = 0,
    // Margin outside viewport to avoid clipping vertex displacement (px)
    inViewportMargin = 0,
    visible = true,
    debug = false,
    orthographic = false,
    hiddenStyle = {
      opacity: 0
    },
    renderOrder = 1,
    priority = config.PRIORITY_VIEWPORTS,
    ...props
  } = _ref;
  const camera = useRef();
  const [scene] = useState(() => new Scene());
  const {
    invalidate
  } = useThree();
  const {
    renderViewport
  } = useScrollRig();
  const {
    scroll
  } = useScrollbar();
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const {
    update,
    bounds,
    scale,
    position,
    scrollState,
    inViewport
  } = useTracker({
    track,
    inViewportMargin
  }, [pageReflow, scene]);
  const [cameraDistance, setCameraDistance] = useState(0); // El is rendered

  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!(track !== null && track !== void 0 && track.current)) return;

    if (debug) {
      track.current.style.opacity = 0.5;
    } else {
      Object.assign(track.current.style, { ...hiddenStyle
      });
    }

    return () => {
      if (!(track !== null && track !== void 0 && track.current)) return;
      Object.keys(hiddenStyle).forEach(key => track.current.style[key] = '');
    };
  }, [track]); // Find bounding box & scale mesh on resize

  useLayoutEffect(() => {
    const viewportWidth = bounds.width * config.scaleMultiplier;
    const viewportHeight = bounds.height * config.scaleMultiplier;
    const cameraDistance = Math.max(viewportWidth, viewportHeight) * config.scaleMultiplier;
    setCameraDistance(cameraDistance); // Calculate FOV to match the DOM bounds for this camera distance

    if (camera.current && !orthographic) {
      camera.current.aspect = (viewportWidth + margin * 2 * config.scaleMultiplier) / (viewportHeight + margin * 2 * config.scaleMultiplier);
      camera.current.fov = 2 * (180 / Math.PI) * Math.atan((viewportHeight + margin * 2 * config.scaleMultiplier) / (2 * cameraDistance));
      camera.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
      // Update matrix world since the renderer is a frame late

      camera.current.updateMatrixWorld();
    } // trigger a frame


    invalidate();
  }, [track, pageReflow, bounds]);
  const compute = React__default.useCallback((event, state) => {
    if (track.current && event.target === track.current) {
      const {
        width,
        height,
        left,
        top
      } = bounds;
      const x = event.clientX - left + scroll.x;
      const y = event.clientY - top + scroll.y;
      state.pointer.set(x / width * 2 - 1, -(y / height) * 2 + 1);
      state.raycaster.setFromCamera(state.pointer, camera.current);
    }
  }, [bounds, position]); // RENDER FRAME

  useFrame(_ref2 => {
    let {
      gl
    } = _ref2;
    if (!scene || !scale) return; // update element tracker

    update();
    const {
      inViewport
    } = scrollState; // hide/show scene

    scene.visible = inViewport && visible; // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas

    if (scene.visible) {
      renderViewport({
        gl,
        scene,
        camera: camera.current,
        left: bounds.left - margin,
        top: position.positiveYUpBottom - margin,
        width: bounds.width + margin * 2,
        height: bounds.height + margin * 2
      });
    }
  }, priority);
  return bounds && createPortal( /*#__PURE__*/React__default.createElement(React__default.Fragment, null, !orthographic && /*#__PURE__*/React__default.createElement("perspectiveCamera", {
    ref: camera,
    position: [0, 0, cameraDistance],
    onUpdate: self => self.updateProjectionMatrix()
  }), orthographic && /*#__PURE__*/React__default.createElement("orthographicCamera", {
    ref: camera,
    position: [0, 0, cameraDistance],
    onUpdate: self => self.updateProjectionMatrix(),
    left: scale.width / -2,
    right: scale.width / 2,
    top: scale.height / 2,
    bottom: scale.height / -2,
    far: cameraDistance * 2,
    near: 0.001
  }), /*#__PURE__*/React__default.createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && scale && /*#__PURE__*/React__default.createElement(DebugMesh$1, {
    scale: scale
  }), children && scene && scale && children({
    // inherited props
    track,
    margin,
    renderOrder,
    // new props
    scale,
    scrollState,
    scene,
    camera: camera.current,
    inViewport,
    // useFrame render priority (in case children need to run after)
    priority: priority + renderOrder,
    // tunnel the rest
    ...props
  }))), scene, {
    events: {
      compute,
      priority
    },
    size: {
      width: bounds.width,
      height: bounds.height
    }
  });
};

ViewportScrollScene = /*#__PURE__*/React__default.memo(ViewportScrollScene);

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted
 * @param {object} object THREE.js object3d
 */

function useCanvas(object, deps, _ref) {
  let {
    key,
    dispose = true
  } = _ref;
  const updateCanvas = useCanvasStore(state => state.updateCanvas);
  const renderToCanvas = useCanvasStore(state => state.renderToCanvas);
  const removeFromCanvas = useCanvasStore(state => state.removeFromCanvas); // auto generate uuid v4 key

  const uniqueKey = useMemo(() => key || MathUtils.generateUUID(), []); // render to canvas if not mounted already

  useLayoutEffect(() => {
    renderToCanvas(uniqueKey, object, {
      inactive: false
    });
  }, [uniqueKey]); // remove from canvas if no usage (after render so new users have time to register)

  useEffect(() => {
    return () => {
      removeFromCanvas(uniqueKey, dispose);
    };
  }, [uniqueKey]); // return function that can set new props on the canvas component

  const set = useCallback(props => {
    updateCanvas(uniqueKey, props);
  }, [updateCanvas, uniqueKey]); // auto update props when deps change

  useEffect(() => {
    set(deps);
  }, [...Object.values(deps)]);
  return set;
}

const UseCanvas = /*#__PURE__*/forwardRef((_ref, ref) => {
  let {
    children,
    id,
    ...props
  } = _ref;
  // auto update canvas with all props
  useCanvas(children, { ...props,
    ref
  }, {
    key: id
  });
  return null;
});

/**
 *  Reasons for why this exists:
 *
 *  - Make sure we don't load image twice - <img> tag already loads image, we need to make sure we get a cache hit
 *
 *  - Get responsive image size using currentSrc/src from the <img/> if available
 *
 *  - Consistent image loading across major browsers
 *    - Safari doesnt support createImageBitmap
 *    - Firefox createImageBitmap doesn't accept 2nd parameter for flipping
 *    - Firefox createImageBitmap seems to flip powerOf2 images by default - Chrome doesn't
 *
 */
// only use ImageBitmapLoader if supported and not FF for now

const supportsImageBitmap = typeof createImageBitmap !== 'undefined' && /Firefox/.test(navigator.userAgent) === false; // Override fetch to prefer cached images by default

if (typeof window !== 'undefined') {
  const realFetch = window.fetch;

  window.fetch = function (url) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      cache: 'force-cache'
    };

    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    return realFetch(url, options, ...args);
  };
}

const useTextureLoader = function (url) {
  let {
    disableMipmaps = false
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const [texture, setTexture] = useState();
  const [imageBitmap, setImageBitmap] = useState();
  const {
    gl
  } = useThree();
  const isWebGL2 = gl.capabilities.isWebGL2;
  const useImageBitmap = isWebGL2 && supportsImageBitmap; // webgl2 supports NPOT images so we have less flipY logic

  if (typeof window !== 'undefined') {
    window._useImageBitmap = useImageBitmap;
  }

  const disposeBitmap = useCallback(() => {
    if (imageBitmap && imageBitmap.close) {
      imageBitmap.close();
      setImageBitmap(null);
    }
  }, [imageBitmap]);

  const loadTexture = url => {
    let loader;

    if (useImageBitmap) {
      loader = new ImageBitmapLoader(); // Flip if texture

      loader.setOptions({
        imageOrientation: 'flipY',
        premultiplyAlpha: 'none'
      });
    } else {
      loader = new TextureLoader();
    }

    loader.setCrossOrigin('anonymous');
    loader.load(url, texture => {
      if (useImageBitmap) {
        setImageBitmap(imageBitmap);
        texture = new CanvasTexture(texture);
      } // max quality


      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      texture.encoding = sRGBEncoding;

      if (disableMipmaps) {
        texture.minFilter = LinearFilter;
        texture.generateMipmaps = false;
      } // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
      // eslint-disable-next-line no-useless-escape


      var isJPEG = url.search(/\.jpe?g($|\?)/i) > 0 || url.search(/^data\:image\/jpeg/) === 0;
      texture.format = isJPEG ? RGBFormat : RGBAFormat;
      setTexture(texture);
    }, null, err => {
      console.error('err', err);
    });
  };

  useEffect(() => {
    if (url) {
      loadTexture(url);
    }
  }, [url]);
  return [texture, disposeBitmap];
};
const useImgTagAsTexture = (imgEl, opts) => {
  const [url, setUrl] = useState(null);
  const [texture, disposeBitmap] = useTextureLoader(url, opts);

  const loadTexture = () => {
    imgEl.removeEventListener('load', loadTexture);
    setUrl(imgEl.currentSrc || imgEl.src);
  };

  useEffect(() => {
    // Wait for DOM <img> to finish loading so we get a cache hit from our upcoming fetch API request
    if (imgEl) {
      imgEl.addEventListener('load', loadTexture); // check if image was loaded from browser cache

      if (imgEl.complete) {
        loadTexture();
      }
    }
  }, [imgEl]);
  return [texture, disposeBitmap];
};

const EASE_EXP_OUT = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // https://easings.net/


function LenisScrollbar(_ref, ref) {
  let {
    children,
    duration = 1,
    easing = EASE_EXP_OUT,
    smooth = true,
    direction = 'vertical',
    config,
    ...props
  } = _ref;
  const lenisImpl = useRef();
  useImperativeHandle(ref, () => ({
    start: () => {
      var _lenisImpl$current;

      return (_lenisImpl$current = lenisImpl.current) === null || _lenisImpl$current === void 0 ? void 0 : _lenisImpl$current.start();
    },
    stop: () => {
      var _lenisImpl$current2;

      return (_lenisImpl$current2 = lenisImpl.current) === null || _lenisImpl$current2 === void 0 ? void 0 : _lenisImpl$current2.stop();
    },
    onScroll: cb => {
      var _lenisImpl$current3;

      return (_lenisImpl$current3 = lenisImpl.current) === null || _lenisImpl$current3 === void 0 ? void 0 : _lenisImpl$current3.on('scroll', cb);
    },
    scrollTo: (target, props) => {
      var _lenisImpl$current4;

      return (_lenisImpl$current4 = lenisImpl.current) === null || _lenisImpl$current4 === void 0 ? void 0 : _lenisImpl$current4.scrollTo(target, props);
    }
  }));
  useEffect(() => {
    const lenis = lenisImpl.current = new Lenis({
      duration,
      easing,
      smooth,
      direction,
      ...config
    }); // let r3f drive the frameloop

    const removeEffect = addEffect(time => lenis.raf(time)); // cleanup on unmount

    return () => {
      removeEffect();
      lenis.destroy();
    };
  }, [smooth]);
  return children && children(props);
}
var LenisScrollbar$1 = /*#__PURE__*/forwardRef(LenisScrollbar);

const SmoothScrollbar = _ref => {
  let {
    children,
    smooth = true,
    paused = false,
    scrollRestoration = 'auto',
    disablePointerOnScroll = true
  } = _ref;
  const ref = useRef();
  const lenis = useRef();
  const preventPointer = useRef(false);
  const setVirtualScrollbar = useCanvasStore(state => state.setVirtualScrollbar);
  const scrollState = useCanvasStore(state => state.scroll); // disable pointer events while scrolling to avoid slow event handlers

  const preventPointerEvents = prevent => {
    if (!disablePointerOnScroll) return;

    if (ref.current && preventPointer.current !== prevent) {
      preventPointer.current = prevent;
      ref.current.style.pointerEvents = prevent ? 'none' : 'auto';
    }
  }; // reset pointer events when moving mouse


  const onMouseMove = useCallback(() => {
    preventPointerEvents(false);
  }, []);
  useEffect(() => {
    var _lenis$current, _lenis$current2;

    // update global scroll store
    (_lenis$current = lenis.current) === null || _lenis$current === void 0 ? void 0 : _lenis$current.onScroll(_ref2 => {
      let {
        scroll,
        limit,
        velocity,
        direction,
        progress
      } = _ref2;
      scrollState.y = direction === 'vertical' ? scroll : 0;
      scrollState.x = direction === 'horizontal' ? scroll : 0;
      scrollState.limit = limit;
      scrollState.velocity = velocity;
      scrollState.direction = direction;
      scrollState.progress = progress; // disable pointer logic

      const disablePointer = debounce(() => preventPointerEvents(true), 100, true);

      if (Math.abs(velocity) > 1.4) {
        disablePointer();
      } else {
        preventPointerEvents(false);
      }
    }); // expose scrollTo function

    useCanvasStore.setState({
      scrollTo: (_lenis$current2 = lenis.current) === null || _lenis$current2 === void 0 ? void 0 : _lenis$current2.scrollTo
    });
    window.addEventListener('pointermove', onMouseMove);
    return () => {
      window.removeEventListener('pointermove', onMouseMove);
    };
  }, [smooth]);
  useEffect(() => {
    document.documentElement.classList.toggle('js-has-smooth-scrollbar', smooth);
    setVirtualScrollbar(smooth);
  }, [smooth]);
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = scrollRestoration;
    }
  }, []);
  useEffect(() => {
    var _lenis$current3, _lenis$current4;

    paused ? (_lenis$current3 = lenis.current) === null || _lenis$current3 === void 0 ? void 0 : _lenis$current3.stop() : (_lenis$current4 = lenis.current) === null || _lenis$current4 === void 0 ? void 0 : _lenis$current4.start();
  }, [paused]);
  return /*#__PURE__*/React.createElement(LenisScrollbar$1, {
    ref: lenis,
    smooth: smooth
  }, bind => children({ ...bind,
    ref
  }));
};

const useDelayedEffect = function (fn, deps) {
  let ms = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  let timer;
  useEffect(() => {
    timer = setTimeout(fn, ms);
    return () => clearTimeout(timer);
  }, deps);
};
var useDelayedEffect$1 = useDelayedEffect;

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted after initial delay (ms)
 * @param {object} object THREE.js object3d
 */

const useDelayedCanvas = function (object, ms) {
  let deps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  let key = arguments.length > 3 ? arguments[3] : undefined;
  const updateCanvas = useCanvasStore(state => state.updateCanvas);
  const renderToCanvas = useCanvasStore(state => state.renderToCanvas);
  const removeFromCanvas = useCanvasStore(state => state.removeFromCanvas); // auto generate uuid v4 key

  const uniqueKey = useMemo(() => key || MathUtils.generateUUID(), []); // remove on unmount

  useLayoutEffect(() => {
    return () => removeFromCanvas(uniqueKey);
  }, []);
  useDelayedEffect$1(() => {
    renderToCanvas(uniqueKey, object);
  }, deps, ms); // return function that can set new props on the canvas component

  const set = props => {
    requestIdleCallback$1(() => updateCanvas(uniqueKey, props), {
      timeout: 100
    });
  };

  return set;
};

export { GlobalCanvasIfSupported$1 as GlobalCanvas, ScrollScene, SmoothScrollbar, UseCanvas, ViewportScrollScene, config as _config, useCanvas, useCanvasStore, useDelayedCanvas, useImgTagAsTexture, useScrollRig, useScrollbar, useTextureLoader, useTracker };
