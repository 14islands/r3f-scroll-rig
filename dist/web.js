import _extends from '@babel/runtime/helpers/esm/extends';
import React, { useState, useEffect, useRef, forwardRef, useMemo, useLayoutEffect, useCallback, Fragment, Suspense } from 'react';
import { addEffect, addAfterEffect, useFrame, invalidate, useThree, Canvas, extend, createPortal } from '@react-three/fiber';
import { ResizeObserver } from '@juggle/resize-observer';
import queryString from 'query-string';
import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import StatsImpl from 'three/examples/js/libs/stats.min';
import { useWindowSize, useWindowHeight } from '@react-hook/window-size';
import mergeRefs from 'react-merge-refs';
import { Vector2, Color, Scene, MathUtils, ImageBitmapLoader, TextureLoader, CanvasTexture, sRGBEncoding, LinearFilter, RGBFormat, RGBAFormat } from 'three';
import PropTypes from 'prop-types';
import _lerp from '@14islands/lerp';
import { shaderMaterial } from '@react-three/drei/core/shaderMaterial';
import ReactDOM from 'react-dom';

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
const cancelIdleCallback = id => {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};
var requestIdleCallback$1 = requestIdleCallback;

const useCanvasStore = create(subscribeWithSelector(set => ({
  // //////////////////////////////////////////////////////////////////////////
  // GLOBAL ScrollRig STATE
  // //////////////////////////////////////////////////////////////////////////
  globalRenderQueue: false,
  clearGlobalRenderQueue: () => set(state => ({
    globalRenderQueue: false
  })),
  // true if WebGL initialized without errors
  isCanvasAvailable: true,
  setCanvasAvailable: isCanvasAvailable => set(state => ({
    isCanvasAvailable
  })),
  // true if <VirtualScrollbar> is currently enabled
  hasVirtualScrollbar: false,
  setVirtualScrollbar: hasVirtualScrollbar => set(state => ({
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
      const obj = { ...canvasChildren,
        [key]: {
          mesh,
          props
        }
      };
      return {
        canvasChildren: obj
      };
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
        props
      }
    } = canvasChildren;
    const obj = { ...canvasChildren,
      [key]: {
        mesh,
        props: { ...props,
          ...newProps
        }
      }
    };
    return {
      canvasChildren: obj
    };
  }),
  // remove component from canvas
  removeFromCanvas: key => set(_ref3 => {
    let {
      canvasChildren
    } = _ref3;
    const {
      [key]: omit,
      ...obj
    } = canvasChildren; // make a separate copy of the obj and omit

    return {
      canvasChildren: obj
    };
  }),
  // Used to ask components to re-calculate their positions after a layout reflow
  pageReflowRequested: 0,
  pageReflowCompleted: 0,
  requestReflow: () => {
    set(state => {
      requestIdleCallback(state.triggerReflowCompleted, {
        timeout: 100
      });
      return {
        pageReflowRequested: state.pageReflowRequested + 1
      };
    });
  },
  triggerReflowCompleted: () => {
    set(state => ({
      pageReflowCompleted: state.pageReflowCompleted + 1
    }));
  },
  // keep track of scroll position
  scrollY: 0,
  setScrollY: scrollY => set(state => ({
    scrollY
  }))
})));

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

/* Copied from drei - no need to import just for this */

function Stats(_ref) {
  let {
    showPanel = 0,
    className,
    parent
  } = _ref;
  const [stats] = useState(new StatsImpl());
  useEffect(() => {
    if (stats) {
      const node = parent && parent.current || document.body;
      stats.showPanel(showPanel);
      node.appendChild(stats.dom);
      if (className) stats.dom.classList.add(className);
      const begin = addEffect(() => stats.begin());
      const end = addAfterEffect(() => stats.end());
      return () => {
        node.removeChild(stats.dom);
        begin();
        end();
      };
    }
  }, [parent, stats, className, showPanel]);
  return null;
}

const StatsDebug = _ref => {
  let {
    render = true,
    memory = true
  } = _ref;
  const stats = useRef({
    calls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0
  }).current;
  useFrame(_ref2 => {
    let {
      gl,
      clock
    } = _ref2;
    gl.info.autoReset = false;
    const _calls = gl.info.render.calls;
    const _triangles = gl.info.render.triangles;
    const _geometries = gl.info.memory.geometries;
    const _textures = gl.info.memory.textures;

    if (render) {
      if (_calls !== stats.calls || _triangles !== stats.triangles) {
        requestIdleCallback(() => console.info('Draw calls: ', _calls, ' Triangles: ', _triangles));
        stats.calls = _calls;
        stats.triangles = _triangles;
      }
    }

    if (memory) {
      if (_geometries !== stats.geometries || _textures !== stats.textures) {
        requestIdleCallback(() => console.info('Geometries: ', _geometries, 'Textures: ', _textures));
        stats.geometries = _geometries;
        stats.textures = _textures;
      }
    }

    gl.info.reset();
  });
  return null;
};

var StatsDebug$1 = StatsDebug;

/**
 * Manages Scroll rig resize events by trigger a reflow instead of individual resize listeners in each component
 * The order is carefully scripted:
 *  1. reflow() will trigger canvas components to calculate positions
 *  3. Canvas scroll components listen to `pageReflowCompleted` and recalc positions
 */

const ResizeManager = _ref => {
  let {
    reflow,
    resizeOnWebFontLoaded = true
  } = _ref;
  const mounted = useRef(false);
  const [windowWidth, windowHeight] = useWindowSize({
    wait: 300
  }); // Detect only resize events

  useEffect(() => {
    if (mounted.current) {
      config.debug && console.log('ResizeManager', 'reflow() because width changed');
      reflow();
    } else {
      mounted.current = true;
    }
  }, [windowWidth, windowHeight]); // reflow on webfont loaded to prevent misalignments

  useEffect(() => {
    if (!resizeOnWebFontLoaded) return;
    let fallbackTimer;

    if ('fonts' in document) {
      document.fonts.onloadingdone = reflow;
    } else {
      fallbackTimer = setTimeout(reflow, 1000);
    }

    return () => {
      if ('fonts' in document) {
        document.fonts.onloadingdone = null;
      } else {
        clearTimeout(fallbackTimer);
      }
    };
  }, []);
  return null;
};

var ResizeManager$1 = ResizeManager;

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
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted);
  return {
    isCanvasAvailable,
    hasVirtualScrollbar,
    preloadScene,
    requestRender,
    renderScissor,
    renderViewport,
    reflow: requestReflow,
    reflowCompleted: pageReflowCompleted
  };
};

const PerspectiveCamera = /*#__PURE__*/forwardRef((_ref, ref) => {
  let {
    makeDefault = false,
    scaleMultiplier = config.scaleMultiplier,
    ...props
  } = _ref;
  const set = useThree(state => state.set);
  const camera = useThree(state => state.camera);
  const size = useThree(state => state.size);
  const {
    reflowCompleted
  } = useScrollRig();
  const distance = useMemo(() => {
    const width = size.width * scaleMultiplier;
    const height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, reflowCompleted, scaleMultiplier]);
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
  return /*#__PURE__*/React.createElement("perspectiveCamera", _extends({
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
  const {
    reflowCompleted
  } = useScrollRig();
  const distance = useMemo(() => {
    const width = size.width * scaleMultiplier;
    const height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, reflowCompleted, scaleMultiplier]);
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
  return /*#__PURE__*/React.createElement("orthographicCamera", _extends({
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

const DefaultScrollTracker = () => {
  const hasVirtualScrollbar = useCanvasStore(state => state.hasVirtualScrollbar);
  const setScrollY = useCanvasStore(state => state.setScrollY);
  const setScroll = useCallback(() => {
    setScrollY(window.pageYOffset);
  }, [setScrollY]);
  useEffect(() => {
    if (!hasVirtualScrollbar) {
      window.addEventListener('scroll', setScroll);
    }

    return () => window.removeEventListener('scroll', setScroll);
  }, [hasVirtualScrollbar]);
  return null;
};
var DefaultScrollTracker$1 = DefaultScrollTracker;

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

  useFrame(_ref2 => {
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

  useFrame(_ref3 => {
    let {
      camera,
      scene
    } = _ref3;
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
      }

      config.clearDepth && gl.clearDepth(); // render as HUD over any other renders

      gl.render(scene, camera); // cleanup for next frame

      useCanvasStore.getState().clearGlobalRenderQueue();
      gl.autoClear = true;
    }
  }, config.globalRender ? config.PRIORITY_GLOBAL : undefined); // Take over rendering

  config.debug && console.log('GlobalRenderer', Object.keys(canvasChildren).length);
  return /*#__PURE__*/React.createElement(React.Fragment, null, Object.keys(canvasChildren).map((key, i) => {
    const {
      mesh,
      props
    } = canvasChildren[key];

    if (typeof mesh === 'function') {
      return /*#__PURE__*/React.createElement(Fragment, {
        key: key
      }, mesh({
        key,
        ...scrollRig,
        ...props
      }));
    }

    return /*#__PURE__*/React.cloneElement(mesh, {
      key,
      ...props
    });
  }), children);
};

var GlobalRenderer$1 = GlobalRenderer;

class CanvasErrorBoundary extends React.Component {
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
    fallback = null,
    ...props
  } = _ref;
  const requestReflow = useCanvasStore(state => state.requestReflow); // override config

  useMemo(() => {
    Object.assign(config, confOverrides); // Querystring overrides

    const qs = queryString.parse(window.location.search); // show FPS counter on request

    if (typeof qs.fps !== 'undefined') {
      config.fps = true;
    } // show debug statements


    if (typeof qs.debug !== 'undefined') {
      config.debug = true;
    }
  }, [confOverrides]);
  const CanvasElement = as;
  return /*#__PURE__*/React.createElement(CanvasElement, _extends({
    className: "ScrollRigCanvas" // use our own default camera
    ,
    camera: null // Some sane defaults
    ,
    gl: {
      antialias: true,
      alpha: true,
      depth: true,
      powerPreference: 'high-performance',
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
    } // default pixelratio
    ,
    dpr: [1, 2] // default styles
    ,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '100vh',
      // use 100vh to avoid resize on iOS when url bar goes away
      transform: 'translateZ(0)',
      ...style
    } // allow to override anything of the above

  }, props), /*#__PURE__*/React.createElement(Suspense, {
    fallback: fallback
  }, children, /*#__PURE__*/React.createElement(GlobalRenderer$1, null)), !orthographic && /*#__PURE__*/React.createElement(PerspectiveCamera$1, _extends({
    makeDefault: true
  }, camera)), orthographic && /*#__PURE__*/React.createElement(OrthographicCamera$1, _extends({
    makeDefault: true
  }, camera)), config.debug && /*#__PURE__*/React.createElement(StatsDebug$1, null), config.fps && /*#__PURE__*/React.createElement(Stats, null), /*#__PURE__*/React.createElement(ResizeManager$1, {
    reflow: requestReflow
  }), /*#__PURE__*/React.createElement(DefaultScrollTracker$1, null));
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
  return /*#__PURE__*/React.createElement(CanvasErrorBoundary$1, {
    onError: err => {
      onError && onError(err);
      setCanvasAvailable(false);
      /* WebGL failed to init */

      document.documentElement.classList.remove('js-has-global-canvas');
      document.documentElement.classList.add('js-global-canvas-error');
    }
  }, /*#__PURE__*/React.createElement(GlobalCanvas, props));
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
  return /*#__PURE__*/React.createElement("mesh", null, /*#__PURE__*/React.createElement("planeBufferGeometry", {
    attach: "geometry",
    args: [scale.width, scale.height, 1, 1]
  }), /*#__PURE__*/React.createElement("debugMaterial", {
    color: "hotpink",
    attach: "material",
    transparent: true,
    opacity: 0.5
  }));
};
var DebugMesh$1 = DebugMesh;

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned and scaled exactly above DOM element
 *
 * @author david@14islands.com
 */

let ScrollScene = _ref => {
  let {
    el,
    lerp,
    // override global lerp. don't change if you want to stay synched with the virtual scrollbar
    lerpOffset = 1,
    // change current lerp by a factor - use this instead of `lerp`
    children,
    renderOrder = 1,
    priority = config.PRIORITY_SCISSORS,
    margin = 14,
    // Margin outside viewport to avoid clipping vertex displacement (px)
    inViewportMargin,
    visible = true,
    scissor = false,
    debug = false,
    setInViewportProp = false,
    updateLayout = 0,
    positionFixed = false,
    hiddenStyle = {
      opacity: 0
    },
    resizeDelay = 0,
    as = 'scene',
    autoRender = true,
    hideOffscreen = true,
    ...props
  } = _ref;
  const inlineSceneRef = useCallback(node => {
    if (node !== null) {
      setScene(node);
    }
  }, []);
  const [scene, setScene] = useState(scissor ? new Scene() : null);
  const [inViewport, setInViewport] = useState(false);
  const [scale, setScale] = useState(null);
  const {
    size,
    invalidate
  } = useThree();
  const {
    requestRender,
    renderScissor
  } = useScrollRig();
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted); // get initial scrollY and listen for transient updates

  const scrollY = useRef(useCanvasStore.getState().scrollY);
  useEffect(() => useCanvasStore.subscribe(state => state.scrollY, y => {
    scrollY.current = y;
    invalidate(); // Trigger render on scroll
  }), []); // non-reactive state

  const transient = useRef({
    mounted: false,
    isFirstRender: true,
    bounds: {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      centerOffset: -1,
      x: 0,
      inViewport: false,
      progress: 0,
      viewport: 0,
      visibility: 0
    },
    prevBounds: {
      y: 0
    }
  }).current;
  useEffect(() => {
    transient.mounted = true;
    return () => transient.mounted = false;
  }, []);
  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!(el !== null && el !== void 0 && el.current)) return;

    if (debug) {
      el.current.style.opacity = 0.5;
    } else {
      Object.assign(el.current.style, { ...hiddenStyle
      });
    }

    return () => {
      if (!(el !== null && el !== void 0 && el.current)) return;
      Object.keys(hiddenStyle).forEach(key => el.current.style[key] = '');
    };
  }, [el.current]);

  const updateSizeAndPosition = () => {
    if (!el || !el.current || !scene) {
      return;
    }

    const {
      bounds,
      prevBounds
    } = transient;
    const {
      top,
      left,
      width,
      height
    } = el.current.getBoundingClientRect(); // pixel bounds

    bounds.top = top + window.pageYOffset;
    bounds.left = left;
    bounds.width = width;
    bounds.height = height;
    bounds.centerOffset = size.height * 0.5 - height * 0.5; // scale in viewport units and pixel

    setScale({
      width: width * config.scaleMultiplier,
      height: height * config.scaleMultiplier,
      multiplier: config.scaleMultiplier,
      pixelWidth: width,
      pixelHeight: height,
      viewportWidth: size.width * config.scaleMultiplier,
      viewportHeight: size.height * config.scaleMultiplier
    }); // place horizontally

    bounds.x = left - size.width * 0.5 + width * 0.5;
    scene.position.x = bounds.x * config.scaleMultiplier; // prevents ghost lerp on first render

    if (transient.isFirstRender) {
      prevBounds.y = top - bounds.centerOffset;
      transient.isFirstRender = false;
    }

    invalidate(); // trigger render
  }; // Find bounding box & scale mesh on resize


  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      updateSizeAndPosition();
    }, resizeDelay);
    return () => {
      clearTimeout(timer);
    };
  }, [pageReflowCompleted, updateLayout, scene]); // RENDER FRAME

  useFrame((_ref2, frameDelta) => {
    let {
      gl,
      camera,
      clock
    } = _ref2;
    if (!scene || !scale) return;
    const {
      bounds,
      prevBounds
    } = transient; // Find new Y based on cached position and scroll

    const initialPos = config.subpixelScrolling ? bounds.top - bounds.centerOffset : Math.floor(bounds.top - bounds.centerOffset);
    const y = initialPos - scrollY.current; // frame delta

    const delta = Math.abs(prevBounds.y - y); // Lerp the distance to simulate easing

    const lerpY = _lerp(prevBounds.y, y, (lerp || config.scrollLerp) * lerpOffset, frameDelta);

    const newY = config.subpixelScrolling ? lerpY : Math.floor(lerpY); // Abort if element not in screen

    const scrollMargin = inViewportMargin || size.height * 0.33;
    const isOffscreen = hideOffscreen && (newY + size.height * 0.5 + scale.pixelHeight * 0.5 < -scrollMargin || newY + size.height * 0.5 - scale.pixelHeight * 0.5 > size.height + scrollMargin); // store top value for next frame

    bounds.inViewport = !isOffscreen;
    setInViewportProp && requestIdleCallback$1(() => transient.mounted && setInViewport(!isOffscreen));
    prevBounds.y = lerpY; // hide/show scene

    scene.visible = !isOffscreen && visible;

    if (scene.visible) {
      // move scene
      if (!positionFixed) {
        scene.position.y = -newY * config.scaleMultiplier;
      }

      const positiveYUpBottom = size.height * 0.5 - (newY + scale.pixelHeight * 0.5); // inverse Y

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
      } // calculate progress of passing through viewport (0 = just entered, 1 = just exited)


      const pxInside = bounds.top - newY - bounds.top + size.height - bounds.centerOffset;
      bounds.progress = MathUtils.mapLinear(pxInside, 0, size.height + scale.pixelHeight, 0, 1); // percent of total visible distance

      bounds.visibility = MathUtils.mapLinear(pxInside, 0, scale.pixelHeight, 0, 1); // percent of item height in view

      bounds.viewport = MathUtils.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
    } // render another frame if delta is large enough


    if (!isOffscreen && delta > config.scrollRestDelta) {
      invalidate();
    }
  }, priority);
  const content = /*#__PURE__*/React.createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && scale && /*#__PURE__*/React.createElement(DebugMesh$1, {
    scale: scale
  }), children && scene && scale && children({
    // inherited props
    el,
    lerp: lerp || config.scrollLerp,
    lerpOffset,
    margin,
    renderOrder,
    // new props
    scale,
    state: transient,
    // @deprecated
    scrollState: transient.bounds,
    scene,
    inViewport,
    // useFrame render priority (in case children need to run after)
    priority: config.PRIORITY_SCISSORS + renderOrder,
    // tunnel the rest
    ...props
  })); // portal if scissor or inline nested scene

  const InlineElement = as;
  return scissor ? createPortal(content, scene) : /*#__PURE__*/React.createElement(InlineElement, {
    ref: inlineSceneRef
  }, content);
};

ScrollScene = /*#__PURE__*/React.memo(ScrollScene);
ScrollScene.childPropTypes = { ...ScrollScene.propTypes,
  scale: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  }),
  state: PropTypes.shape({
    bounds: PropTypes.shape({
      left: PropTypes.number,
      top: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
      inViewport: PropTypes.bool,
      progress: PropTypes.number,
      visibility: PropTypes.number,
      viewport: PropTypes.number
    })
  }),
  scene: PropTypes.object,
  // Parent scene,
  inViewport: PropTypes.bool // {x,y} to scale

};
ScrollScene.priority = config.PRIORITY_SCISSORS;

const LAYOUT_LERP = 0.1;
/**
 * Render child element in portal and move using useFrame so we can and match the lerp of the VirtualScrollbar
 * TThe original el used for position
 * @author david@14islands.com
 */

const ScrollDomPortal = /*#__PURE__*/forwardRef((_ref, ref) => {
  let {
    el,
    portalEl,
    lerp,
    // override global lerp. don't change if you want to stay synched with the virtual scrollbar
    lerpOffset = 1,
    // change current lerp by a factor - use this instead of `lerp`
    children,
    zIndex = 0,
    getOffset = () => {},
    live = false,
    // detect new changes from the DOM (useful if aimating el position with CSS)
    layoutLerp = LAYOUT_LERP,
    // easing to apply to layout transition
    style
  } = _ref;
  const copyEl = useRef();
  const local = useRef({
    needUpdate: false,
    offsetY: 0,
    offsetX: 0,
    raf: -1,
    lastFrame: -1
  }).current;
  const bounds = useRef({
    top: 0,
    left: 0,
    width: 0,
    height: 0
  }).current;
  const prevBounds = useRef({
    top: 0,
    wasOffscreen: false
  }).current;
  const viewportHeight = useWindowHeight();
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted);

  const invalidate = () => {
    window.cancelAnimationFrame(local.raf);
    local.raf = window.requestAnimationFrame(frame);
  }; // get initial scrollY and listen for transient updates


  const scrollY = useRef(useCanvasStore.getState().scrollY);
  useEffect(() => useCanvasStore.subscribe(state => state.scrollY, y => {
    scrollY.current = y;
    invalidate(); // Trigger render on scroll
  }), []); // Find initial position of proxy element on mount

  useEffect(() => {
    if (!el || !el.current) return;
    const {
      top,
      left,
      width,
      height
    } = el.current.getBoundingClientRect();
    bounds.top = top + window.pageYOffset;
    bounds.left = left;
    bounds.width = width;
    bounds.height = height;
    prevBounds.top = -window.pageYOffset;
    prevBounds.left = 0;
    prevBounds.x = 0;
    prevBounds.y = 0;
    copyEl.current.style.top = bounds.top + 'px';
    copyEl.current.style.left = left + 'px';
    copyEl.current.style.width = width + 'px';
    copyEl.current.style.height = height + 'px';
    copyEl.current.style.zIndex = zIndex;
    copyEl.current.style.position = 'fixed'; // trigger render

    local.needUpdate = true;
    invalidate();
  }, [el]); // TODO: decide if react to size.height to avoid mobile viewport scroll bugs

  const updateSizeAndPosition = () => {
    if (!el || !el.current) return;
    const {
      top,
      left
    } = bounds;
    const {
      top: newTop,
      left: newLeft,
      height: newHeight,
      width: newWidth
    } = el.current.getBoundingClientRect();

    if (bounds.height !== newHeight) {
      copyEl.current.style.height = newHeight + 'px';
    }

    if (bounds.width !== newWidth) {
      copyEl.current.style.width = newWidth + 'px'; // TODO adjust left position if floating from right. possible to detect?
    }

    local.offsetY = newTop - top + window.pageYOffset;
    local.offsetX = newLeft - left;
    bounds.height = newHeight;
    bounds.width = newWidth;
    prevBounds.top = -window.pageYOffset; // trigger render

    local.needUpdate = true;
    invalidate();
  }; // Update position on window resize


  useEffect(() => {
    updateSizeAndPosition();
  }, [pageReflowCompleted]); // Update position if `live` flag changes

  useEffect(() => {
    const id = requestIdleCallback(updateSizeAndPosition, {
      timeout: 100
    });
    return () => cancelIdleCallback(id);
  }, [live]); // RENDER FRAME

  const frame = ts => {
    var _getOffset, _getOffset2;

    const {
      top,
      height
    } = bounds;

    if (!local.lastFrame) {
      local.lastFrame = ts;
    }

    const frameDelta = (ts - local.lastFrame) * 0.001;
    local.lastFrame = ts; // get offset from resizing window + offset from callback function from parent

    const offsetX = local.offsetX + (live && ((_getOffset = getOffset()) === null || _getOffset === void 0 ? void 0 : _getOffset.x) || 0);
    const offsetY = local.offsetY + (live && ((_getOffset2 = getOffset()) === null || _getOffset2 === void 0 ? void 0 : _getOffset2.y) || 0); // add scroll value to bounds to get current position

    const scrollTop = -scrollY.current; // frame delta

    const deltaScroll = prevBounds.top - scrollTop;
    const delta = Math.abs(deltaScroll) + Math.abs(prevBounds.x - offsetX) + Math.abs(prevBounds.y - offsetY);

    if (!local.needUpdate && delta < config.scrollRestDelta) {
      // abort if no delta change
      return;
    } // Lerp the distance


    const lerpScroll = _lerp(prevBounds.top, scrollTop, (lerp || config.scrollLerp) * lerpOffset, frameDelta);

    const lerpX = _lerp(prevBounds.x, offsetX, layoutLerp, frameDelta);

    const lerpY = _lerp(prevBounds.y, offsetY, layoutLerp, frameDelta); // Abort if element not in screen


    const elTop = top + lerpScroll + lerpY;
    const isOffscreen = elTop + height < -100 || elTop > viewportHeight + 100; // Update DOM element position if in view, or if was in view last frame

    if (!isOffscreen) {
      if (copyEl.current) {
        Object.assign(copyEl.current.style, {
          visibility: '',
          ...style,
          transform: `translate3d(${lerpX}px, ${lerpScroll + lerpY}px, 0)`
        });
      }
    } else {
      if (copyEl.current) {
        copyEl.current.style.visibility = 'hidden';
      }
    } // store values for next frame


    prevBounds.top = lerpScroll;
    prevBounds.wasOffscreen = isOffscreen;
    prevBounds.x = lerpX;
    prevBounds.y = lerpY;
    local.needUpdate = false; // render another frame if delta is large enough

    if (!isOffscreen && delta > config.scrollRestDelta) {
      invalidate();
      local.needUpdate = true;
    }
  };

  if (!children) {
    return null;
  }

  const child = React.Children.only( /*#__PURE__*/React.cloneElement(children, {
    ref: copyEl
  }));

  if (portalEl) {
    return /*#__PURE__*/ReactDOM.createPortal(child, portalEl);
  }

  return child;
});
ScrollDomPortal.displayName = 'ScrollDomPortal';
ScrollDomPortal.propTypes = {
  el: PropTypes.object,
  // DOM element to track,
  portalEl: PropTypes.object,
  // DOM element to portal into,
  lerp: PropTypes.number,
  // Base lerp ratio
  lerpOffset: PropTypes.number,
  // Offset factor applied to `lerp`
  zIndex: PropTypes.number,
  // z-index to apply to the cloned element
  getOffset: PropTypes.func,
  // called for every frame to get {x,y} translation offset
  live: PropTypes.bool,
  layoutLerp: PropTypes.number,
  style: PropTypes.object
};

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted
 * @param {object} object THREE.js object3d
 */

const useCanvas = function (object) {
  let deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  let key = arguments.length > 2 ? arguments[2] : undefined;
  const updateCanvas = useCanvasStore(state => state.updateCanvas);
  const renderToCanvas = useCanvasStore(state => state.renderToCanvas);
  const removeFromCanvas = useCanvasStore(state => state.removeFromCanvas); // auto generate uuid v4 key

  const uniqueKey = useMemo(() => key || MathUtils.generateUUID(), []);
  useLayoutEffect(() => {
    renderToCanvas(uniqueKey, object);
    return () => removeFromCanvas(uniqueKey);
  }, deps); // return function that can set new props on the canvas component

  const set = props => {
    requestIdleCallback$1(() => updateCanvas(uniqueKey, props), {
      timeout: 100
    });
  };

  return set;
};

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

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is rendered into a GL viewport matching the DOM position for better performance
 *
 * Adapted to @react-three/fiber from https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
 * @author david@14islands.com
 */

let ViewportScrollScene = _ref => {
  let {
    el,
    lerp,
    // override global lerp. don't change if you want to stay synched with the virtual scrollbar
    lerpOffset = 1,
    // change current lerp by a factor - use this instead of `lerp`
    children,
    margin = 0,
    // Margin outside viewport to avoid clipping vertex displacement (px)
    visible = true,
    renderOrder,
    priority = config.PRIORITY_VIEWPORTS,
    debug = false,
    setInViewportProp = false,
    renderOnTop = false,
    scaleMultiplier = config.scaleMultiplier,
    // use global setting as default
    orthographic = false,
    hiddenStyle = {
      opacity: 0
    },
    resizeDelay = 0,
    ...props
  } = _ref;
  const camera = useRef();
  const [scene] = useState(() => new Scene());
  const [inViewport, setInViewport] = useState(false);
  const [scale, setScale] = useState(null);
  const {
    size,
    invalidate
  } = useThree();
  const {
    renderViewport
  } = useScrollRig();
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted);
  const [cameraDistance, setCameraDistance] = useState(0); // non-reactive state

  const transient = useRef({
    mounted: false,
    bounds: {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      inViewport: false,
      progress: 0,
      viewport: 0,
      visibility: 0
    },
    prevBounds: {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    }
  }).current; // get initial scrollY and listen for transient updates

  const scrollY = useRef(useCanvasStore.getState().scrollY);
  useEffect(() => useCanvasStore.subscribe(state => state.scrollY, y => {
    scrollY.current = y;
    invalidate(); // Trigger render on scroll
  }), []);
  useEffect(() => {
    transient.mounted = true;
    return () => {
      transient.mounted = false;
    };
  }, []); // El is rendered

  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!(el !== null && el !== void 0 && el.current)) return;

    if (debug) {
      el.current.style.opacity = 0.5;
    } else {
      Object.assign(el.current.style, { ...hiddenStyle
      });
    }

    return () => {
      if (!(el !== null && el !== void 0 && el.current)) return;
      Object.keys(hiddenStyle).forEach(key => el.current.style[key] = '');
    };
  }, [el.current]);

  const updateSizeAndPosition = () => {
    if (!el || !el.current) return;
    const {
      bounds,
      prevBounds
    } = transient;
    const {
      top,
      left,
      width,
      height
    } = el.current.getBoundingClientRect(); // pixel bounds

    bounds.top = top + window.pageYOffset;
    bounds.left = left;
    bounds.width = width;
    bounds.height = height;
    prevBounds.top = top;
    const viewportWidth = width * scaleMultiplier;
    const viewportHeight = height * scaleMultiplier; // scale in viewport units and pixel

    setScale({
      width: viewportWidth,
      height: viewportHeight,
      multiplier: scaleMultiplier,
      pixelWidth: width,
      pixelHeight: height,
      viewportWidth: size.width * scaleMultiplier,
      viewportHeight: size.height * scaleMultiplier
    });
    const cameraDistance = Math.max(viewportWidth, viewportHeight);
    setCameraDistance(cameraDistance);

    if (camera.current && !orthographic) {
      camera.current.aspect = (viewportWidth + margin * 2 * scaleMultiplier) / (viewportHeight + margin * 2 * scaleMultiplier);
      camera.current.fov = 2 * (180 / Math.PI) * Math.atan((viewportHeight + margin * 2 * scaleMultiplier) / (2 * cameraDistance));
      camera.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
      // Update matrix world since the renderer is a frame late

      camera.current.updateMatrixWorld();
    }

    invalidate(); // trigger render
  }; // Find bounding box & scale mesh on resize


  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      updateSizeAndPosition();
    }, resizeDelay);
    return () => {
      clearTimeout(timer);
    };
  }, [pageReflowCompleted]); // RENDER FRAME

  useFrame((_ref2, frameDelta) => {
    let {
      gl
    } = _ref2;
    if (!scene || !scale) return;
    const {
      bounds,
      prevBounds
    } = transient; // add scroll value to bounds to get current position

    const initialPos = config.subpixelScrolling ? bounds.top : Math.floor(bounds.top);
    const topY = initialPos - scrollY.current; // frame delta

    const delta = Math.abs(prevBounds.top - topY); // Lerp the distance to simulate easing

    const lerpTop = _lerp(prevBounds.top, topY, (lerp || config.scrollLerp) * lerpOffset, frameDelta);

    const newTop = config.subpixelScrolling ? lerpTop : Math.floor(lerpTop); // Abort if element not in screen

    const isOffscreen = newTop + bounds.height < -100 || newTop > size.height + 100; // store top value for next frame

    bounds.inViewport = !isOffscreen;
    setInViewportProp && requestIdleCallback$1(() => transient.mounted && setInViewport(!isOffscreen));
    prevBounds.top = lerpTop; // hide/show scene

    scene.visible = !isOffscreen && visible; // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas

    if (scene.visible) {
      const positiveYUpBottom = size.height - (newTop + bounds.height); // inverse Y

      renderViewport({
        gl,
        scene,
        camera: camera.current,
        left: bounds.left - margin,
        top: positiveYUpBottom - margin,
        width: bounds.width + margin * 2,
        height: bounds.height + margin * 2,
        renderOnTop
      }); // calculate progress of passing through viewport (0 = just entered, 1 = just exited)

      const pxInside = bounds.top - newTop - bounds.top + size.height;
      bounds.progress = MathUtils.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1); // percent of total visible distance

      bounds.visibility = MathUtils.mapLinear(pxInside, 0, bounds.height, 0, 1); // percent of item height in view

      bounds.viewport = MathUtils.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
    } // render another frame if delta is large enough


    if (!isOffscreen && delta > config.scrollRestDelta) {
      invalidate();
    }
  }, priority);
  return createPortal( /*#__PURE__*/React.createElement(React.Fragment, null, !orthographic && /*#__PURE__*/React.createElement("perspectiveCamera", {
    ref: camera,
    position: [0, 0, cameraDistance],
    onUpdate: self => self.updateProjectionMatrix()
  }), orthographic && /*#__PURE__*/React.createElement("orthographicCamera", {
    ref: camera,
    position: [0, 0, cameraDistance],
    onUpdate: self => self.updateProjectionMatrix(),
    left: scale.width / -2,
    right: scale.width / 2,
    top: scale.height / 2,
    bottom: scale.height / -2,
    far: cameraDistance * 2,
    near: 0.001
  }), /*#__PURE__*/React.createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && scale && /*#__PURE__*/React.createElement(DebugMesh$1, {
    scale: scale
  }), children && scene && scale && children({
    // inherited props
    el,
    lerp: lerp || config.scrollLerp,
    lerpOffset,
    margin,
    renderOrder,
    // new props
    scale,
    state: transient,
    // @deprecated
    scrollState: transient.bounds,
    scene,
    camera: camera.current,
    inViewport,
    // useFrame render priority (in case children need to run after)
    priority: config.PRIORITY_VIEWPORTS + renderOrder,
    // tunnel the rest
    ...props
  }))), scene);
};

ViewportScrollScene = /*#__PURE__*/React.memo(ViewportScrollScene);
ViewportScrollScene.childPropTypes = { ...ViewportScrollScene.propTypes,
  scale: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  }),
  state: PropTypes.shape({
    bounds: PropTypes.shape({
      left: PropTypes.number,
      top: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
      inViewport: PropTypes.bool,
      progress: PropTypes.number
    })
  }),
  scene: PropTypes.object,
  // Parent scene,
  inViewport: PropTypes.bool // {x,y} to scale

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

// if r3f frameloop should be used, pass these props:
// const R3F_HijackedScrollbar = props => {
//   return <HijackedScrollbar {...props} useUpdateLoop={addEffect} useRenderLoop={addEffect}  invalidate={invalidate} />
// }

function map_range(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

const DRAG_ACTIVE_LERP = 0.3;
const DRAG_INERTIA_LERP = 0.05;
const HijackedScrollbar = _ref => {
  let {
    children,
    disabled,
    onUpdate,
    speed = 1,
    // scroll speed
    lerp,
    // smoothness - default = 0.14
    restDelta,
    location,
    useUpdateLoop,
    // external loop for updating positions
    useRenderLoop,
    // external loop for rendering the new scroll position
    invalidate,
    // invalidate external update/render loop
    subpixelScrolling = false
  } = _ref;
  const setVirtualScrollbar = useCanvasStore(state => state.setVirtualScrollbar);
  const requestReflow = useCanvasStore(state => state.requestReflow);
  const pageReflowRequested = useCanvasStore(state => state.pageReflowRequested);
  const setScrollY = useCanvasStore(state => state.setScrollY);
  const [width, height] = useWindowSize();
  const ref = useRef();
  const y = useRef({
    current: 0,
    target: 0
  }).current;
  const roundedY = useRef(0);
  const scrolling = useRef(false);
  const preventPointer = useRef(false);
  const documentHeight = useRef(0);
  const delta = useRef(0);
  const lastFrame = useRef(0);
  const originalLerp = useMemo(() => lerp || config.scrollLerp, [lerp]); // reflow on webfont loaded to prevent misalignments

  useLayoutEffect(() => {
    if ('fonts' in document) {
      document.fonts.onloadingdone = requestReflow;
    }

    return () => {
      if ('fonts' in document) {
        document.fonts.onloadingdone = null;
      }
    };
  }, []);

  const setScrollPosition = () => {
    if (!scrolling.current) return;

    window.__origScrollTo(0, roundedY.current); // Trigger optional callback here


    onUpdate && onUpdate(y);

    if (delta.current <= (restDelta || config.scrollRestDelta)) {
      scrolling.current = false;
      preventPointerEvents(false);
    } else {
      invalidate ? invalidate() : window.requestAnimationFrame(animate);
    }
  };

  const animate = ts => {
    const frameDelta = ts - lastFrame.current;
    lastFrame.current = ts;
    if (!scrolling.current) return; // use internal target with floating point precision to make sure lerp is smooth

    const newTarget = _lerp(y.current, y.target, config.scrollLerp, frameDelta * 0.001);

    delta.current = Math.abs(y.current - newTarget);
    y.current = newTarget; // round for scrollbar

    roundedY.current = config.subpixelScrolling ? y.current : Math.floor(y.current);

    if (!useRenderLoop) {
      setScrollPosition();
    }
  };

  const scrollTo = useCallback(function (newY) {
    let lerp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : originalLerp;
    config.scrollLerp = lerp;
    y.target = Math.min(Math.max(newY, 0), documentHeight.current);

    if (!scrolling.current) {
      scrolling.current = true;
      invalidate ? invalidate() : window.requestAnimationFrame(animate);
      setTimeout(() => {
        preventPointerEvents(true);
        preventPointer.current = true;
      }, 0);
    }

    setScrollY(y.target);
  }, []); // disable pointer events while scrolling to avoid slow event handlers

  const preventPointerEvents = prevent => {
    if (ref.current) {
      ref.current.style.pointerEvents = prevent ? 'none' : '';
    }

    preventPointer.current = prevent;
  }; // reset pointer events when moving mouse


  const onMouseMove = useCallback(() => {
    if (preventPointer.current) {
      preventPointerEvents(false);
    }
  }, []); // override window.scrollTo(0, targetY) with our lerped version
  // Don't use useLayoutEffect as we want the native scrollTo to execute first and set the history position

  useEffect(() => {
    window.__origScrollTo = window.__origScrollTo || window.scrollTo;
    window.__origScroll = window.__origScroll || window.scroll;

    window.scrollTo = (x, y, lerp) => scrollTo(y, lerp);

    window.scroll = (x, y, lerp) => scrollTo(y, lerp);

    return () => {
      window.scrollTo = window.__origScrollTo;
      window.scroll = window.__origScroll;
    };
  }, [scrollTo]); // disable subpixelScrolling for better visual sync with canvas

  useLayoutEffect(() => {
    const ssBefore = config.subpixelScrolling;
    config.subpixelScrolling = subpixelScrolling;
    return () => {
      config.subpixelScrolling = ssBefore;
    };
  }, []); // Check if we are using an external update loop (like r3f)
  // update scroll target before everything else

  useEffect(() => {
    if (useUpdateLoop) {
      return useUpdateLoop(animate);
    }
  }, [useUpdateLoop]); // Check if we are using an external render loop (like r3f)
  // update scroll position last

  useEffect(() => {
    if (useRenderLoop) {
      return useRenderLoop(setScrollPosition);
    }
  }, [useRenderLoop]);
  /*
   * Called by each call to native window.scroll
   * Either as a scrollbar / key navigation event
   * Or as a result of the lerp animation
   */

  const onScrollEvent = e => {
    // If scrolling manually using keys or drag scrollbars
    if (!scrolling.current) {
      // skip lerp
      y.current = window.scrollY;
      y.target = window.scrollY; // set lerp to 1 temporarily so canvas also moves immediately

      config.scrollLerp = 1; // update internal state to we are in sync

      setScrollY(y.target);
      onUpdate && onUpdate(y);
    }
  };

  const onTouchStart = e => {
    const startY = e.touches[0].clientY;
    let deltaY = 0;
    let velY = 0;
    let lastEventTs = 0;
    let frameDelta;
    y.target = y.current;
    setScrollY(y.target);

    function calculateTouchScroll(touch) {
      const newDeltaY = touch.clientY - startY;
      frameDelta = deltaY - newDeltaY;
      deltaY = newDeltaY;
      const now = Date.now();
      const elapsed = now - lastEventTs;
      lastEventTs = now; // calculate velocity

      const v = 1000 * frameDelta / (1 + elapsed); // smooth using moving average filter (https://ariya.io/2013/11/javascript-kinetic-scrolling-part-2)

      velY = 0.1 * v + 0.9 * velY;
    }

    const onTouchMove = e => {
      e.preventDefault();
      calculateTouchScroll(e.touches[0]);
      scrollTo(y.target + frameDelta * speed, DRAG_ACTIVE_LERP);
    };

    const onTouchCancel = e => {
      e.preventDefault();
      window.removeEventListener('touchmove', onTouchMove, {
        passive: false
      });
      window.removeEventListener('touchend', onTouchEnd, {
        passive: false
      });
      window.removeEventListener('touchcancel', onTouchCancel, {
        passive: false
      });
    };

    const onTouchEnd = e => {
      window.removeEventListener('touchmove', onTouchMove, {
        passive: false
      });
      window.removeEventListener('touchend', onTouchEnd, {
        passive: false
      });
      window.removeEventListener('touchcancel', onTouchCancel, {
        passive: false
      }); // reduce velocity if took time to release finger

      const elapsed = Date.now() - lastEventTs;
      const time = Math.min(1, Math.max(0, map_range(elapsed, 0, 100, 0, 1)));
      velY = _lerp(velY, 0, time); // inertia lerp

      scrollTo(y.current + velY, DRAG_INERTIA_LERP);
    };

    window.addEventListener('touchmove', onTouchMove, {
      passive: false
    });
    window.addEventListener('touchend', onTouchEnd, {
      passive: false
    });
    window.addEventListener('touchcancel', onTouchCancel, {
      passive: false
    });
  }; // find available scroll height


  useEffect(() => {
    requestIdleCallback$1(() => {
      documentHeight.current = document.body.clientHeight - window.innerHeight;
    });
  }, [pageReflowRequested, width, height, location]);

  const onWheelEvent = e => {
    e.preventDefault();
    scrollTo(y.target + e.deltaY * speed);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('js-has-virtual-scrollbar', !disabled);
    setVirtualScrollbar(!disabled);
    if (disabled) return; // TODO use use-gesture and also handle touchmove

    window.addEventListener('wheel', onWheelEvent, {
      passive: false
    });
    window.addEventListener('scroll', onScrollEvent);
    window.addEventListener('touchstart', onTouchStart, {
      passive: false
    });
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('wheel', onWheelEvent, {
        passive: false
      });
      window.removeEventListener('scroll', onScrollEvent);
      window.removeEventListener('touchstart', onTouchStart, {
        passive: false
      });
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [disabled]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, children({
    ref
  }));
};
HijackedScrollbar.propTypes = {
  disabled: PropTypes.bool,
  onUpdate: PropTypes.func,
  speed: PropTypes.number,
  lerp: PropTypes.number,
  restDelta: PropTypes.number,
  location: PropTypes.any,
  useUpdateLoop: PropTypes.func,
  useRenderLoop: PropTypes.func,
  invalidate: PropTypes.func,
  subpixelScrolling: PropTypes.bool
};

/**
 * Public interface for ScrollRig
 */

const useScrollbar = () => {
  const hasVirtualScrollbar = useCanvasStore(state => state.hasVirtualScrollbar);
  const requestReflow = useCanvasStore(state => state.requestReflow);
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted);
  return {
    hasVirtualScrollbar,
    reflow: requestReflow,
    reflowCompleted: pageReflowCompleted
  };
};

export { GlobalCanvasIfSupported$1 as GlobalCanvas, HijackedScrollbar, ViewportScrollScene as PerspectiveCameraScene, ScrollDomPortal, ScrollScene, HijackedScrollbar as SmoothScrollbar, ViewportScrollScene, HijackedScrollbar as VirtualScrollbar, config as _config, useCanvas, useCanvasStore, useDelayedCanvas, useImgTagAsTexture, useScrollRig, useScrollbar, useTextureLoader };
