import _extends from '@babel/runtime/helpers/esm/extends';
import _objectWithoutPropertiesLoose from '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose';
import React, { useRef, useLayoutEffect, Suspense, Fragment, useMemo, useCallback, useEffect, useState, forwardRef } from 'react';
import { useThree, useFrame, Canvas, createPortal } from 'react-three-fiber';
import { ResizeObserver } from '@juggle/resize-observer';
import queryString from 'query-string';
import create from 'zustand';
import { sRGBEncoding, NoToneMapping, WebGLRenderTarget, Scene, Math as Math$1, MathUtils, ImageBitmapLoader, TextureLoader, CanvasTexture, LinearFilter, RGBFormat, RGBAFormat } from 'three';
import PropTypes from 'prop-types';
import { useViewportScroll } from 'framer-motion';
import ReactDOM from 'react-dom';
import { useWindowHeight } from '@react-hook/window-size';

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

var utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  setAllCulled: setAllCulled
});

// Transient shared state for canvas components
// usContext() causes re-rendering which can drop frames
const config = {
  debug: false,
  planeSize: 1,
  scrollLerp: 0.1,
  // Linear interpolation - high performance easing
  scrollRestDelta: 0.14,
  // min delta to trigger animation frame on scroll
  // Render priorities (highest = last render)
  PRIORITY_GLOBAL: 100,
  PRIORITY_VIEWPORTS: 10,
  PRIORITY_SCISSORS: 20,
  // Global rendering props
  globalRender: false,
  hasRenderQueue: false,
  preloadQueue: [],
  preRender: [],
  postRender: [],
  scissorQueue: [],
  viewportQueue: [],
  fbo: {},
  hasVirtualScrollbar: false,
  portalEl: null,
  // z-index for <groups>
  ORDER_TRANSITION: 6,
  ORDER_LAB_CTA: 5,
  ORDER_LAB_FG_BUBBLES: 4,
  ORDER_LAB_CONTENT: 3,
  ORDER_LAB_BG_BUBBLES: 2
};

/**
 * runtime check for requestIdleCallback
 */
const requestIdleCallback = (callback, {
  timeout = 100
} = {}) => {
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

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const [useCanvasStore, canvasStoreApi] = create(set => ({
  // //////////////////////////////////////////////////////////////////////////
  // GLOBAL ScrollRig STATE
  // //////////////////////////////////////////////////////////////////////////
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
  // global render loop is suspended internally (NOT USED)
  suspended: false,
  setSuspended: suspended => set(state => ({
    suspended
  })),
  // global render loop is paused by user action
  paused: false,
  setPaused: paused => set(state => ({
    paused
  })),
  // map of all components to render on the global canvas
  canvasChildren: {},
  // add component to canvas
  renderToCanvas: (key, mesh, props = {}) => set(({
    canvasChildren
  }) => {
    const obj = _extends({}, canvasChildren, {
      [key]: {
        mesh,
        props
      }
    });

    return {
      canvasChildren: obj
    };
  }),
  // pass new props to a canvas component
  updateCanvas: (key, newProps) => set(({
    canvasChildren
  }) => {
    if (!canvasChildren[key]) return;
    const {
      [key]: {
        mesh,
        props
      }
    } = canvasChildren;

    const obj = _extends({}, canvasChildren, {
      [key]: {
        mesh,
        props: _extends({}, props, newProps)
      }
    });

    return {
      canvasChildren: obj
    };
  }),
  // remove component from canvas
  removeFromCanvas: key => set(({
    canvasChildren
  }) => {
    const obj = _objectWithoutPropertiesLoose(canvasChildren, [key].map(_toPropertyKey)); // make a separate copy of the obj and omit


    return {
      canvasChildren: obj
    };
  }),
  // current pixel ratio
  pixelRatio: 1,
  setPixelRatio: pixelRatio => set(state => ({
    pixelRatio
  })),
  // Used to ask components to re-calculate their positions after a layout reflow
  pageReflow: 0,
  pageReflowCompleted: 0,
  requestReflow: () => {
    set(state => {
      // if VirtualScrollbar is active, it triggers `triggerReflowCompleted` instead
      if (!config.hasVirtualScrollbar) {
        requestIdleCallback(state.triggerReflowCompleted, {
          timeout: 100
        });
      }

      return {
        pageReflow: state.pageReflow + 1
      };
    });
  },
  triggerReflowCompleted: () => {
    set(state => ({
      pageReflowCompleted: state.pageReflowCompleted + 1
    }));
  }
}));

const renderFullscreen = (layers = [0]) => {
  config.globalRender = config.globalRender || [0];
  config.globalRender = [...config.globalRender, ...layers];
};
const renderScissor = (gl, scene, camera, left, top, width, height, layer = 0) => {
  if (!scene || !camera) return;
  config.hasRenderQueue = true;
  config.scissorQueue.push(() => {
    // console.log('SCISSOR RENDER', layer)
    gl.setScissor(left, top, width, height);
    gl.setScissorTest(true);
    camera.layers.set(layer);
    gl.clearDepth();
    gl.render(scene, camera);
    gl.render(scene, camera);
    gl.setScissorTest(false);
  });
};
const renderViewport = (gl, scene, camera, left, top, width, height, layer = 0, size) => {
  if (!scene || !camera) return;
  config.hasRenderQueue = true;
  config.viewportQueue.push(() => {
    // console.log('VIEWPORT RENDER', layer)
    gl.setViewport(left, top, width, height);
    gl.setScissor(left, top, width, height);
    gl.setScissorTest(true); // camera.layers.set(layer)

    gl.clearDepth();
    gl.render(scene, camera);
    gl.setScissorTest(false);
    gl.setViewport(0, 0, size.width, size.height);
  });
};
const preloadScene = (gl, scene, camera, layer = 0, callback) => {
  if (!scene || !camera) return;
  config.preloadQueue.push(() => {
    gl.setScissorTest(false);
    setAllCulled(scene, false);
    camera.layers.set(layer);
    gl.render(scene, camera);
    setAllCulled(scene, true);
    callback && callback();
  });
};

const useFBO = () => {
  const {
    size
  } = useThree();
  const pixelRatio = useCanvasStore(state => state.pixelRatio);
  useMemo(() => {
    const ratio = Math.min(1, Math.max(2, pixelRatio)); // contrain FBO to 1.5 pixel ratio to improve perf

    const width = size.width * ratio;
    const height = size.height * ratio;

    if (config.fboWidth === width && config.fboHeight === height) {
      return;
    }

    config.debug && console.log('=================');
    config.debug && console.log('===== INIT FBO ==', size, pixelRatio);
    config.debug && console.log('=================');
    const f = new WebGLRenderTarget(width, height, {// anisotropy: gl.capabilities.getMaxAnisotropy(), // reduce blurring at glancing angles
    });
    config.fbo = f;
    config.fboWidth = width;
    config.fboHeight = height;
  }, [size]);
};
/**
 * Global render loop to avoid double renders on the same frame
 */


const GlobalRenderer = ({
  useScrollRig,
  children
}) => {
  const scene = useRef();
  const {
    gl
  } = useThree();
  const canvasChildren = useCanvasStore(state => state.canvasChildren);
  const scrollRig = useScrollRig();
  useFBO();
  useLayoutEffect(() => {
    gl.outputEncoding = sRGBEncoding; // gl.getContext().disable(gl.getContext().DEPTH_TEST)

    gl.autoClear = false; // we do our own rendering

    gl.setClearColor(null, 0);
    gl.debug.checkShaderErrors = config.debug;
    gl.toneMapping = NoToneMapping;
  }, []); // GLOBAL RENDER LOOP

  useFrame(({
    camera,
    scene
  }) => {
    config.hasRenderQueue = false; // Render preload frames first and clear directly

    config.preloadQueue.forEach(render => render());
    if (config.preloadQueue.length) gl.clear(); // Render viewport scissors first
    // config.viewportQueue.forEach((render) => render())

    if (config.globalRender) {
      // console.log('GLOBAL RENDER')
      // run any pre-process frames
      config.preRender.forEach(render => render()); // render default layer, scene, camera

      camera.layers.disableAll();
      config.globalRender.forEach(layer => {
        camera.layers.enable(layer);
      });
      gl.clearDepth(); // render as HUD over any other renders

      gl.render(scene, camera); // run any post-render frame (additional layers etc)

      config.postRender.forEach(render => render()); // cleanup for next frame

      config.globalRender = false;
      config.preRender = [];
      config.postRender = [];
    } else {
      // console.log('GLOBAL SCISSORS')
      config.scissorQueue.forEach(render => render());
    } // Render viewport scissors last


    config.viewportQueue.forEach(render => render());
    config.preloadQueue = [];
    config.scissorQueue = [];
    config.viewportQueue = [];
  }, config.PRIORITY_GLOBAL); // render as HUD over ViewportCameraScenes

  config.debug && console.log('GlobalRenderer', Object.keys(canvasChildren).length);
  return /*#__PURE__*/React.createElement("scene", {
    ref: scene
  }, /*#__PURE__*/React.createElement(Suspense, {
    fallback: null
  }, Object.keys(canvasChildren).map((key, i) => {
    const {
      mesh,
      props
    } = canvasChildren[key];

    if (typeof mesh === 'function') {
      return /*#__PURE__*/React.createElement(Fragment, {
        key: key
      }, mesh(_extends({
        key
      }, scrollRig, props)));
    }

    return /*#__PURE__*/React.cloneElement(mesh, _extends({
      key
    }, props));
  }), children));
};

/**
 * Public interface for ScrollRig
 */

const useScrollRig = () => {
  const isCanvasAvailable = useCanvasStore(state => state.isCanvasAvailable);
  const hasVirtualScrollbar = useCanvasStore(state => state.hasVirtualScrollbar);
  const paused = useCanvasStore(state => state.paused);
  const suspended = useCanvasStore(state => state.suspended);
  const setPaused = useCanvasStore(state => state.setPaused);
  const requestReflow = useCanvasStore(state => state.requestReflow);
  const pixelRatio = useCanvasStore(state => state.pixelRatio);
  const {
    gl,
    invalidate,
    size
  } = useThree();
  const requestFrame = useCallback(() => {
    if (!paused && !suspended) {
      invalidate();
    }
  }, [paused, suspended]);

  const pause = () => {
    config.debug && console.log('GlobalRenderer.pause()');
    setPaused(true);
  };

  const resume = () => {
    config.debug && console.log('GlobalRenderer.resume()');
    setPaused(false);
    requestFrame();
  };

  return {
    isCanvasAvailable,
    hasVirtualScrollbar,
    pixelRatio,
    requestFrame,
    pause,
    resume,
    preloadScene: (...params) => preloadScene(gl, ...params),
    renderFullscreen,
    renderScissor: (...params) => renderScissor(gl, ...params),
    renderViewport: (...params) => renderViewport(gl, ...params, size),
    reflow: requestReflow
  };
};

const PerformanceMonitor = () => {
  const {
    size
  } = useThree();
  const setPixelRatio = useCanvasStore(state => state.setPixelRatio);
  useEffect(() => {
    const devicePixelRatio = window.devicePixelRatio || 1;

    if (devicePixelRatio > 1) {
      const MAX_PIXEL_RATIO = 2.5; // TODO Can we allow better resolution on more powerful computers somehow?
      // Calculate avg frame rate and lower pixelRatio on demand?

      let scale;
      scale = size.width > 1500 ? 0.9 : 1.0;
      scale = size.width > 1900 ? 0.8 : scale;
      const pixelRatio = Math.max(1.0, Math.min(MAX_PIXEL_RATIO, devicePixelRatio * scale));
      config.debug && console.info('GlobalCanvas', 'Set pixelRatio', pixelRatio);
      setPixelRatio(pixelRatio);
    }
  }, [size]);
  return null;
};

const StatsDebug = () => {
  const stats = useRef({
    calls: 0
  }).current;
  useFrame(({
    gl,
    clock
  }) => {
    gl.info.autoReset = false;
    window._gl = gl;
    const calls = gl.info.render.calls;

    if (calls !== stats.calls) {
      requestIdleCallback(() => console.log('Draw calls: ', calls));
      stats.calls = calls;
    }

    gl.info.reset();
  });
  return null;
};

/**
 * Manages Scroll rig resize events by trigger a reflow instead of individual resize listeners in each component
 * The order is carefully scripted:
 *  1. reflow() will cause VirtualScrollbar to recalculate positions
 *  2. VirtualScrollbar triggers `pageReflowCompleted`
 *  3. Canvas scroll components listen to  `pageReflowCompleted` and recalc positions
 */

const ResizeManager = ({
  useScrollRig,
  resizeOnHeight = true,
  resizeOnWebFontLoaded = true
}) => {
  const mounted = useRef(false);
  const {
    size
  } = useThree();
  const {
    reflow
  } = useScrollRig(); // The reason for not resizing on height on "mobile" is because the height changes when the URL bar disapears in the browser chrome
  // Can we base this on something better - or is there another way to avoid?

  const height = resizeOnHeight ? null : size.height; // Detect only resize events

  useEffect(() => {
    if (mounted.current) {
      reflow();
    } else {
      mounted.current = true;
    }
  }, [size.width, height]); // reflow on webfont loaded to prevent misalignments

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

const GlobalCanvas = (_ref) => {
  let {
    children,
    gl,
    resizeOnHeight
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["children", "gl", "resizeOnHeight"]);

  const pixelRatio = useCanvasStore(state => state.pixelRatio);
  const {
    size
  } = useThree();
  const cameraDistance = useMemo(() => {
    return size ? Math.max(size.width, size.height) : Math.max(window.innerWidth, window.innerHeight);
  }, [size]);
  useEffect(() => {
    const qs = queryString.parse(window.location.search); // show FPS counter?

    if (typeof qs.fps !== 'undefined') {
      const script = document.createElement('script');

      script.onload = function () {
        // eslint-disable-next-line no-undef
        const stats = new Stats();
        document.body.appendChild(stats.dom);
        window.requestAnimationFrame(function loop() {
          stats.update();
          window.requestAnimationFrame(loop);
        });
      };

      script.src = '//mrdoob.github.io/stats.js/build/stats.min.js';
      document.head.appendChild(script);
    } // show debug statements


    if (typeof qs.debug !== 'undefined') {
      config.debug = true;
    }
  }, []);
  return /*#__PURE__*/React.createElement(Canvas, _extends({
    className: "ScrollRigCanvas",
    invalidateFrameloop: true,
    gl: _extends({
      antialias: false,
      alpha: true,
      stencil: false,
      depth: false,
      powerPreference: 'high-performance',
      // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
      failIfMajorPerformanceCaveat: true,
      // skip webgl if slow device
      preserveDrawingBuffer: false,
      premultipliedAlpha: true
    }, gl),
    colorManagement: true // ACESFilmic seems incorrect for non-HDR settings - images get weird colors?
    ,
    noEvents: true,
    resize: {
      scroll: false,
      debounce: 0,
      polyfill: ResizeObserver
    } // concurrent // zustand (state mngr) is not compatible with concurrent mode yet
    ,
    orthographic: true,
    pixelRatio: pixelRatio,
    camera: {
      near: 0.1,
      far: cameraDistance * 2,
      position: [0, 0, cameraDistance]
    },
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '100vh',
      // use 100vh to avoid resize on iOS when url bar goes away
      zIndex: 1,
      // to sit on top of the page-transition-links styles
      pointerEvents: 'none',
      transform: 'translateZ(0)'
    }
  }, props), /*#__PURE__*/React.createElement(GlobalRenderer, {
    useScrollRig: useScrollRig
  }, children), config.debug && /*#__PURE__*/React.createElement(StatsDebug, null), /*#__PURE__*/React.createElement(PerformanceMonitor, null), /*#__PURE__*/React.createElement(ResizeManager, {
    resizeOnHeight: resizeOnHeight,
    useScrollRig: useScrollRig
  }));
};

const LAYER = 2;
/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is rendered into a GL viewport matching the DOM position for better performance
 *
 * Adapted to react-three-fiber from https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
 * @author david@14islands.com
 */

let PerspectiveCameraScene = (_ref) => {
  let {
    el,
    lerp = config.scrollLerp,
    lerpOffset = 0,
    children,
    margin = 0,
    // Margin outside viewport to avoid clipping vertex displacement (px)
    visible = true,
    renderOrder,
    debug = false,
    setInViewportProp = false
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["el", "lerp", "lerpOffset", "children", "margin", "visible", "renderOrder", "debug", "setInViewportProp"]);

  // const scene = useRef()
  const camera = useRef();
  const [scene] = useState(() => new Scene());
  const [inViewport, setInViewport] = useState(false);
  const [scale, setScale] = useState({
    width: 1,
    height: 1
  });
  const {
    scrollY
  } = useViewportScroll();
  const {
    size
  } = useThree();
  const {
    requestFrame,
    renderViewport
  } = useScrollRig();
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted);
  const cameraDistance = Math.max(scale.width, scale.height); // transient state

  const state = useRef({
    mounted: false,
    bounds: {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      inViewport: false,
      progress: 0,
      window: size
    },
    prevBounds: {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    }
  }).current; // Clear scene from canvas on unmount

  useEffect(() => {
    state.mounted = true;
    return () => {
      state.mounted = false; // gl.clear()
    };
  }, []); // El is rendered

  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!(el == null ? void 0 : el.current)) return;
    el.current.style.opacity = debug ? 0.5 : 0;
    return () => {
      if (!(el == null ? void 0 : el.current)) return;
      el.current.style.opacity = '';
    };
  }, [el.current]); // Trigger render on scroll

  useEffect(() => scrollY.onChange(requestFrame), []);

  const updateSizeAndPosition = () => {
    if (!el || !el.current) return;
    let {
      top,
      left,
      width,
      height
    } = el.current.getBoundingClientRect();
    width = width * 0.001;
    height = height * 0.001;
    state.bounds.top = top + window.pageYOffset;
    state.bounds.left = left;
    state.bounds.width = width * 1000;
    state.bounds.height = height * 1000;
    state.prevBounds.top = top;
    setScale({
      width,
      height
    });

    if (camera.current) {
      camera.current.aspect = (width + margin * 2) / (height + margin * 2);
      camera.current.fov = 2 * (180 / Math.PI) * Math.atan((height + margin * 2) / (2 * cameraDistance));
      camera.current.updateProjectionMatrix();
    }

    requestFrame(); // trigger render
  }; // Find bounding box & scale mesh on resize


  useLayoutEffect(() => {
    updateSizeAndPosition();
  }, [pageReflowCompleted]); // RENDER FRAME

  useFrame(() => {
    if (!scene) return;
    const {
      bounds,
      prevBounds
    } = state; // add scroll value to bounds to get current position

    const topY = bounds.top - scrollY.get(); // frame delta

    const delta = Math.abs(prevBounds.top - topY); // Lerp the distance to simulate easing

    const lerpTop = Math$1.lerp(prevBounds.top, topY, lerp + lerpOffset); // Abort if element not in screen

    const isOffscreen = lerpTop + bounds.height < -100 || lerpTop > size.height + 100; // store top value for next frame

    bounds.inViewport = !isOffscreen;
    setInViewportProp && requestIdleCallback(() => state.mounted && setInViewport(!isOffscreen));
    prevBounds.top = lerpTop; // hide/show scene

    if (isOffscreen && scene.visible) {
      scene.visible = false;
    } else if (!isOffscreen && !scene.visible) {
      scene.visible = visible;
    } // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas


    if (scene.visible) {
      const positiveYUpBottom = size.height - (lerpTop + bounds.height); // inverse Y

      renderViewport(scene, camera.current, bounds.left - margin, positiveYUpBottom - margin, bounds.width + margin * 2, bounds.height + margin * 2, LAYER); // calculate progress of passing through viewport (0 = just entered, 1 = just exited)

      const pxInside = bounds.top - lerpTop - bounds.top + size.height;
      bounds.progress = Math$1.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1); // percent of total visible distance

      bounds.visibility = Math$1.mapLinear(pxInside, 0, bounds.height, 0, 1); // percent of item height in view

      bounds.viewport = Math$1.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
    } // render another frame if delta is large enough


    if (!isOffscreen && delta > config.scrollRestDelta) {
      requestFrame();
    }
  }, config.PRIORITY_VIEWPORTS);

  const renderDebugMesh = () => /*#__PURE__*/React.createElement("mesh", null, /*#__PURE__*/React.createElement("planeBufferGeometry", {
    attach: "geometry",
    args: [scale.width, scale.height, 1, 1]
  }), /*#__PURE__*/React.createElement("meshBasicMaterial", {
    color: "pink",
    attach: "material",
    transparent: true,
    opacity: 0.5
  }));

  return createPortal( /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("perspectiveCamera", {
    ref: camera,
    position: [0, 0, cameraDistance],
    onUpdate: self => self.updateProjectionMatrix()
  }), /*#__PURE__*/React.createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && renderDebugMesh(), children && children(_extends({
    // inherited props
    el,
    lerp,
    lerpOffset,
    margin,
    visible,
    renderOrder,
    // new props
    state,
    scene,
    camera: camera.current,
    scale,
    layers: LAYER,
    inViewport
  }, props)))), scene);
};

PerspectiveCameraScene = /*#__PURE__*/React.memo(PerspectiveCameraScene);
PerspectiveCameraScene.childPropTypes = _extends({}, PerspectiveCameraScene.propTypes, {
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
  layers: PropTypes.number,
  // webglm renderer layer for child mesh
  inViewport: PropTypes.bool // {x,y} to scale

});

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned above DOM element and scissored around it for better performance (only updates pixels within that area)
 *
 * @author david@14islands.com
 */

let ScrollScene = (_ref) => {
  let {
    el,
    lerp = config.scrollLerp,
    lerpOffset = 0,
    children,
    renderOrder,
    margin = 14,
    // Margin outside viewport to avoid clipping vertex displacement (px)
    inViewportMargin,
    // Margin outside viewport to avoid clipping vertex displacement (px)
    visible = true,
    layoutOffset = () => {},
    layoutLerp = 0.1,
    scissor = true,
    debug = false,
    softDirection = false,
    // experimental
    setInViewportProp = false,
    updateLayout = 0
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["el", "lerp", "lerpOffset", "children", "renderOrder", "margin", "inViewportMargin", "visible", "layoutOffset", "layoutLerp", "scissor", "debug", "softDirection", "setInViewportProp", "updateLayout"]);

  const scene = useRef();
  const group = useRef();
  const [inViewport, setInViewport] = useState(false);
  const [scale, setScale] = useState({
    width: 1,
    height: 1
  });
  const {
    scrollY
  } = useViewportScroll();
  const {
    size
  } = useThree();
  const {
    requestFrame,
    renderScissor,
    renderFullscreen
  } = useScrollRig();
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted); // transient state

  const state = useRef({
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
      visibility: 0,
      window: size,
      velocity: 0
    },
    prevBounds: {
      y: 0,
      x: 0,
      direction: 1,
      directionTime: 0
    }
  }).current;
  useEffect(() => {
    state.mounted = true;
    return () => state.mounted = false;
  }, []); // set ref on intersection observer

  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!(el == null ? void 0 : el.current)) return;
    el.current.style.opacity = debug ? 0.5 : 0;
    return () => {
      if (!(el == null ? void 0 : el.current)) return;
      el.current.style.opacity = '';
    };
  }, [el.current]); // Trigger render on scroll - if close to viewport

  useEffect(() => scrollY.onChange(requestFrame), []);

  const updateSizeAndPosition = () => {
    if (!el || !el.current) return;
    const {
      bounds,
      prevBounds
    } = state;
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
    bounds.centerOffset = size.height * 0.5 - height * 0.5;
    setScale({
      width,
      height
    });
    bounds.window = size; // place horizontally

    bounds.x = left - size.width * 0.5 + width * 0.5;
    scene.current.position.x = bounds.x; // prevents ghost lerp on first render

    if (state.isFirstRender) {
      prevBounds.y = top - bounds.centerOffset;
      prevBounds.x = bounds.x;
      state.isFirstRender = false;
    }

    requestFrame(); // trigger render
  }; // Find bounding box & scale mesh on resize


  useLayoutEffect(() => {
    updateSizeAndPosition();
  }, [pageReflowCompleted, updateLayout]); // RENDER FRAME

  useFrame(({
    gl,
    camera,
    clock
  }) => {
    var _layoutOffset, _layoutOffset2;

    const {
      bounds,
      prevBounds
    } = state; // const clockDelta = clock.getDelta()

    const time = clock.getElapsedTime();
    const layoutOffsetX = bounds.x + (((_layoutOffset = layoutOffset(bounds)) == null ? void 0 : _layoutOffset.x) || 0);
    const layoutOffsetY = ((_layoutOffset2 = layoutOffset(bounds)) == null ? void 0 : _layoutOffset2.y) || 0; // Find new Y based on cached position and scroll

    const y = bounds.top - scrollY.get() - bounds.centerOffset + layoutOffsetY; // if previously hidden and now visible, update previous position to not get ghost easing when made visible

    if (scene.current.visible && !bounds.inViewport) {
      prevBounds.y = y;
    } // direction check


    const direction = Math.sign(scrollY.getVelocity());

    if (direction !== prevBounds.direction && direction !== 0) {
      if (bounds.inViewport) {
        prevBounds.directionTime = time;
      }

      prevBounds.direction = direction;
    } // adjust lerp if direction changed - soft change


    let yLerp = lerp;

    if (softDirection) {
      const t = Math$1.clamp(time - prevBounds.directionTime, 0, 1.0);
      yLerp = Math$1.lerp(softDirection, lerp, t);
    } // frame delta


    const delta = Math.abs(prevBounds.y - y) + Math.abs(prevBounds.x - layoutOffsetX); // Lerp the distance to simulate easing

    const lerpY = Math$1.lerp(prevBounds.y, y, yLerp + lerpOffset);
    const lerpX = Math$1.lerp(prevBounds.x, layoutOffsetX, layoutLerp); // Abort if element not in screen

    const scrollMargin = inViewportMargin || size.height * 0.33;
    const isOffscreen = lerpY + size.height * 0.5 + bounds.height * 0.5 < -scrollMargin || lerpY + size.height * 0.5 - bounds.height * 0.5 > size.height + scrollMargin; // store top value for next frame

    bounds.inViewport = !isOffscreen; // const velocity = MathUtils.clamp((prevBounds.y - lerpY) / clockDelta / 1000 / 1000 / 100, -1, 1)
    // bounds.velocity = MathUtils.lerp(bounds.velocity, velocity, 0.05)

    setInViewportProp && requestIdleCallback(() => state.mounted && setInViewport(!isOffscreen));
    prevBounds.y = lerpY;
    prevBounds.x = lerpX; // hide/show scene

    if (isOffscreen && scene.current.visible) {
      scene.current.visible = false;
    } else if (!isOffscreen && !scene.current.visible) {
      scene.current.visible = visible;
    }

    if (scene.current.visible) {
      // move scene
      scene.current.position.y = -lerpY;
      scene.current.position.x = lerpX;
      const positiveYUpBottom = size.height * 0.5 - (lerpY + bounds.height * 0.5); // inverse Y

      if (scissor) {
        // console.log('render scissor', camera.fov, bounds.left, positiveYUpBottom, bounds.width, bounds.height, margin)
        renderScissor(scene.current, camera, bounds.left - margin, positiveYUpBottom - margin, bounds.width + margin * 2, bounds.height + margin * 2);
      } else {
        renderFullscreen();
      } // calculate progress of passing through viewport (0 = just entered, 1 = just exited)


      const pxInside = bounds.top - lerpY - bounds.top + size.height - bounds.centerOffset;
      bounds.progress = Math$1.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1); // percent of total visible distance

      bounds.visibility = Math$1.mapLinear(pxInside, 0, bounds.height, 0, 1); // percent of item height in view

      bounds.viewport = Math$1.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
    } // render another frame if delta is large enough


    if (!isOffscreen && delta > config.scrollRestDelta) {
      requestFrame();
    }
  }, config.PRIORITY_SCISSORS); // Clear scene from canvas on unmount
  // useEffect(() => {
  //   return () => {
  //     gl.clear()
  //   }
  // }, [])
  // meshBasicMaterial shaders are excluded from prod build

  const renderDebugMesh = () => /*#__PURE__*/React.createElement("mesh", null, /*#__PURE__*/React.createElement("planeBufferGeometry", {
    attach: "geometry",
    args: [scale.width, scale.height, 1, 1]
  }), /*#__PURE__*/React.createElement("meshBasicMaterial", {
    color: "pink",
    attach: "material",
    transparent: true,
    opacity: 0.5
  }));

  console.log('ScrollScene', scale.width, scale.height);
  return /*#__PURE__*/React.createElement("scene", {
    ref: scene,
    visible: state.bounds.inViewport && visible
  }, /*#__PURE__*/React.createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && renderDebugMesh(), children && children(_extends({
    // inherited props
    el,
    lerp,
    lerpOffset,
    layoutLerp,
    renderOrder,
    visible,
    layoutOffset,
    margin,
    // new props
    scale,
    state,
    scene: scene.current,
    inViewport
  }, props))));
};

ScrollScene = /*#__PURE__*/React.memo(ScrollScene);
ScrollScene.childPropTypes = _extends({}, ScrollScene.propTypes, {
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
      visibility: PropTypes.number
    })
  }),
  scene: PropTypes.object,
  // Parent scene,
  inViewport: PropTypes.bool // {x,y} to scale

});

const LAYOUT_LERP = 0.1;
/**
 * Make DOM element fixed and move using useFrame so we can and match the lerp of a ScrollScene
 * The referenced DOM element will be cloned and made position:fixed. The original el is hidden.
 * @author david@14islands.com
 */

const ScrollDom = /*#__PURE__*/forwardRef(({
  el,
  appendTo,
  lerp = config.scrollLerp,
  lerpOffset = 0,
  children,
  zIndex = 0,
  getOffset = () => {},
  live = false,
  // detect new changes from the DOM (useful if aimating el position with CSS)
  layoutLerp = LAYOUT_LERP,
  // easing to apply to layout transition
  style
}, ref) => {
  const copyEl = useRef();
  const local = useRef({
    needUpdate: false,
    offsetY: 0,
    offsetX: 0
  }).current;
  const bounds = useRef({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    windowHeight: -1,
    windowWidth: -1
  }).current;
  const prevBounds = useRef({
    top: 0,
    wasOffscreen: false
  }).current;
  const {
    scrollY
  } = useViewportScroll();
  const {
    size
  } = useThree();
  const {
    requestFrame
  } = useScrollRig();
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted); // El is rendered

  useEffect(() => {
    // hide DOM element visually - leave in DOM to measure and get events
    if (!(el == null ? void 0 : el.current)) return;
    copyEl.current = el.current.cloneNode(true);
    copyEl.current.style.position = 'fixed';
    copyEl.current.style.visibility = 'visible';
    copyEl.current.style.zIndex = zIndex;
    ((appendTo == null ? void 0 : appendTo.current) || document.documentElement).appendChild(copyEl.current);
    el.current.style.visibility = 'hidden';
    ref && ref(copyEl.current);
    return () => {
      ((appendTo == null ? void 0 : appendTo.current) || document.documentElement).removeChild(copyEl.current);

      if (el && el.current) {
        el.current.style.visibility = '';
      }
    };
  }, [el.current]); // Trigger render on scroll

  useEffect(() => scrollY.onChange(() => {
    local.needUpdate = true;
    requestFrame();
  }), []); // Find initial position of proxy element on mount

  useEffect(() => {
    if (!el || !el.current) return;
    copyEl.current.className = el.current.className;
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
    local.windowWidth = size.width;
    local.windowHeight = size.height; // trigger render

    local.needUpdate = true;
    requestFrame();
  }, [el]); // TODO: decide if react to size.height to avoid mobile viewport scroll bugs
  // Update position on window resize or if `live` flag changes

  useEffect(() => {
    if (!el || !el.current) return;
    const id = requestIdleCallback(() => {
      if (!el || !el.current) return;
      const classNames = el.current.className;

      if (!classNames !== copyEl.current.className) {
        copyEl.current.className = classNames;
      }

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
      requestFrame();
    }, {
      timeout: 100
    });
    return () => cancelIdleCallback(id);
  }, [live, pageReflowCompleted]);
  useEffect(() => {
    local.needUpdate = true;
    requestFrame();
  }, [style]); // RENDER FRAME

  useFrame(({
    gl
  }) => {
    var _getOffset, _getOffset2;

    const {
      top,
      height
    } = bounds; // get offset from resizing window + offset from callback function from parent

    const offsetX = local.offsetX + (live && ((_getOffset = getOffset()) == null ? void 0 : _getOffset.x) || 0);
    const offsetY = local.offsetY + (live && ((_getOffset2 = getOffset()) == null ? void 0 : _getOffset2.y) || 0); // add scroll value to bounds to get current position

    const scrollTop = -scrollY.get(); // frame delta

    const deltaScroll = prevBounds.top - scrollTop;
    const delta = Math.abs(deltaScroll) + Math.abs(prevBounds.x - offsetX) + Math.abs(prevBounds.y - offsetY);

    if (!local.needUpdate && delta < config.scrollRestDelta) {
      // abort if no delta change
      return;
    } // parallax position
    // const progress = MathUtils.lerp(1, -1, MathUtils.clamp((size.height - scrollTop) / (size.height + height), 0, 1))
    // const offset = transform(progress, [1, 0, -1], [0, 0, 400])
    // scrollTop += offset
    // Lerp the distance to simulate easing


    const lerpScroll = Math$1.lerp(prevBounds.top, scrollTop, lerp + lerpOffset);
    const lerpX = Math$1.lerp(prevBounds.x, offsetX, layoutLerp);
    const lerpY = Math$1.lerp(prevBounds.y, offsetY, layoutLerp); // Abort if element not in screen

    const elTop = top + lerpScroll + lerpY;
    const isOffscreen = elTop + height < -100 || elTop > size.height + 100; // Update DOM element position if in view, or if was in view last frame

    if (!isOffscreen) {
      if (copyEl.current) {
        Object.assign(copyEl.current.style, _extends({
          visibility: ''
        }, style, {
          transform: "translate3d(" + lerpX + "px, " + (lerpScroll + lerpY) + "px, 0)"
        }));
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
      requestFrame();
      local.needUpdate = true;
    }
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null);
});
ScrollDom.displayName = 'ScrollDom';
ScrollDom.propTypes = {
  el: PropTypes.object,
  // DOM element to track,
  lerp: PropTypes.number,
  // Base lerp ratio
  lerpOffset: PropTypes.number,
  // Offset applied to `lerp`
  zIndex: PropTypes.number,
  // z-index to apply to the cloned element
  getOffset: PropTypes.func,
  // called for every frame to get {x,y} translation offset
  appendTo: PropTypes.any,
  live: PropTypes.bool,
  layoutLerp: PropTypes.number,
  style: PropTypes.object
};

const LAYOUT_LERP$1 = 0.1;
/**
 * Render child element in portal and move using useFrame so we can and match the lerp of the VirtualScrollbar
 * TThe original el used for position
 * @author david@14islands.com
 */

const ScrollDomPortal = /*#__PURE__*/forwardRef(({
  el,
  lerp = config.scrollLerp,
  lerpOffset = 0,
  children,
  zIndex = 0,
  getOffset = () => {},
  live = false,
  // detect new changes from the DOM (useful if aimating el position with CSS)
  layoutLerp = LAYOUT_LERP$1,
  // easing to apply to layout transition
  style
}, ref) => {
  const copyEl = useRef();
  const local = useRef({
    needUpdate: false,
    offsetY: 0,
    offsetX: 0,
    raf: -1
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
  const {
    scrollY
  } = useViewportScroll();
  const viewportHeight = useWindowHeight();
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted);

  const requestFrame = () => {
    window.cancelAnimationFrame(local.raf);
    local.raf = window.requestAnimationFrame(frame);
  }; // Trigger render on scroll


  useEffect(() => scrollY.onChange(() => {
    local.needUpdate = true;
    requestFrame();
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
    requestFrame();
  }, [el]); // TODO: decide if react to size.height to avoid mobile viewport scroll bugs
  // Update position on window resize or if `live` flag changes

  useEffect(() => {
    if (!el || !el.current) return;
    const id = requestIdleCallback(() => {
      if (!el || !el.current) return; // const classNames = el.current.className
      // if (!classNames !== copyEl.current.className) {
      //   copyEl.current.className = classNames
      // }

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
      requestFrame();
    }, {
      timeout: 100
    });
    return () => cancelIdleCallback(id);
  }, [live, pageReflowCompleted]); // RENDER FRAME

  const frame = ({
    gl
  }) => {
    var _getOffset, _getOffset2;

    const {
      top,
      height
    } = bounds; // get offset from resizing window + offset from callback function from parent

    const offsetX = local.offsetX + (live && ((_getOffset = getOffset()) == null ? void 0 : _getOffset.x) || 0);
    const offsetY = local.offsetY + (live && ((_getOffset2 = getOffset()) == null ? void 0 : _getOffset2.y) || 0); // add scroll value to bounds to get current position

    const scrollTop = -scrollY.get(); // frame delta

    const deltaScroll = prevBounds.top - scrollTop;
    const delta = Math.abs(deltaScroll) + Math.abs(prevBounds.x - offsetX) + Math.abs(prevBounds.y - offsetY);

    if (!local.needUpdate && delta < config.scrollRestDelta) {
      // abort if no delta change
      return;
    } // parallax position
    // const progress = MathUtils.lerp(1, -1, MathUtils.clamp((size.height - scrollTop) / (size.height + height), 0, 1))
    // const offset = transform(progress, [1, 0, -1], [0, 0, 400])
    // scrollTop += offset
    // Lerp the distance to simulate easing


    const lerpScroll = Math$1.lerp(prevBounds.top, scrollTop, lerp + lerpOffset);
    const lerpX = Math$1.lerp(prevBounds.x, offsetX, layoutLerp);
    const lerpY = Math$1.lerp(prevBounds.y, offsetY, layoutLerp); // Abort if element not in screen

    const elTop = top + lerpScroll + lerpY;
    const isOffscreen = elTop + height < -100 || elTop > viewportHeight + 100; // Update DOM element position if in view, or if was in view last frame

    if (!isOffscreen) {
      if (copyEl.current) {
        Object.assign(copyEl.current.style, _extends({
          visibility: ''
        }, style, {
          transform: "translate3d(" + lerpX + "px, " + (lerpScroll + lerpY) + "px, 0)"
        }));
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
      requestFrame();
      local.needUpdate = true;
    }
  };

  if (children) {
    const child = React.Children.only( /*#__PURE__*/React.cloneElement(children, {
      ref: copyEl
    }));
    return /*#__PURE__*/ReactDOM.createPortal(child, config.portalEl);
  }

  return null;
});
ScrollDomPortal.displayName = 'ScrollDomPortal';
ScrollDomPortal.propTypes = {
  el: PropTypes.object,
  // DOM element to track,
  lerp: PropTypes.number,
  // Base lerp ratio
  lerpOffset: PropTypes.number,
  // Offset applied to `lerp`
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

const useCanvas = (object, deps = [], key) => {
  const updateCanvas = useCanvasStore(state => state.updateCanvas);
  const renderToCanvas = useCanvasStore(state => state.renderToCanvas);
  const removeFromCanvas = useCanvasStore(state => state.removeFromCanvas); // auto generate uuid v4 key

  const uniqueKey = useMemo(() => key || MathUtils.generateUUID(), []);
  useLayoutEffect(() => {
    renderToCanvas(uniqueKey, object);
    return () => removeFromCanvas(uniqueKey);
  }, deps); // return function that can set new props on the canvas component

  const set = props => {
    requestIdleCallback(() => updateCanvas(uniqueKey, props), {
      timeout: 100
    });
  };

  return set;
};

const useDelayedEffect = (fn, deps, ms = 0) => {
  let timer;
  useEffect(() => {
    timer = setTimeout(fn, ms);
    return () => clearTimeout(timer);
  }, deps);
};

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted after initial delay (ms)
 * @param {object} object THREE.js object3d
 */

const useDelayedCanvas = (object, ms, deps = [], key) => {
  const updateCanvas = useCanvasStore(state => state.updateCanvas);
  const renderToCanvas = useCanvasStore(state => state.renderToCanvas);
  const removeFromCanvas = useCanvasStore(state => state.removeFromCanvas); // auto generate uuid v4 key

  const uniqueKey = useMemo(() => key || MathUtils.generateUUID(), []); // remove on unmount

  useLayoutEffect(() => {
    return () => removeFromCanvas(uniqueKey);
  }, []);
  useDelayedEffect(() => {
    renderToCanvas(uniqueKey, object);
  }, deps, ms); // return function that can set new props on the canvas component

  const set = props => {
    requestIdleCallback(() => updateCanvas(uniqueKey, props), {
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

const useImageBitmap = typeof createImageBitmap !== 'undefined' && /Firefox/.test(navigator.userAgent) === false; // Override fetch to prefer cached images by default

if (typeof window !== 'undefined') {
  const realFetch = window.fetch;

  window.fetch = (url, options = {
    cache: 'force-cache'
  }, ...args) => realFetch(url, options, ...args);
}

function isPowerOfTwo(dimensions = {
  width: -1,
  height: -1
}) {
  return Math$1.isPowerOfTwo(dimensions.width) && Math$1.isPowerOfTwo(dimensions.height);
}

const useTextureLoader = (url, dimensions, {
  disableMipmaps = false
} = {}) => {
  const [texture, setTexture] = useState();
  const [imageBitmap, setImageBitmap] = useState();
  const {
    gl
  } = useThree();
  const disposeBitmap = useCallback(() => {
    if (imageBitmap && imageBitmap.close) {
      imageBitmap.close();
      setImageBitmap(null);
    }
  }, [imageBitmap]);

  const loadTexture = url => {
    let loader;

    if (useImageBitmap) {
      loader = new ImageBitmapLoader(); // Flip if texture is powerOf2

      if (!isPowerOfTwo(dimensions)) {
        loader.setOptions({
          imageOrientation: 'flipY',
          premultiplyAlpha: 'none'
        });
      }
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
const useImgTagAsTexture = (imgEl, dimensions, opts) => {
  const [url, setUrl] = useState(null);
  const [texture, disposeBitmap] = useTextureLoader(url, dimensions, opts);

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

const DEFAULT_LERP = 0.1;

function _lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

const FakeScroller = ({
  el,
  lerp = DEFAULT_LERP,
  restDelta = 1,
  scrollY = null
}) => {
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const triggerReflowCompleted = useCanvasStore(state => state.triggerReflowCompleted);
  const heightEl = useRef();
  const [fakeHeight, setFakeHeight] = useState();
  const state = useRef({
    preventPointer: false,
    total: 0,
    scroll: {
      target: 0,
      current: 0,
      lerp,
      direction: 0,
      velocity: 0
    },
    bounds: {
      height: window.innerHeight,
      scrollHeight: 0,
      threshold: 100
    },
    isResizing: false,
    sectionEls: null,
    sections: null
  }).current; // ANIMATION LOOP

  const run = () => {
    state.frame = window.requestAnimationFrame(run);
    const {
      scroll
    } = state;
    scroll.current = _lerp(scroll.current, scroll.target, scroll.lerp);
    const delta = scroll.current - scroll.target;
    scroll.velocity = Math.abs(delta);
    scroll.direction = Math.sign(delta);
    transformSections(); // stop animation if delta is low

    if (scroll.velocity < restDelta) {
      window.cancelAnimationFrame(state.frame);
      state.frame = null; // el.current && el.current.classList.remove('is-scrolling')

      preventPointerEvents(false);
    }
  };

  const transformSections = () => {
    const {
      total,
      isResizing,
      scroll,
      sections
    } = state;
    const translate = "translate3d(0, " + -scroll.current + "px, 0)";
    if (!sections) return;

    for (let i = 0; i < total; i++) {
      const data = sections[i];
      const {
        el,
        bounds
      } = data;

      if (isVisible(bounds) || isResizing) {
        Object.assign(data, {
          out: false
        });
        el.style.transform = translate;
      } else if (!data.out) {
        Object.assign(data, {
          out: true
        });
        el.style.transform = translate;
      }
    }
  };

  const isVisible = bounds => {
    const {
      height,
      threshold
    } = state.bounds;
    const {
      current
    } = state.scroll;
    const {
      top,
      bottom
    } = bounds;
    const start = top - current;
    const end = bottom - current;
    const isVisible = start < threshold + height && end > -threshold;
    return isVisible;
  };

  const getSections = () => {
    if (!state.sectionEls) return;
    state.sections = [];
    state.sectionEls.forEach(el => {
      el.style.transform = 'translate3d(0, 0, 0)'; // FF complains that we exceed the budget for willChange and will ignore the rest
      // Testing to remove this to see if it speeds up other things
      // el.style.willChange = 'transform'

      const {
        top,
        bottom
      } = el.getBoundingClientRect();
      state.sections.push({
        el,
        bounds: {
          top,
          bottom
        },
        out: true
      });
    });
  }; // disable pointer events while scrolling to avoid slow event handlers


  const preventPointerEvents = prevent => {
    if (el.current) {
      el.current.style.pointerEvents = prevent ? 'none' : '';
    }

    state.preventPointer = prevent;
  };

  const onScroll = val => {
    // check if use with scroll wrapper or native scroll event
    state.scroll.target = scrollY ? val : window.pageYOffset; // restart animation loop if needed

    if (!state.frame && !state.isResizing) {
      state.frame = window.requestAnimationFrame(run);
    }

    if (!state.preventPointer && state.scroll.velocity > 100) {
      setTimeout(() => {
        // el.current && el.current.classList.add('is-scrolling')
        state.preventPointer = true;
        preventPointerEvents(true);
      }, 0);
    }
  }; // reset pointer events when moving mouse


  const onMouseMove = () => {
    if (state.preventPointer) {
      preventPointerEvents(false);
    }
  }; // Bind mouse event


  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []); // Bind scroll event

  useEffect(() => {
    if (scrollY) {
      return scrollY.onChange(onScroll);
    } else {
      window.addEventListener('scroll', onScroll);
      return () => window.removeEventListener('scroll', onScroll);
    }
  }, []);
  useEffect(() => {
    if (el.current) {
      state.sectionEls = Array.from(el.current.children);
      state.total = state.sectionEls.length;
      getSections();
    } // reset on umount


    return () => {
      const {
        sections
      } = state;

      if (sections) {
        sections.forEach(({
          el,
          bounds
        }) => {
          el.style.transform = '';
        });
        state.sections = null;
      }
    };
  }, [el.current]); // RESIZE calculate fake height and move elemnts into place

  const handleResize = () => {
    const {
      total,
      bounds,
      sections,
      scroll
    } = state;
    state.isResizing = true;
    bounds.height = window.innerHeight; // move els back into place and measure their offset

    if (sections) {
      sections.forEach(({
        el,
        bounds
      }) => {
        el.style.transform = 'translate3d(0, 0, 0)';
        const {
          top,
          bottom
        } = el.getBoundingClientRect();
        bounds.top = top;
        bounds.bottom = bottom;
      });
    } // set viewport height and fake document height


    const {
      bottom
    } = state.sectionEls[total - 1].getBoundingClientRect();
    bounds.scrollHeight = bottom; // update fake height

    setFakeHeight(bounds.scrollHeight + "px");
    setTimeout(() => {
      // get new scroll position (changes if window height became smaller)
      scroll.current = window.pageYOffset; // move all items into place

      transformSections(); // notify canvas components to refresh positions

      triggerReflowCompleted();
      state.isResizing = false;
    }, 0);
  };

  useEffect(() => {
    handleResize();
  }, [pageReflow]);
  return /*#__PURE__*/React.createElement("div", {
    className: "js-fake-scroll",
    ref: heightEl,
    style: {
      height: fakeHeight
    }
  });
};

/**
 * Wrapper for virtual scrollbar
 * @param {*} param0
 */
const VirtualScrollbar = (_ref) => {
  let {
    disabled,
    children
  } = _ref,
      rest = _objectWithoutPropertiesLoose(_ref, ["disabled", "children"]);

  const ref = useRef();
  const [active, setActive] = useState(false); // FakeScroller wont trigger resize without this here.. whyyyy?
  // eslint-disable-next-line no-unused-vars

  const pageReflow = useCanvasStore(state => state.pageReflow);
  const setVirtualScrollbar = useCanvasStore(state => state.setVirtualScrollbar); // NOT SURE THIS IS NEEDED ANY LONGER
  // Make sure we are scrolled to top before measuring stuff
  // `gatsby-plugin-transition-link` scrolls back to top in a `setTimeout()` which makes it delayed

  useLayoutEffect(() => {
    // __tl_back_button_pressed is set by `gatsby-plugin-transition-link`
    if (!window.__tl_back_button_pressed) {
      // make sure we start at top if scrollbar is active (transition)
      !disabled && window.scrollTo(0, 0);
    }
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('js-has-virtual-scrollbar', !disabled);
    setVirtualScrollbar(!disabled); // allow webgl components to find positions first on page load

    const timer = setTimeout(() => {
      setActive(!disabled); // tell GlobalCanvas that VirtualScrollbar is active

      config.hasVirtualScrollbar = !disabled;
    }, 0);
    return () => clearTimeout(timer);
  }, [disabled]);
  const activeStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%' // overflow: 'hidden',  // prevents tabbing to links in Chrome

  };
  const style = active ? activeStyle : {};
  return /*#__PURE__*/React.createElement(React.Fragment, null, children({
    ref,
    style
  }), active && /*#__PURE__*/React.createElement(FakeScroller, _extends({
    el: ref
  }, rest)));
};

export { GlobalCanvas, PerspectiveCameraScene, ScrollDom, ScrollDomPortal, ScrollScene, VirtualScrollbar, canvasStoreApi, config, useCanvas, useCanvasStore, useDelayedCanvas, useImgTagAsTexture, useScrollRig, useTextureLoader, utils };
