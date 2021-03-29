import _extends from '@babel/runtime/helpers/esm/extends';
import _objectWithoutPropertiesLoose from '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose';
import React, { useState, useEffect, useRef, useLayoutEffect, Suspense, Fragment, forwardRef, useMemo, useCallback } from 'react';
import { addEffect, addAfterEffect, invalidate, useThree, useFrame, useUpdate, Canvas, extend, createPortal } from 'react-three-fiber';
import { Vector2, NoToneMapping, Color, Scene, MathUtils, ImageBitmapLoader, TextureLoader, CanvasTexture, sRGBEncoding, LinearFilter, RGBFormat, RGBAFormat } from 'three';
import { ResizeObserver } from '@juggle/resize-observer';
import queryString from 'query-string';
import StatsImpl from 'three/examples/js/libs/stats.min';
import create from 'zustand';
import { useWindowSize, useWindowHeight } from '@react-hook/window-size';
import mergeRefs from 'react-merge-refs';
import { config as config$1, useScrollRig as useScrollRig$1 } from '@14islands/r3f-scroll-rig';
import PropTypes from 'prop-types';
import { shaderMaterial } from '@react-three/drei/core/shaderMaterial';
import ReactDOM from 'react-dom';

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
  globalRender: false,
  preloadQueue: [],
  hasVirtualScrollbar: false,
  hasGlobalCanvas: false
};

/* Copied from drei - no need to import just for this */

function Stats({
  showPanel = 0,
  className,
  parent
}) {
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
  pageReflowRequested: 0,
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
}));

const viewportSize = new Vector2(); // Flag that we need global rendering (full screen)

const requestRender = (layers = [0]) => {
  config.globalRender = config.globalRender || [0];
  config.globalRender = [...config.globalRender, ...layers];
};
const renderScissor = ({
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
}) => {
  if (!scene || !camera) return;
  gl.autoClear = autoClear;
  gl.setScissor(left, top, width, height);
  gl.setScissorTest(true);
  camera.layers.set(layer);
  clearDepth && gl.clearDepth();
  gl.render(scene, camera);
  gl.setScissorTest(false);
};
const renderViewport = ({
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
}) => {
  if (!scene || !camera) return;
  gl.getSize(viewportSize);
  gl.autoClear = autoClear;
  gl.setViewport(left, top, width, height);
  gl.setScissor(left, top, width, height);
  gl.setScissorTest(true);
  camera.layers.set(layer);
  clearDepth && gl.clearDepth();
  gl.render(scene, camera);
  gl.setScissorTest(false);
  gl.setViewport(0, 0, viewportSize.x, viewportSize.y);
};
const preloadScene = (scene, camera, layer = 0, callback) => {
  if (!scene || !camera) return;
  config.preloadQueue.push(gl => {
    gl.setScissorTest(false);
    setAllCulled(scene, false);
    camera.layers.set(layer);
    gl.render(scene, camera);
    setAllCulled(scene, true);
    callback && callback();
  });
};

/**
 * Public interface for ScrollRig
 */

const useScrollRig = () => {
  const isCanvasAvailable = useCanvasStore(state => state.isCanvasAvailable);
  const hasVirtualScrollbar = useCanvasStore(state => state.hasVirtualScrollbar);
  const requestReflow = useCanvasStore(state => state.requestReflow);
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted);
  const pixelRatio = useCanvasStore(state => state.pixelRatio);
  return {
    isCanvasAvailable,
    hasVirtualScrollbar,
    pixelRatio,
    invalidate,
    preloadScene,
    requestRender,
    renderScissor,
    renderViewport,
    reflow: requestReflow,
    reflowCompleted: pageReflowCompleted
  };
};

/**
 * Global render loop to avoid double renders on the same frame
 */

const GlobalRenderer = ({
  children
}) => {
  const scene = useRef();
  const {
    gl
  } = useThree();
  const canvasChildren = useCanvasStore(state => state.canvasChildren);
  const scrollRig = useScrollRig();
  useLayoutEffect(() => {
    gl.debug.checkShaderErrors = config.debug;
  }, []); // PRELOAD RENDER LOOP

  useFrame(({
    camera,
    scene
  }) => {
    gl.autoClear = false; // Render preload frames first and clear directly

    config.preloadQueue.forEach(render => render(gl));
    if (config.preloadQueue.length) gl.clear(); // cleanup

    config.preloadQueue = [];
  }, config.PRIORITY_PRELOAD); // GLOBAL RENDER LOOP

  useFrame(({
    camera,
    scene
  }) => {
    // Global render pass
    if (config.globalRender) {
      gl.autoClear = false; // will fail in VR
      // render default layer, scene, camera

      camera.layers.disableAll();
      config.globalRender.forEach(layer => {
        camera.layers.enable(layer);
      });
      gl.clearDepth(); // render as HUD over any other renders

      gl.render(scene, camera); // cleanup for next frame

      config.globalRender = false;
      gl.autoClear = true;
    }
  }, config.PRIORITY_GLOBAL); // Take over rendering

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
      // scale down when scrolling fast?

      let scale;
      scale = size.width > 1500 ? 0.9 : 1.0;
      scale = size.width > 1900 ? 0.8 : scale;
      const pixelRatio = Math.max(1.0, Math.min(MAX_PIXEL_RATIO, devicePixelRatio * scale));
      config.debug && console.info('PerformanceMonitor', 'Set pixelRatio', pixelRatio);
      setPixelRatio(pixelRatio);
    }
  }, [size]);
  return null;
};

const StatsDebug = ({
  render = true,
  memory = true
}) => {
  const stats = useRef({
    calls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0
  }).current;
  useFrame(({
    gl,
    clock
  }) => {
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

/**
 * Manages Scroll rig resize events by trigger a reflow instead of individual resize listeners in each component
 * The order is carefully scripted:
 *  1. reflow() will cause VirtualScrollbar to recalculate positions
 *  2. VirtualScrollbar triggers `pageReflowCompleted`
 *  3. Canvas scroll components listen to  `pageReflowCompleted` and recalc positions
 */

const ResizeManager = ({
  reflow,
  resizeOnHeight = true,
  resizeOnWebFontLoaded = true
}) => {
  const mounted = useRef(false); // must be debounced more than the GlobalCanvas so all components have the correct value from useThree({ size })

  const [windowWidth, windowHeight] = useWindowSize({
    wait: 300
  }); // The reason for not resizing on height on "mobile" is because the height changes when the URL bar disapears in the browser chrome
  // Can we base this on something better - or is there another way to avoid?

  const height = resizeOnHeight ? windowHeight : null; // Detect only resize events

  useEffect(() => {
    if (mounted.current) {
      config.debug && console.log('ResizeManager', 'reflow()');
      reflow();
    } else {
      mounted.current = true;
    }
  }, [windowWidth, height]); // reflow on webfont loaded to prevent misalignments

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

const PerspectiveCamera = /*#__PURE__*/forwardRef((_ref, ref) => {
  let {
    makeDefault = false,
    scaleMultiplier = config$1.scaleMultiplier
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["makeDefault", "scaleMultiplier"]);

  const {
    setDefaultCamera,
    camera,
    size
  } = useThree();
  const {
    reflowCompleted
  } = useScrollRig$1();
  const distance = useMemo(() => {
    const width = size.width * scaleMultiplier;
    const height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, reflowCompleted, scaleMultiplier]);
  const cameraRef = useUpdate(cam => {
    const width = size.width * scaleMultiplier;
    const height = size.height * scaleMultiplier;
    cam.aspect = width / height;
    cam.near = 0.1;
    cam.far = distance * 2;
    cam.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance));
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix(); // https://github.com/react-spring/react-three-fiber/issues/178
    // Update matrix world since the renderer is a frame late

    cam.updateMatrixWorld();
  }, [distance, size]);
  useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera;
      setDefaultCamera(cameraRef.current);
      return () => setDefaultCamera(oldCam);
    }
  }, [camera, cameraRef, makeDefault, setDefaultCamera]);
  return /*#__PURE__*/React.createElement("perspectiveCamera", _extends({
    ref: mergeRefs([cameraRef, ref]),
    position: [0, 0, distance],
    onUpdate: self => self.updateProjectionMatrix()
  }, props));
});
PerspectiveCamera.displayName = 'PerspectiveCamera';

const OrthographicCamera = /*#__PURE__*/forwardRef((_ref, ref) => {
  let {
    makeDefault = false,
    scaleMultiplier = config$1.scaleMultiplier
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["makeDefault", "scaleMultiplier"]);

  const {
    setDefaultCamera,
    camera,
    size
  } = useThree();
  const {
    reflowCompleted
  } = useScrollRig$1();
  const distance = useMemo(() => {
    const width = size.width * scaleMultiplier;
    const height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, reflowCompleted, scaleMultiplier]);
  const cameraRef = useUpdate(cam => {
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix(); // https://github.com/react-spring/react-three-fiber/issues/178
    // Update matrix world since the renderer is a frame late

    cam.updateMatrixWorld();
  }, [distance, size]);
  useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera;
      setDefaultCamera(cameraRef.current);
      return () => setDefaultCamera(oldCam);
    }
  }, [camera, cameraRef, makeDefault, setDefaultCamera]);
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
    as = Canvas,
    children,
    gl,
    resizeOnHeight,
    orthographic,
    noEvents = true,
    config: confOverrides
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["as", "children", "gl", "resizeOnHeight", "orthographic", "noEvents", "config"]);

  const pixelRatio = useCanvasStore(state => state.pixelRatio);
  const requestReflow = useCanvasStore(state => state.requestReflow); // override config

  useMemo(() => {
    Object.assign(config, confOverrides);
  }, [confOverrides]); // flag that global canvas is active

  useEffect(() => {
    config.hasGlobalCanvas = true;
    return () => {
      config.hasGlobalCanvas = false;
    };
  }, []);
  useEffect(() => {
    const qs = queryString.parse(window.location.search); // show FPS counter on request

    if (typeof qs.fps !== 'undefined') {
      config.fps = true;
    } // show debug statements


    if (typeof qs.debug !== 'undefined') {
      config.debug = true;
    }
  }, []);
  const CanvasElement = as;
  return /*#__PURE__*/React.createElement(CanvasElement, _extends({
    className: "ScrollRigCanvas",
    invalidateFrameloop: true,
    gl: _extends({
      antialias: true,
      alpha: true,
      depth: true,
      powerPreference: 'high-performance',
      // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
      failIfMajorPerformanceCaveat: true
    }, gl),
    colorManagement: true // ACESFilmic seems incorrect for non-HDR settings - images get weird color
    ,
    noEvents: noEvents,
    resize: {
      scroll: false,
      debounce: 0,
      polyfill: ResizeObserver
    } // concurrent // zustand (state mngr) is not compatible with concurrent mode yet
    ,
    pixelRatio: pixelRatio,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '100vh',
      // use 100vh to avoid resize on iOS when url bar goes away
      zIndex: 1,
      // to sit on top of the page-transition-links styles
      pointerEvents: noEvents ? 'none' : 'auto',
      transform: 'translateZ(0)'
    } // use our own default camera
    ,
    camera: null,
    updateDefaultCamera: false,
    onCreated: ({
      gl
    }) => {
      gl.toneMapping = NoToneMapping; // turn off tonemapping by default to provide better hex matching
    } // allow to override anything of the above

  }, props), /*#__PURE__*/React.createElement(GlobalRenderer, null, children), !orthographic && /*#__PURE__*/React.createElement(PerspectiveCamera, {
    makeDefault: true
  }), orthographic && /*#__PURE__*/React.createElement(OrthographicCamera, {
    makeDefault: true
  }), config.debug && /*#__PURE__*/React.createElement(StatsDebug, null), config.fps && /*#__PURE__*/React.createElement(Stats, null), config.autoPixelRatio && /*#__PURE__*/React.createElement(PerformanceMonitor, null), /*#__PURE__*/React.createElement(ResizeManager, {
    reflow: requestReflow,
    resizeOnHeight: resizeOnHeight
  }), /*#__PURE__*/React.createElement(DefaultScrollTracker, null));
};

const GlobalCanvasIfSupported = (_ref2) => {
  let {
    onError: _onError
  } = _ref2,
      props = _objectWithoutPropertiesLoose(_ref2, ["onError"]);

  const setCanvasAvailable = useCanvasStore(state => state.setCanvasAvailable);
  useLayoutEffect(() => {
    document.documentElement.classList.add('js-has-global-canvas');
  }, []);
  return /*#__PURE__*/React.createElement(CanvasErrorBoundary, {
    onError: err => {
      _onError && _onError(err);
      setCanvasAvailable(false);
      /* WebGL failed to init */

      document.documentElement.classList.remove('js-has-global-canvas');
      document.documentElement.classList.add('js-global-canvas-error');
    }
  }, /*#__PURE__*/React.createElement(GlobalCanvas, props));
};

const DebugMaterial = shaderMaterial({
  color: new Color(1.0, 0.0, 0.0),
  opacity: 1
}, // vertex shader
" varying vec2 vUv;\n    void main() {\n      vUv = uv;\n      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  }", // fragment shader
"\n    uniform vec3 color;\n    uniform float opacity;\n    varying vec2 vUv;\n    void main() {\n      gl_FragColor.rgba = vec4(color, opacity);\n    }\n  ");
extend({
  DebugMaterial
});
const DebugMesh = ({
  scale
}) => /*#__PURE__*/React.createElement("mesh", null, /*#__PURE__*/React.createElement("planeBufferGeometry", {
  attach: "geometry",
  args: [scale.width, scale.height, 1, 1]
}), /*#__PURE__*/React.createElement("debugMaterial", {
  color: "hotpink",
  attach: "material",
  transparent: true,
  opacity: 0.5
}));

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned and scaled exactly above DOM element
 *
 * @author david@14islands.com
 */

let ScrollScene = (_ref) => {
  let {
    el,
    lerp,
    lerpOffset = 0,
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
    }
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["el", "lerp", "lerpOffset", "children", "renderOrder", "priority", "margin", "inViewportMargin", "visible", "scissor", "debug", "setInViewportProp", "updateLayout", "positionFixed", "hiddenStyle"]);

  const inlineSceneRef = useCallback(node => {
    if (node !== null) {
      setScene(node);
    }
  }, []);
  const group = useRef();
  const [scene, setScene] = useState(scissor ? new Scene() : null);
  const [inViewport, setInViewport] = useState(false);
  const [scale, setScale] = useState(null);
  const {
    size
  } = useThree();
  const {
    invalidate,
    requestRender,
    renderScissor
  } = useScrollRig();
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted); // get initial scrollY and listen for transient updates

  const scrollY = useRef(useCanvasStore.getState().scrollY);
  useEffect(() => useCanvasStore.subscribe(y => {
    scrollY.current = y;
    invalidate(); // Trigger render on scroll
  }, state => state.scrollY), []); // non-reactive state

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
    if (!(el == null ? void 0 : el.current)) return;

    if (debug) {
      el.current.style.opacity = 0.5;
    } else {
      Object.assign(el.current.style, _extends({}, hiddenStyle));
    }

    return () => {
      if (!(el == null ? void 0 : el.current)) return;
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
    config.debug && console.log('ScrollScene', 'trigger updateSizeAndPosition()', scene);
    updateSizeAndPosition();
  }, [pageReflowCompleted, updateLayout, scene]); // RENDER FRAME

  useFrame(({
    gl,
    camera,
    clock
  }) => {
    if (!scene || !scale) return;
    const {
      bounds,
      prevBounds
    } = transient; // Find new Y based on cached position and scroll

    const initialPos = config.subpixelScrolling ? bounds.top - bounds.centerOffset : Math.floor(bounds.top - bounds.centerOffset);
    const y = initialPos - scrollY.current; // if previously hidden and now visible, update previous position to not get ghost easing when made visible

    if (scene.visible && !bounds.inViewport) {
      prevBounds.y = y;
    } // frame delta


    const delta = Math.abs(prevBounds.y - y); // Lerp the distance to simulate easing

    const lerpY = MathUtils.lerp(prevBounds.y, y, (lerp || config.scrollLerp) + lerpOffset);
    const newY = config.subpixelScrolling ? lerpY : Math.floor(lerpY); // Abort if element not in screen

    const scrollMargin = inViewportMargin || size.height * 0.33;
    const isOffscreen = newY + size.height * 0.5 + scale.pixelHeight * 0.5 < -scrollMargin || newY + size.height * 0.5 - scale.pixelHeight * 0.5 > size.height + scrollMargin; // store top value for next frame

    bounds.inViewport = !isOffscreen;
    setInViewportProp && requestIdleCallback(() => transient.mounted && setInViewport(!isOffscreen));
    prevBounds.y = lerpY; // hide/show scene

    if (isOffscreen && scene.visible) {
      scene.visible = false;
    } else if (!isOffscreen && !scene.visible) {
      scene.visible = visible;
    }

    if (scene.visible) {
      // move scene
      if (!positionFixed) {
        scene.position.y = -newY * config.scaleMultiplier;
      }

      const positiveYUpBottom = size.height * 0.5 - (newY + scale.pixelHeight * 0.5); // inverse Y

      if (scissor) {
        renderScissor({
          gl,
          scene,
          camera,
          left: bounds.left - margin,
          top: positiveYUpBottom - margin,
          width: bounds.width + margin * 2,
          height: bounds.height + margin * 2
        });
      } else {
        requestRender();
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
  }, (!children || debug) && scale && /*#__PURE__*/React.createElement(DebugMesh, {
    scale: scale
  }), children && scene && scale && children(_extends({
    // inherited props
    el,
    lerp: lerp || config.scrollLerp,
    lerpOffset,
    margin,
    visible,
    renderOrder,
    // new props
    scale,
    state: transient,
    // @deprecated
    scrollState: transient.bounds,
    scene,
    inViewport,
    // useFrame render priority (in case children need to run after)
    priority: config.PRIORITY_SCISSORS + renderOrder
  }, props))); // portal if scissor or inline nested scene

  return scissor ? createPortal(content, scene) : /*#__PURE__*/React.createElement("scene", {
    ref: inlineSceneRef
  }, content);
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
      visibility: PropTypes.number,
      viewport: PropTypes.number
    })
  }),
  scene: PropTypes.object,
  // Parent scene,
  inViewport: PropTypes.bool // {x,y} to scale

});
ScrollScene.priority = config.PRIORITY_SCISSORS;

const LAYOUT_LERP = 0.1;
/**
 * Render child element in portal and move using useFrame so we can and match the lerp of the VirtualScrollbar
 * TThe original el used for position
 * @author david@14islands.com
 */

const ScrollDomPortal = /*#__PURE__*/forwardRef(({
  el,
  portalEl,
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
  const viewportHeight = useWindowHeight();
  const pageReflowCompleted = useCanvasStore(state => state.pageReflowCompleted);

  const invalidate = () => {
    window.cancelAnimationFrame(local.raf);
    local.raf = window.requestAnimationFrame(frame);
  }; // get initial scrollY and listen for transient updates


  const scrollY = useRef(useCanvasStore.getState().scrollY);
  useEffect(() => useCanvasStore.subscribe(y => {
    scrollY.current = y;
    invalidate(); // Trigger render on scroll
  }, state => state.scrollY), []); // Find initial position of proxy element on mount

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
  // Update position on window resize or if `live` flag changes

  useEffect(() => {
    if (!el || !el.current) return;
    const id = requestIdleCallback(() => {
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

    const scrollTop = -scrollY.current; // frame delta

    const deltaScroll = prevBounds.top - scrollTop;
    const delta = Math.abs(deltaScroll) + Math.abs(prevBounds.x - offsetX) + Math.abs(prevBounds.y - offsetY);

    if (!local.needUpdate && delta < config.scrollRestDelta) {
      // abort if no delta change
      return;
    } // Lerp the distance


    const lerpScroll = MathUtils.lerp(prevBounds.top, scrollTop, lerp + lerpOffset);
    const lerpX = MathUtils.lerp(prevBounds.x, offsetX, layoutLerp);
    const lerpY = MathUtils.lerp(prevBounds.y, offsetY, layoutLerp); // Abort if element not in screen

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

  window.fetch = (url, options = {
    cache: 'force-cache'
  }, ...args) => realFetch(url, options, ...args);
}

const useTextureLoader = (url, {
  disableMipmaps = false
} = {}) => {
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
 * Adapted to react-three-fiber from https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
 * @author david@14islands.com
 */

let ViewportScrollScene = (_ref) => {
  let {
    el,
    lerp,
    lerpOffset = 0,
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
    }
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["el", "lerp", "lerpOffset", "children", "margin", "visible", "renderOrder", "priority", "debug", "setInViewportProp", "renderOnTop", "scaleMultiplier", "orthographic", "hiddenStyle"]);

  const camera = useRef();
  const [scene] = useState(() => new Scene());
  const [inViewport, setInViewport] = useState(false);
  const [scale, setScale] = useState(null);
  const {
    size
  } = useThree();
  const {
    invalidate,
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
  useEffect(() => useCanvasStore.subscribe(y => {
    scrollY.current = y;
    invalidate(); // Trigger render on scroll
  }, state => state.scrollY), []);
  useEffect(() => {
    transient.mounted = true;
    return () => {
      transient.mounted = false;
    };
  }, []); // El is rendered

  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!(el == null ? void 0 : el.current)) return;

    if (debug) {
      el.current.style.opacity = 0.5;
    } else {
      Object.assign(el.current.style, _extends({}, hiddenStyle));
    }

    return () => {
      if (!(el == null ? void 0 : el.current)) return;
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
      camera.current.aspect = (viewportWidth + margin * 2) / (viewportHeight + margin * 2);
      camera.current.fov = 2 * (180 / Math.PI) * Math.atan((viewportHeight + margin * 2) / (2 * cameraDistance));
      camera.current.updateProjectionMatrix(); // https://github.com/react-spring/react-three-fiber/issues/178
      // Update matrix world since the renderer is a frame late

      camera.current.updateMatrixWorld();
    }

    invalidate(); // trigger render
  }; // Find bounding box & scale mesh on resize


  useLayoutEffect(() => {
    updateSizeAndPosition();
  }, [pageReflowCompleted]); // RENDER FRAME

  useFrame(({
    gl
  }) => {
    if (!scene || !scale) return;
    const {
      bounds,
      prevBounds
    } = transient; // add scroll value to bounds to get current position

    const initialPos = config.subpixelScrolling ? bounds.top : Math.floor(bounds.top);
    const topY = initialPos - scrollY.current; // frame delta

    const delta = Math.abs(prevBounds.top - topY); // Lerp the distance to simulate easing

    const lerpTop = MathUtils.lerp(prevBounds.top, topY, (lerp || config.scrollLerp) + lerpOffset);
    const newTop = config.subpixelScrolling ? lerpTop : Math.floor(lerpTop); // Abort if element not in screen

    const isOffscreen = newTop + bounds.height < -100 || newTop > size.height + 100; // store top value for next frame

    bounds.inViewport = !isOffscreen;
    setInViewportProp && requestIdleCallback(() => transient.mounted && setInViewport(!isOffscreen));
    prevBounds.top = lerpTop; // hide/show scene

    if (isOffscreen && scene.visible) {
      scene.visible = false;
    } else if (!isOffscreen && !scene.visible) {
      scene.visible = visible;
    } // Render scene to viewport using local camera and limit updates using scissor test
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
  }, (!children || debug) && scale && /*#__PURE__*/React.createElement(DebugMesh, {
    scale: scale
  }), children && scene && scale && children(_extends({
    // inherited props
    el,
    lerp: lerp || config.scrollLerp,
    lerpOffset,
    margin,
    visible,
    renderOrder,
    // new props
    scale,
    state: transient,
    // @deprecated
    scrollState: transient.bounds,
    transient,
    scene,
    camera: camera.current,
    inViewport,
    // useFrame render priority (in case children need to run after)
    priority: config.PRIORITY_VIEWPORTS + renderOrder
  }, props)))), scene);
};

ViewportScrollScene = /*#__PURE__*/React.memo(ViewportScrollScene);
ViewportScrollScene.childPropTypes = _extends({}, ViewportScrollScene.propTypes, {
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

});

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

// if r3f frameloop should be used, pass these props:
// const R3F_HijackedScrollbar = props => {
//   return <HijackedScrollbar {...props} useFrameLoop={addEffect} invalidate={invalidate} />
// }

function map_range(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function _lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

const DRAG_ACTIVE_LERP = 0.3;
const DRAG_INERTIA_LERP = 0.05;
const HijackedScrollbar = ({
  children,
  disabled,
  onUpdate,
  speed = 1,
  lerp,
  restDelta,
  location,
  // useFrameLoop,
  invalidate,
  subpixelScrolling = false
}) => {
  const setVirtualScrollbar = useCanvasStore(state => state.setVirtualScrollbar);
  const requestReflow = useCanvasStore(state => state.requestReflow);
  const pageReflowRequested = useCanvasStore(state => state.pageReflowRequested);
  const setScrollY = useCanvasStore(state => state.setScrollY);
  const y = useRef({
    current: 0,
    target: 0
  }).current;
  const roundedY = useRef(0);
  const scrolling = useRef(false);
  const documentHeight = useRef(0);
  const delta = useRef(0);
  const originalLerp = useRef(lerp || config.scrollLerp).current;

  const animate = ts => {
    if (!scrolling.current) return; // use internal target with floating point precision to make sure lerp is smooth

    const newTarget = _lerp(y.current, y.target, config.scrollLerp);

    delta.current = Math.abs(y.current - newTarget);
    y.current = newTarget; // round for scrollbar

    roundedY.current = config.subpixelScrolling ? y.current : Math.floor(y.current); // if (!useFrameLoop) {

    setScrollPosition(); // }
  };

  const scrollTo = (newY, lerp = originalLerp) => {
    config.scrollLerp = lerp;
    y.target = Math.min(Math.max(newY, 0), documentHeight.current);

    if (!scrolling.current) {
      scrolling.current = true;
      invalidate ? invalidate() : window.requestAnimationFrame(animate);
    }

    setScrollY(y.target);
  }; // override window.scrollTo(0, targetY)


  useEffect(() => {
    window.__origScrollTo = window.scrollTo;
    window.__origScroll = window.scroll;

    window.scrollTo = (x, y, lerp) => scrollTo(y, lerp);

    window.scroll = (x, y, lerp) => scrollTo(y, lerp);

    return () => {
      window.scrollTo = window.__origScrollTo;
      window.scroll = window.__origScroll;
    };
  }, [pageReflowRequested, location]);

  const setScrollPosition = () => {
    if (!scrolling.current) return;

    window.__origScrollTo(0, roundedY.current); // Trigger optional callback here


    onUpdate && onUpdate(y); // TODO set scrolling.current = false here instead to avoid trailing scroll event

    if (delta.current <= (restDelta || config.scrollRestDelta)) {
      scrolling.current = false;
    } else {
      invalidate ? invalidate() : window.requestAnimationFrame(animate);
    }
  }; // update scroll position last
  // useEffect(() => {
  //   if (useFrameLoop) {
  //     return addAfterEffect(setScrollPosition)
  //   }
  // }, [])
  // disable subpixelScrolling for better visual sync with canvas


  useEffect(() => {
    const ssBefore = config.subpixelScrolling;
    config.subpixelScrolling = subpixelScrolling;
    return () => {
      config.subpixelScrolling = ssBefore;
    };
  }, []); // reset scroll on mount/unmount FIX history?!

  useEffect(() => {
    setScrollY(window.pageYOffset);
    return () => {
      setScrollY(window.pageYOffset);
    };
  }, []); // Check if we are using an external frame loop
  // useEffect(() => {
  //   if (useFrameLoop) {
  //     // update scroll target before everything else
  //     return useFrameLoop(animate)
  //   }
  // }, [useFrameLoop])

  const onScrollEvent = e => {
    e.preventDefault(); // Scroll manually using keys or drag scrollbars

    if (!scrolling.current) {
      y.current = window.scrollY;
      y.target = window.scrollY; // set lerp to 1 temporarily so stuff moves immediately
      // if (!config._scrollLerp) {
      //   config._scrollLerp = config.scrollLerp
      // }
      // config.scrollLerp = 1

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
    requestIdleCallback(() => {
      documentHeight.current = document.body.clientHeight - window.innerHeight;
    });
  }, [pageReflowRequested, location]);

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
    return () => {
      window.removeEventListener('wheel', onWheelEvent, {
        passive: false
      });
      window.removeEventListener('scroll', onScrollEvent);
      window.removeEventListener('touchstart', onTouchStart, {
        passive: false
      });
    };
  }, [disabled]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, children({}), !config.hasGlobalCanvas && /*#__PURE__*/React.createElement(ResizeManager, {
    reflow: requestReflow
  }));
};

function _lerp$1(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

const FakeScroller = ({
  el,
  lerp = config.scrollLerp,
  restDelta = config.scrollRestDelta,
  onUpdate,
  threshold = 100
}) => {
  const pageReflowRequested = useCanvasStore(state => state.pageReflowRequested);
  const triggerReflowCompleted = useCanvasStore(state => state.triggerReflowCompleted);
  const setScrollY = useCanvasStore(state => state.setScrollY);
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
      scrollHeight: 0
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
    scroll.current = _lerp$1(scroll.current, scroll.target, scroll.lerp);
    const delta = scroll.current - scroll.target;
    scroll.velocity = Math.abs(delta); // TODO fps independent velocity

    scroll.direction = Math.sign(delta);
    transformSections(); // update callback

    onUpdate && onUpdate(scroll); // stop animation if delta is low

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
      height
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
    state.scroll.target = window.pageYOffset;
    setScrollY(state.scroll.target); // restart animation loop if needed

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
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
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
  }, [pageReflowRequested]);
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
    resizeOnHeight,
    children,
    scrollToTop = false
  } = _ref,
      rest = _objectWithoutPropertiesLoose(_ref, ["disabled", "resizeOnHeight", "children", "scrollToTop"]);

  const ref = useRef();
  const [active, setActive] = useState(false); // FakeScroller wont trigger resize without touching the store here..
  // due to code splitting maybe? two instances of the store?

  const requestReflow = useCanvasStore(state => state.requestReflow);
  const setVirtualScrollbar = useCanvasStore(state => state.setVirtualScrollbar); // Optional: scroll to top when scrollbar mounts

  useLayoutEffect(() => {
    if (!scrollToTop) return; // __tl_back_button_pressed is set by `gatsby-plugin-transition-link`

    if (!window.__tl_back_button_pressed) {
      // make sure we start at top if scrollbar is active (transition)
      !disabled && window.scrollTo(0, 0);
    }
  }, [scrollToTop, disabled]);
  useEffect(() => {
    document.documentElement.classList.toggle('js-has-virtual-scrollbar', !disabled);
    setVirtualScrollbar(!disabled); // allow webgl components to find positions first on page load

    const timer = setTimeout(() => {
      setActive(!disabled); // tell GlobalCanvas that VirtualScrollbar is active

      config.hasVirtualScrollbar = !disabled;
    }, 0);
    return () => {
      clearTimeout(timer);
      config.hasVirtualScrollbar = false;
    };
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
  }, rest)), !config.hasGlobalCanvas && /*#__PURE__*/React.createElement(ResizeManager, {
    reflow: requestReflow,
    resizeOnHeight: resizeOnHeight
  }));
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

export { GlobalCanvasIfSupported as GlobalCanvas, HijackedScrollbar, ViewportScrollScene as PerspectiveCameraScene, ScrollDomPortal, ScrollScene, ViewportScrollScene, VirtualScrollbar, canvasStoreApi, config, useCanvas, useCanvasStore, useDelayedCanvas, useImgTagAsTexture, useScrollRig, useScrollbar, useTextureLoader, utils };
