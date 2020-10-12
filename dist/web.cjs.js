'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('@babel/runtime/helpers/extends'));
var _objectWithoutPropertiesLoose = _interopDefault(require('@babel/runtime/helpers/objectWithoutPropertiesLoose'));
var React = require('react');
var React__default = _interopDefault(React);
var reactThreeFiber = require('react-three-fiber');
var resizeObserver = require('@juggle/resize-observer');
var queryString = _interopDefault(require('query-string'));
var create = _interopDefault(require('zustand'));
var three = require('three');
var _inheritsLoose = _interopDefault(require('@babel/runtime/helpers/inheritsLoose'));
var PropTypes = _interopDefault(require('prop-types'));
var framerMotion = require('framer-motion');
var ReactDOM = _interopDefault(require('react-dom'));
var windowSize = require('@react-hook/window-size');

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

  obj.children.forEach(function (child) {
    return setAllCulled(child, overrideCulled);
  });
}

var utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  setAllCulled: setAllCulled
});

// Transient shared state for canvas components
// usContext() causes re-rendering which can drop frames
var config = {
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
var requestIdleCallback = function requestIdleCallback(callback, _temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$timeout = _ref.timeout,
      timeout = _ref$timeout === void 0 ? 100 : _ref$timeout;

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, {
      timeout: timeout
    });
  } else {
    setTimeout(callback, 0);
  }
};
var cancelIdleCallback = function cancelIdleCallback(id) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

var _create = create(function (set) {
  return {
    // //////////////////////////////////////////////////////////////////////////
    // GLOBAL ScrollRig STATE
    // //////////////////////////////////////////////////////////////////////////
    // true if WebGL initialized without errors
    isCanvasAvailable: true,
    setCanvasAvailable: function setCanvasAvailable(isCanvasAvailable) {
      return set(function (state) {
        return {
          isCanvasAvailable: isCanvasAvailable
        };
      });
    },
    // true if <VirtualScrollbar> is currently enabled
    hasVirtualScrollbar: false,
    setVirtualScrollbar: function setVirtualScrollbar(hasVirtualScrollbar) {
      return set(function (state) {
        return {
          hasVirtualScrollbar: hasVirtualScrollbar
        };
      });
    },
    // global render loop is suspended internally (NOT USED)
    suspended: false,
    setSuspended: function setSuspended(suspended) {
      return set(function (state) {
        return {
          suspended: suspended
        };
      });
    },
    // global render loop is paused by user action
    paused: false,
    setPaused: function setPaused(paused) {
      return set(function (state) {
        return {
          paused: paused
        };
      });
    },
    // map of all components to render on the global canvas
    canvasChildren: {},
    // add component to canvas
    renderToCanvas: function renderToCanvas(key, mesh, props) {
      if (props === void 0) {
        props = {};
      }

      return set(function (_ref) {
        var _extends2;

        var canvasChildren = _ref.canvasChildren;

        var obj = _extends({}, canvasChildren, (_extends2 = {}, _extends2[key] = {
          mesh: mesh,
          props: props
        }, _extends2));

        return {
          canvasChildren: obj
        };
      });
    },
    // pass new props to a canvas component
    updateCanvas: function updateCanvas(key, newProps) {
      return set(function (_ref2) {
        var _extends3;

        var canvasChildren = _ref2.canvasChildren;
        if (!canvasChildren[key]) return;
        var _canvasChildren$key = canvasChildren[key],
            mesh = _canvasChildren$key.mesh,
            props = _canvasChildren$key.props;

        var obj = _extends({}, canvasChildren, (_extends3 = {}, _extends3[key] = {
          mesh: mesh,
          props: _extends({}, props, newProps)
        }, _extends3));

        return {
          canvasChildren: obj
        };
      });
    },
    // remove component from canvas
    removeFromCanvas: function removeFromCanvas(key) {
      return set(function (_ref3) {
        var canvasChildren = _ref3.canvasChildren;

        var omit = canvasChildren[key],
            obj = _objectWithoutPropertiesLoose(canvasChildren, [key].map(_toPropertyKey)); // make a separate copy of the obj and omit


        return {
          canvasChildren: obj
        };
      });
    },
    // current pixel ratio
    pixelRatio: 1,
    setPixelRatio: function setPixelRatio(pixelRatio) {
      return set(function (state) {
        return {
          pixelRatio: pixelRatio
        };
      });
    },
    // Used to ask components to re-calculate their positions after a layout reflow
    pageReflow: 0,
    pageReflowCompleted: 0,
    requestReflow: function requestReflow() {
      set(function (state) {
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
    triggerReflowCompleted: function triggerReflowCompleted() {
      set(function (state) {
        return {
          pageReflowCompleted: state.pageReflowCompleted + 1
        };
      });
    }
  };
}),
    useCanvasStore = _create[0],
    canvasStoreApi = _create[1];

var renderFullscreen = function renderFullscreen(layers) {
  if (layers === void 0) {
    layers = [0];
  }

  config.globalRender = config.globalRender || [0];
  config.globalRender = [].concat(config.globalRender, layers);
};
var renderScissor = function renderScissor(gl, scene, camera, left, top, width, height, layer) {
  if (layer === void 0) {
    layer = 0;
  }

  if (!scene || !camera) return;
  config.hasRenderQueue = true;
  config.scissorQueue.push(function () {
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
var renderViewport = function renderViewport(gl, scene, camera, left, top, width, height, layer, size) {

  if (!scene || !camera) return;
  config.hasRenderQueue = true;
  config.viewportQueue.push(function () {
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
var preloadScene = function preloadScene(gl, scene, camera, layer, callback) {
  if (layer === void 0) {
    layer = 0;
  }

  if (!scene || !camera) return;
  config.preloadQueue.push(function () {
    gl.setScissorTest(false);
    setAllCulled(scene, false);
    camera.layers.set(layer);
    gl.render(scene, camera);
    setAllCulled(scene, true);
    callback && callback();
  });
};

var useFBO = function useFBO() {
  var _useThree = reactThreeFiber.useThree(),
      size = _useThree.size;

  var pixelRatio = useCanvasStore(function (state) {
    return state.pixelRatio;
  });
  React.useMemo(function () {
    var ratio = Math.min(1, Math.max(2, pixelRatio)); // contrain FBO to 1.5 pixel ratio to improve perf

    var width = size.width * ratio;
    var height = size.height * ratio;

    if (config.fboWidth === width && config.fboHeight === height) {
      return;
    }

    config.debug && console.log('=================');
    config.debug && console.log('===== INIT FBO ==', size, pixelRatio);
    config.debug && console.log('=================');
    var f = new three.WebGLRenderTarget(width, height, {// anisotropy: gl.capabilities.getMaxAnisotropy(), // reduce blurring at glancing angles
    });
    config.fbo = f;
    config.fboWidth = width;
    config.fboHeight = height;
  }, [size]);
};
/**
 * Global render loop to avoid double renders on the same frame
 */


var GlobalRenderer = function GlobalRenderer(_ref) {
  var useScrollRig = _ref.useScrollRig,
      children = _ref.children;
  var scene = React.useRef();

  var _useThree2 = reactThreeFiber.useThree(),
      gl = _useThree2.gl;

  var canvasChildren = useCanvasStore(function (state) {
    return state.canvasChildren;
  });
  var scrollRig = useScrollRig();
  useFBO();
  React.useLayoutEffect(function () {
    gl.outputEncoding = three.sRGBEncoding; // gl.getContext().disable(gl.getContext().DEPTH_TEST)

    gl.autoClear = false; // we do our own rendering

    gl.setClearColor(null, 0);
    gl.debug.checkShaderErrors = config.debug;
    gl.toneMapping = three.NoToneMapping;
  }, []); // GLOBAL RENDER LOOP

  reactThreeFiber.useFrame(function (_ref2) {
    var camera = _ref2.camera,
        scene = _ref2.scene;
    config.hasRenderQueue = false; // Render preload frames first and clear directly

    config.preloadQueue.forEach(function (render) {
      return render();
    });
    if (config.preloadQueue.length) gl.clear(); // Render viewport scissors first
    // config.viewportQueue.forEach((render) => render())

    if (config.globalRender) {
      // console.log('GLOBAL RENDER')
      // run any pre-process frames
      config.preRender.forEach(function (render) {
        return render();
      }); // render default layer, scene, camera

      camera.layers.disableAll();
      config.globalRender.forEach(function (layer) {
        camera.layers.enable(layer);
      });
      gl.clearDepth(); // render as HUD over any other renders

      gl.render(scene, camera); // run any post-render frame (additional layers etc)

      config.postRender.forEach(function (render) {
        return render();
      }); // cleanup for next frame

      config.globalRender = false;
      config.preRender = [];
      config.postRender = [];
    } else {
      // console.log('GLOBAL SCISSORS')
      config.scissorQueue.forEach(function (render) {
        return render();
      });
    } // Render viewport scissors last


    config.viewportQueue.forEach(function (render) {
      return render();
    });
    config.preloadQueue = [];
    config.scissorQueue = [];
    config.viewportQueue = [];
  }, config.PRIORITY_GLOBAL); // render as HUD over ViewportCameraScenes

  config.debug && console.log('GlobalRenderer', Object.keys(canvasChildren).length);
  return /*#__PURE__*/React__default.createElement("scene", {
    ref: scene
  }, /*#__PURE__*/React__default.createElement(React.Suspense, {
    fallback: null
  }, Object.keys(canvasChildren).map(function (key, i) {
    var _canvasChildren$key = canvasChildren[key],
        mesh = _canvasChildren$key.mesh,
        props = _canvasChildren$key.props;

    if (typeof mesh === 'function') {
      return /*#__PURE__*/React__default.createElement(React.Fragment, {
        key: key
      }, mesh(_extends({
        key: key
      }, scrollRig, props)));
    }

    return /*#__PURE__*/React__default.cloneElement(mesh, _extends({
      key: key
    }, props));
  }), children));
};

/**
 * Public interface for ScrollRig
 */

var useScrollRig = function useScrollRig() {
  var isCanvasAvailable = useCanvasStore(function (state) {
    return state.isCanvasAvailable;
  });
  var hasVirtualScrollbar = useCanvasStore(function (state) {
    return state.hasVirtualScrollbar;
  });
  var paused = useCanvasStore(function (state) {
    return state.paused;
  });
  var suspended = useCanvasStore(function (state) {
    return state.suspended;
  });
  var setPaused = useCanvasStore(function (state) {
    return state.setPaused;
  });
  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  });
  var pixelRatio = useCanvasStore(function (state) {
    return state.pixelRatio;
  });

  var _useThree = reactThreeFiber.useThree(),
      gl = _useThree.gl,
      invalidate = _useThree.invalidate,
      size = _useThree.size;

  var requestFrame = React.useCallback(function () {
    if (!paused && !suspended) {
      invalidate();
    }
  }, [paused, suspended]);

  var pause = function pause() {
    config.debug && console.log('GlobalRenderer.pause()');
    setPaused(true);
  };

  var resume = function resume() {
    config.debug && console.log('GlobalRenderer.resume()');
    setPaused(false);
    requestFrame();
  };

  return {
    isCanvasAvailable: isCanvasAvailable,
    hasVirtualScrollbar: hasVirtualScrollbar,
    pixelRatio: pixelRatio,
    requestFrame: requestFrame,
    pause: pause,
    resume: resume,
    preloadScene: function preloadScene$1() {
      for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
        params[_key] = arguments[_key];
      }

      return preloadScene.apply(void 0, [gl].concat(params));
    },
    renderFullscreen: renderFullscreen,
    renderScissor: function renderScissor$1() {
      for (var _len2 = arguments.length, params = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        params[_key2] = arguments[_key2];
      }

      return renderScissor.apply(void 0, [gl].concat(params));
    },
    renderViewport: function renderViewport$1() {
      for (var _len3 = arguments.length, params = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        params[_key3] = arguments[_key3];
      }

      return renderViewport.apply(void 0, [gl].concat(params, [size]));
    },
    reflow: requestReflow
  };
};

var PerformanceMonitor = function PerformanceMonitor() {
  var _useThree = reactThreeFiber.useThree(),
      size = _useThree.size;

  var setPixelRatio = useCanvasStore(function (state) {
    return state.setPixelRatio;
  });
  React.useEffect(function () {
    var devicePixelRatio = window.devicePixelRatio || 1;

    if (devicePixelRatio > 1) {
      var MAX_PIXEL_RATIO = 2.5; // TODO Can we allow better resolution on more powerful computers somehow?
      // Calculate avg frame rate and lower pixelRatio on demand?

      var scale;
      scale = size.width > 1500 ? 0.9 : 1.0;
      scale = size.width > 1900 ? 0.8 : scale;
      var pixelRatio = Math.max(1.0, Math.min(MAX_PIXEL_RATIO, devicePixelRatio * scale));
      config.debug && console.info('GlobalCanvas', 'Set pixelRatio', pixelRatio);
      setPixelRatio(pixelRatio);
    }
  }, [size]);
  return null;
};

var StatsDebug = function StatsDebug() {
  var stats = React.useRef({
    calls: 0
  }).current;
  reactThreeFiber.useFrame(function (_ref) {
    var gl = _ref.gl,
        clock = _ref.clock;
    gl.info.autoReset = false;
    window._gl = gl;
    var calls = gl.info.render.calls;

    if (calls !== stats.calls) {
      requestIdleCallback(function () {
        return console.log('Draw calls: ', calls);
      });
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

var ResizeManager = function ResizeManager(_ref) {
  var useScrollRig = _ref.useScrollRig,
      _ref$resizeOnHeight = _ref.resizeOnHeight,
      resizeOnHeight = _ref$resizeOnHeight === void 0 ? true : _ref$resizeOnHeight,
      _ref$resizeOnWebFontL = _ref.resizeOnWebFontLoaded,
      resizeOnWebFontLoaded = _ref$resizeOnWebFontL === void 0 ? true : _ref$resizeOnWebFontL;
  var mounted = React.useRef(false);

  var _useThree = reactThreeFiber.useThree(),
      size = _useThree.size;

  var _useScrollRig = useScrollRig(),
      reflow = _useScrollRig.reflow; // The reason for not resizing on height on "mobile" is because the height changes when the URL bar disapears in the browser chrome
  // Can we base this on something better - or is there another way to avoid?


  var height = resizeOnHeight ? null : size.height; // Detect only resize events

  React.useEffect(function () {
    if (mounted.current) {
      reflow();
    } else {
      mounted.current = true;
    }
  }, [size.width, height]); // reflow on webfont loaded to prevent misalignments

  React.useEffect(function () {
    if (!resizeOnWebFontLoaded) return;
    var fallbackTimer;

    if ('fonts' in document) {
      document.fonts.onloadingdone = reflow;
    } else {
      fallbackTimer = setTimeout(reflow, 1000);
    }

    return function () {
      if ('fonts' in document) {
        document.fonts.onloadingdone = null;
      } else {
        clearTimeout(fallbackTimer);
      }
    };
  }, []);
  return null;
};

var CanvasErrorBoundary = /*#__PURE__*/function (_React$Component) {
  _inheritsLoose(CanvasErrorBoundary, _React$Component);

  function CanvasErrorBoundary(props) {
    var _this;

    _this = _React$Component.call(this, props) || this;
    _this.state = {
      error: false
    };
    _this.props = props;
    return _this;
  }

  CanvasErrorBoundary.getDerivedStateFromError = function getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return {
      error: error
    };
  } // componentDidCatch(error, errorInfo) {
  //   // You can also log the error to an error reporting service
  //   // logErrorToMyService(error, errorInfo)
  // }
  ;

  var _proto = CanvasErrorBoundary.prototype;

  _proto.render = function render() {
    if (this.state.error) {
      this.props.onError && this.props.onError(this.state.error);
      return null;
    }

    return this.props.children;
  };

  return CanvasErrorBoundary;
}(React__default.Component);

var GlobalCanvas = function GlobalCanvas(_ref) {
  var children = _ref.children,
      gl = _ref.gl,
      resizeOnHeight = _ref.resizeOnHeight,
      props = _objectWithoutPropertiesLoose(_ref, ["children", "gl", "resizeOnHeight"]);

  var pixelRatio = useCanvasStore(function (state) {
    return state.pixelRatio;
  });

  var _useThree = reactThreeFiber.useThree(),
      size = _useThree.size;

  var cameraDistance = React.useMemo(function () {
    return size ? Math.max(size.width, size.height) : Math.max(window.innerWidth, window.innerHeight);
  }, [size]);
  React.useEffect(function () {
    var qs = queryString.parse(window.location.search); // show FPS counter?

    if (typeof qs.fps !== 'undefined') {
      var script = document.createElement('script');

      script.onload = function () {
        // eslint-disable-next-line no-undef
        var stats = new Stats();
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
  return /*#__PURE__*/React__default.createElement(reactThreeFiber.Canvas, _extends({
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
      polyfill: resizeObserver.ResizeObserver
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
  }, props), /*#__PURE__*/React__default.createElement(GlobalRenderer, {
    useScrollRig: useScrollRig
  }, children), config.debug && /*#__PURE__*/React__default.createElement(StatsDebug, null), /*#__PURE__*/React__default.createElement(PerformanceMonitor, null), /*#__PURE__*/React__default.createElement(ResizeManager, {
    resizeOnHeight: resizeOnHeight,
    useScrollRig: useScrollRig
  }));
};

var LAYER = 2;
/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is rendered into a GL viewport matching the DOM position for better performance
 *
 * Adapted to react-three-fiber from https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
 * @author david@14islands.com
 */

exports.PerspectiveCameraScene = function PerspectiveCameraScene(_ref) {
  var el = _ref.el,
      _ref$lerp = _ref.lerp,
      lerp = _ref$lerp === void 0 ? config.scrollLerp : _ref$lerp,
      _ref$lerpOffset = _ref.lerpOffset,
      lerpOffset = _ref$lerpOffset === void 0 ? 0 : _ref$lerpOffset,
      children = _ref.children,
      _ref$margin = _ref.margin,
      margin = _ref$margin === void 0 ? 0 : _ref$margin,
      _ref$visible = _ref.visible,
      visible = _ref$visible === void 0 ? true : _ref$visible,
      renderOrder = _ref.renderOrder,
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? false : _ref$debug,
      _ref$setInViewportPro = _ref.setInViewportProp,
      setInViewportProp = _ref$setInViewportPro === void 0 ? false : _ref$setInViewportPro,
      props = _objectWithoutPropertiesLoose(_ref, ["el", "lerp", "lerpOffset", "children", "margin", "visible", "renderOrder", "debug", "setInViewportProp"]);

  // const scene = useRef()
  var camera = React.useRef();

  var _useState = React.useState(function () {
    return new three.Scene();
  }),
      scene = _useState[0];

  var _useState2 = React.useState(false),
      inViewport = _useState2[0],
      setInViewport = _useState2[1];

  var _useState3 = React.useState({
    width: 1,
    height: 1
  }),
      scale = _useState3[0],
      setScale = _useState3[1];

  var _useViewportScroll = framerMotion.useViewportScroll(),
      scrollY = _useViewportScroll.scrollY;

  var _useThree = reactThreeFiber.useThree(),
      size = _useThree.size;

  var _useScrollRig = useScrollRig(),
      requestFrame = _useScrollRig.requestFrame,
      renderViewport = _useScrollRig.renderViewport;

  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  });
  var cameraDistance = Math.max(scale.width, scale.height); // transient state

  var state = React.useRef({
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

  React.useEffect(function () {
    state.mounted = true;
    return function () {
      state.mounted = false; // gl.clear()
    };
  }, []); // El is rendered

  React.useLayoutEffect(function () {
    // hide image - leave in DOM to measure and get events
    if (!(el == null ? void 0 : el.current)) return;
    el.current.style.opacity = debug ? 0.5 : 0;
    return function () {
      if (!(el == null ? void 0 : el.current)) return;
      el.current.style.opacity = '';
    };
  }, [el.current]); // Trigger render on scroll

  React.useEffect(function () {
    return scrollY.onChange(requestFrame);
  }, []);

  var updateSizeAndPosition = function updateSizeAndPosition() {
    if (!el || !el.current) return;

    var _el$current$getBoundi = el.current.getBoundingClientRect(),
        top = _el$current$getBoundi.top,
        left = _el$current$getBoundi.left,
        width = _el$current$getBoundi.width,
        height = _el$current$getBoundi.height;

    width = width * 0.001;
    height = height * 0.001;
    state.bounds.top = top + window.pageYOffset;
    state.bounds.left = left;
    state.bounds.width = width * 1000;
    state.bounds.height = height * 1000;
    state.prevBounds.top = top;
    setScale({
      width: width,
      height: height
    });

    if (camera.current) {
      camera.current.aspect = (width + margin * 2) / (height + margin * 2);
      camera.current.fov = 2 * (180 / Math.PI) * Math.atan((height + margin * 2) / (2 * cameraDistance));
      camera.current.updateProjectionMatrix();
    }

    requestFrame(); // trigger render
  }; // Find bounding box & scale mesh on resize


  React.useLayoutEffect(function () {
    updateSizeAndPosition();
  }, [pageReflowCompleted]); // RENDER FRAME

  reactThreeFiber.useFrame(function () {
    if (!scene) return;
    var bounds = state.bounds,
        prevBounds = state.prevBounds; // add scroll value to bounds to get current position

    var topY = bounds.top - scrollY.get(); // frame delta

    var delta = Math.abs(prevBounds.top - topY); // Lerp the distance to simulate easing

    var lerpTop = three.Math.lerp(prevBounds.top, topY, lerp + lerpOffset); // Abort if element not in screen

    var isOffscreen = lerpTop + bounds.height < -100 || lerpTop > size.height + 100; // store top value for next frame

    bounds.inViewport = !isOffscreen;
    setInViewportProp && requestIdleCallback(function () {
      return state.mounted && setInViewport(!isOffscreen);
    });
    prevBounds.top = lerpTop; // hide/show scene

    if (isOffscreen && scene.visible) {
      scene.visible = false;
    } else if (!isOffscreen && !scene.visible) {
      scene.visible = visible;
    } // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas


    if (scene.visible) {
      var positiveYUpBottom = size.height - (lerpTop + bounds.height); // inverse Y

      renderViewport(scene, camera.current, bounds.left - margin, positiveYUpBottom - margin, bounds.width + margin * 2, bounds.height + margin * 2, LAYER); // calculate progress of passing through viewport (0 = just entered, 1 = just exited)

      var pxInside = bounds.top - lerpTop - bounds.top + size.height;
      bounds.progress = three.Math.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1); // percent of total visible distance

      bounds.visibility = three.Math.mapLinear(pxInside, 0, bounds.height, 0, 1); // percent of item height in view

      bounds.viewport = three.Math.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
    } // render another frame if delta is large enough


    if (!isOffscreen && delta > config.scrollRestDelta) {
      requestFrame();
    }
  }, config.PRIORITY_VIEWPORTS);

  var renderDebugMesh = function renderDebugMesh() {
    return /*#__PURE__*/React__default.createElement("mesh", null, /*#__PURE__*/React__default.createElement("planeBufferGeometry", {
      attach: "geometry",
      args: [scale.width, scale.height, 1, 1]
    }), /*#__PURE__*/React__default.createElement("meshBasicMaterial", {
      color: "pink",
      attach: "material",
      transparent: true,
      opacity: 0.5
    }));
  };

  return reactThreeFiber.createPortal( /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("perspectiveCamera", {
    ref: camera,
    position: [0, 0, cameraDistance],
    onUpdate: function onUpdate(self) {
      return self.updateProjectionMatrix();
    }
  }), /*#__PURE__*/React__default.createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && renderDebugMesh(), children && children(_extends({
    // inherited props
    el: el,
    lerp: lerp,
    lerpOffset: lerpOffset,
    margin: margin,
    visible: visible,
    renderOrder: renderOrder,
    // new props
    state: state,
    scene: scene,
    camera: camera.current,
    scale: scale,
    layers: LAYER,
    inViewport: inViewport
  }, props)))), scene);
};

exports.PerspectiveCameraScene = /*#__PURE__*/React__default.memo(exports.PerspectiveCameraScene);
exports.PerspectiveCameraScene.childPropTypes = _extends({}, exports.PerspectiveCameraScene.propTypes, {
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

exports.ScrollScene = function ScrollScene(_ref) {
  var el = _ref.el,
      _ref$lerp = _ref.lerp,
      lerp = _ref$lerp === void 0 ? config.scrollLerp : _ref$lerp,
      _ref$lerpOffset = _ref.lerpOffset,
      lerpOffset = _ref$lerpOffset === void 0 ? 0 : _ref$lerpOffset,
      children = _ref.children,
      renderOrder = _ref.renderOrder,
      _ref$margin = _ref.margin,
      margin = _ref$margin === void 0 ? 14 : _ref$margin,
      inViewportMargin = _ref.inViewportMargin,
      _ref$visible = _ref.visible,
      visible = _ref$visible === void 0 ? true : _ref$visible,
      _ref$layoutOffset = _ref.layoutOffset,
      layoutOffset = _ref$layoutOffset === void 0 ? function () {} : _ref$layoutOffset,
      _ref$layoutLerp = _ref.layoutLerp,
      layoutLerp = _ref$layoutLerp === void 0 ? 0.1 : _ref$layoutLerp,
      _ref$scissor = _ref.scissor,
      scissor = _ref$scissor === void 0 ? true : _ref$scissor,
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? false : _ref$debug,
      _ref$softDirection = _ref.softDirection,
      softDirection = _ref$softDirection === void 0 ? false : _ref$softDirection,
      _ref$setInViewportPro = _ref.setInViewportProp,
      setInViewportProp = _ref$setInViewportPro === void 0 ? false : _ref$setInViewportPro,
      _ref$updateLayout = _ref.updateLayout,
      updateLayout = _ref$updateLayout === void 0 ? 0 : _ref$updateLayout,
      props = _objectWithoutPropertiesLoose(_ref, ["el", "lerp", "lerpOffset", "children", "renderOrder", "margin", "inViewportMargin", "visible", "layoutOffset", "layoutLerp", "scissor", "debug", "softDirection", "setInViewportProp", "updateLayout"]);

  var scene = React.useRef();
  var group = React.useRef();

  var _useState = React.useState(false),
      inViewport = _useState[0],
      setInViewport = _useState[1];

  var _useState2 = React.useState({
    width: 1,
    height: 1
  }),
      scale = _useState2[0],
      setScale = _useState2[1];

  var _useViewportScroll = framerMotion.useViewportScroll(),
      scrollY = _useViewportScroll.scrollY;

  var _useThree = reactThreeFiber.useThree(),
      size = _useThree.size;

  var _useScrollRig = useScrollRig(),
      requestFrame = _useScrollRig.requestFrame,
      renderScissor = _useScrollRig.renderScissor,
      renderFullscreen = _useScrollRig.renderFullscreen;

  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  }); // transient state

  var state = React.useRef({
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
  React.useEffect(function () {
    state.mounted = true;
    return function () {
      return state.mounted = false;
    };
  }, []); // set ref on intersection observer

  React.useLayoutEffect(function () {
    // hide image - leave in DOM to measure and get events
    if (!(el == null ? void 0 : el.current)) return;
    el.current.style.opacity = debug ? 0.5 : 0;
    return function () {
      if (!(el == null ? void 0 : el.current)) return;
      el.current.style.opacity = '';
    };
  }, [el.current]); // Trigger render on scroll - if close to viewport

  React.useEffect(function () {
    return scrollY.onChange(requestFrame);
  }, []);

  var updateSizeAndPosition = function updateSizeAndPosition() {
    if (!el || !el.current) return;
    var bounds = state.bounds,
        prevBounds = state.prevBounds;

    var _el$current$getBoundi = el.current.getBoundingClientRect(),
        top = _el$current$getBoundi.top,
        left = _el$current$getBoundi.left,
        width = _el$current$getBoundi.width,
        height = _el$current$getBoundi.height;

    bounds.top = top + window.pageYOffset;
    bounds.left = left;
    bounds.width = width;
    bounds.height = height;
    bounds.centerOffset = size.height * 0.5 - height * 0.5;
    setScale({
      width: width,
      height: height
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


  React.useLayoutEffect(function () {
    updateSizeAndPosition();
  }, [pageReflowCompleted, updateLayout]); // RENDER FRAME

  reactThreeFiber.useFrame(function (_ref2) {
    var _layoutOffset, _layoutOffset2;

    var gl = _ref2.gl,
        camera = _ref2.camera,
        clock = _ref2.clock;
    var bounds = state.bounds,
        prevBounds = state.prevBounds; // const clockDelta = clock.getDelta()

    var time = clock.getElapsedTime();
    var layoutOffsetX = bounds.x + (((_layoutOffset = layoutOffset(bounds)) == null ? void 0 : _layoutOffset.x) || 0);
    var layoutOffsetY = ((_layoutOffset2 = layoutOffset(bounds)) == null ? void 0 : _layoutOffset2.y) || 0; // Find new Y based on cached position and scroll

    var y = bounds.top - scrollY.get() - bounds.centerOffset + layoutOffsetY; // if previously hidden and now visible, update previous position to not get ghost easing when made visible

    if (scene.current.visible && !bounds.inViewport) {
      prevBounds.y = y;
    } // direction check


    var direction = Math.sign(scrollY.getVelocity());

    if (direction !== prevBounds.direction && direction !== 0) {
      if (bounds.inViewport) {
        prevBounds.directionTime = time;
      }

      prevBounds.direction = direction;
    } // adjust lerp if direction changed - soft change


    var yLerp = lerp;

    if (softDirection) {
      var t = three.Math.clamp(time - prevBounds.directionTime, 0, 1.0);
      yLerp = three.Math.lerp(softDirection, lerp, t);
    } // frame delta


    var delta = Math.abs(prevBounds.y - y) + Math.abs(prevBounds.x - layoutOffsetX); // Lerp the distance to simulate easing

    var lerpY = three.Math.lerp(prevBounds.y, y, yLerp + lerpOffset);
    var lerpX = three.Math.lerp(prevBounds.x, layoutOffsetX, layoutLerp); // Abort if element not in screen

    var scrollMargin = inViewportMargin || size.height * 0.33;
    var isOffscreen = lerpY + size.height * 0.5 + bounds.height * 0.5 < -scrollMargin || lerpY + size.height * 0.5 - bounds.height * 0.5 > size.height + scrollMargin; // store top value for next frame

    bounds.inViewport = !isOffscreen; // const velocity = MathUtils.clamp((prevBounds.y - lerpY) / clockDelta / 1000 / 1000 / 100, -1, 1)
    // bounds.velocity = MathUtils.lerp(bounds.velocity, velocity, 0.05)

    setInViewportProp && requestIdleCallback(function () {
      return state.mounted && setInViewport(!isOffscreen);
    });
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
      var positiveYUpBottom = size.height * 0.5 - (lerpY + bounds.height * 0.5); // inverse Y

      if (scissor) {
        // console.log('render scissor', camera.fov, bounds.left, positiveYUpBottom, bounds.width, bounds.height, margin)
        renderScissor(scene.current, camera, bounds.left - margin, positiveYUpBottom - margin, bounds.width + margin * 2, bounds.height + margin * 2);
      } else {
        renderFullscreen();
      } // calculate progress of passing through viewport (0 = just entered, 1 = just exited)


      var pxInside = bounds.top - lerpY - bounds.top + size.height - bounds.centerOffset;
      bounds.progress = three.Math.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1); // percent of total visible distance

      bounds.visibility = three.Math.mapLinear(pxInside, 0, bounds.height, 0, 1); // percent of item height in view

      bounds.viewport = three.Math.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
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

  var renderDebugMesh = function renderDebugMesh() {
    return /*#__PURE__*/React__default.createElement("mesh", null, /*#__PURE__*/React__default.createElement("planeBufferGeometry", {
      attach: "geometry",
      args: [scale.width, scale.height, 1, 1]
    }), /*#__PURE__*/React__default.createElement("meshBasicMaterial", {
      color: "pink",
      attach: "material",
      transparent: true,
      opacity: 0.5
    }));
  };

  return /*#__PURE__*/React__default.createElement("scene", {
    ref: scene,
    visible: state.bounds.inViewport && visible
  }, /*#__PURE__*/React__default.createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && renderDebugMesh(), children && children(_extends({
    // inherited props
    el: el,
    lerp: lerp,
    lerpOffset: lerpOffset,
    layoutLerp: layoutLerp,
    renderOrder: renderOrder,
    visible: visible,
    layoutOffset: layoutOffset,
    margin: margin,
    // new props
    scale: scale,
    state: state,
    scene: scene.current,
    inViewport: inViewport
  }, props))));
};

exports.ScrollScene = /*#__PURE__*/React__default.memo(exports.ScrollScene);
exports.ScrollScene.childPropTypes = _extends({}, exports.ScrollScene.propTypes, {
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

var LAYOUT_LERP = 0.1;
/**
 * Make DOM element fixed and move using useFrame so we can and match the lerp of a ScrollScene
 * The referenced DOM element will be cloned and made position:fixed. The original el is hidden.
 * @author david@14islands.com
 */

var ScrollDom = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var el = _ref.el,
      appendTo = _ref.appendTo,
      _ref$lerp = _ref.lerp,
      lerp = _ref$lerp === void 0 ? config.scrollLerp : _ref$lerp,
      _ref$lerpOffset = _ref.lerpOffset,
      lerpOffset = _ref$lerpOffset === void 0 ? 0 : _ref$lerpOffset,
      children = _ref.children,
      _ref$zIndex = _ref.zIndex,
      zIndex = _ref$zIndex === void 0 ? 0 : _ref$zIndex,
      _ref$getOffset = _ref.getOffset,
      getOffset = _ref$getOffset === void 0 ? function () {} : _ref$getOffset,
      _ref$live = _ref.live,
      live = _ref$live === void 0 ? false : _ref$live,
      _ref$layoutLerp = _ref.layoutLerp,
      layoutLerp = _ref$layoutLerp === void 0 ? LAYOUT_LERP : _ref$layoutLerp,
      style = _ref.style;
  var copyEl = React.useRef();
  var local = React.useRef({
    needUpdate: false,
    offsetY: 0,
    offsetX: 0
  }).current;
  var bounds = React.useRef({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    windowHeight: -1,
    windowWidth: -1
  }).current;
  var prevBounds = React.useRef({
    top: 0,
    wasOffscreen: false
  }).current;

  var _useViewportScroll = framerMotion.useViewportScroll(),
      scrollY = _useViewportScroll.scrollY;

  var _useThree = reactThreeFiber.useThree(),
      size = _useThree.size;

  var _useScrollRig = useScrollRig(),
      requestFrame = _useScrollRig.requestFrame;

  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  }); // El is rendered

  React.useEffect(function () {
    // hide DOM element visually - leave in DOM to measure and get events
    if (!(el == null ? void 0 : el.current)) return;
    copyEl.current = el.current.cloneNode(true);
    copyEl.current.style.position = 'fixed';
    copyEl.current.style.visibility = 'visible';
    copyEl.current.style.zIndex = zIndex;
    ((appendTo == null ? void 0 : appendTo.current) || document.documentElement).appendChild(copyEl.current);
    el.current.style.visibility = 'hidden';
    ref && ref(copyEl.current);
    return function () {
      ((appendTo == null ? void 0 : appendTo.current) || document.documentElement).removeChild(copyEl.current);

      if (el && el.current) {
        el.current.style.visibility = '';
      }
    };
  }, [el.current]); // Trigger render on scroll

  React.useEffect(function () {
    return scrollY.onChange(function () {
      local.needUpdate = true;
      requestFrame();
    });
  }, []); // Find initial position of proxy element on mount

  React.useEffect(function () {
    if (!el || !el.current) return;
    copyEl.current.className = el.current.className;

    var _el$current$getBoundi = el.current.getBoundingClientRect(),
        top = _el$current$getBoundi.top,
        left = _el$current$getBoundi.left,
        width = _el$current$getBoundi.width,
        height = _el$current$getBoundi.height;

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

  React.useEffect(function () {
    if (!el || !el.current) return;
    var id = requestIdleCallback(function () {
      if (!el || !el.current) return;
      var classNames = el.current.className;

      if (!classNames !== copyEl.current.className) {
        copyEl.current.className = classNames;
      }

      var top = bounds.top,
          left = bounds.left;

      var _el$current$getBoundi2 = el.current.getBoundingClientRect(),
          newTop = _el$current$getBoundi2.top,
          newLeft = _el$current$getBoundi2.left,
          newHeight = _el$current$getBoundi2.height,
          newWidth = _el$current$getBoundi2.width;

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
    return function () {
      return cancelIdleCallback(id);
    };
  }, [live, pageReflowCompleted]);
  React.useEffect(function () {
    local.needUpdate = true;
    requestFrame();
  }, [style]); // RENDER FRAME

  reactThreeFiber.useFrame(function (_ref2) {
    var _getOffset, _getOffset2;

    var gl = _ref2.gl;
    var top = bounds.top,
        height = bounds.height; // get offset from resizing window + offset from callback function from parent

    var offsetX = local.offsetX + (live && ((_getOffset = getOffset()) == null ? void 0 : _getOffset.x) || 0);
    var offsetY = local.offsetY + (live && ((_getOffset2 = getOffset()) == null ? void 0 : _getOffset2.y) || 0); // add scroll value to bounds to get current position

    var scrollTop = -scrollY.get(); // frame delta

    var deltaScroll = prevBounds.top - scrollTop;
    var delta = Math.abs(deltaScroll) + Math.abs(prevBounds.x - offsetX) + Math.abs(prevBounds.y - offsetY);

    if (!local.needUpdate && delta < config.scrollRestDelta) {
      // abort if no delta change
      return;
    } // parallax position
    // const progress = MathUtils.lerp(1, -1, MathUtils.clamp((size.height - scrollTop) / (size.height + height), 0, 1))
    // const offset = transform(progress, [1, 0, -1], [0, 0, 400])
    // scrollTop += offset
    // Lerp the distance to simulate easing


    var lerpScroll = three.Math.lerp(prevBounds.top, scrollTop, lerp + lerpOffset);
    var lerpX = three.Math.lerp(prevBounds.x, offsetX, layoutLerp);
    var lerpY = three.Math.lerp(prevBounds.y, offsetY, layoutLerp); // Abort if element not in screen

    var elTop = top + lerpScroll + lerpY;
    var isOffscreen = elTop + height < -100 || elTop > size.height + 100; // Update DOM element position if in view, or if was in view last frame

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
  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null);
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

var LAYOUT_LERP$1 = 0.1;
/**
 * Render child element in portal and move using useFrame so we can and match the lerp of the VirtualScrollbar
 * TThe original el used for position
 * @author david@14islands.com
 */

var ScrollDomPortal = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var el = _ref.el,
      _ref$lerp = _ref.lerp,
      lerp = _ref$lerp === void 0 ? config.scrollLerp : _ref$lerp,
      _ref$lerpOffset = _ref.lerpOffset,
      lerpOffset = _ref$lerpOffset === void 0 ? 0 : _ref$lerpOffset,
      children = _ref.children,
      _ref$zIndex = _ref.zIndex,
      zIndex = _ref$zIndex === void 0 ? 0 : _ref$zIndex,
      _ref$getOffset = _ref.getOffset,
      getOffset = _ref$getOffset === void 0 ? function () {} : _ref$getOffset,
      _ref$live = _ref.live,
      live = _ref$live === void 0 ? false : _ref$live,
      _ref$layoutLerp = _ref.layoutLerp,
      layoutLerp = _ref$layoutLerp === void 0 ? LAYOUT_LERP$1 : _ref$layoutLerp,
      style = _ref.style;
  var copyEl = React.useRef();
  var local = React.useRef({
    needUpdate: false,
    offsetY: 0,
    offsetX: 0,
    raf: -1
  }).current;
  var bounds = React.useRef({
    top: 0,
    left: 0,
    width: 0,
    height: 0
  }).current;
  var prevBounds = React.useRef({
    top: 0,
    wasOffscreen: false
  }).current;

  var _useViewportScroll = framerMotion.useViewportScroll(),
      scrollY = _useViewportScroll.scrollY;

  var viewportHeight = windowSize.useWindowHeight();
  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  });

  var requestFrame = function requestFrame() {
    window.cancelAnimationFrame(local.raf);
    local.raf = window.requestAnimationFrame(frame);
  }; // Trigger render on scroll


  React.useEffect(function () {
    return scrollY.onChange(function () {
      local.needUpdate = true;
      requestFrame();
    });
  }, []); // Find initial position of proxy element on mount

  React.useEffect(function () {
    if (!el || !el.current) return;

    var _el$current$getBoundi = el.current.getBoundingClientRect(),
        top = _el$current$getBoundi.top,
        left = _el$current$getBoundi.left,
        width = _el$current$getBoundi.width,
        height = _el$current$getBoundi.height;

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

  React.useEffect(function () {
    if (!el || !el.current) return;
    var id = requestIdleCallback(function () {
      if (!el || !el.current) return; // const classNames = el.current.className
      // if (!classNames !== copyEl.current.className) {
      //   copyEl.current.className = classNames
      // }

      var top = bounds.top,
          left = bounds.left;

      var _el$current$getBoundi2 = el.current.getBoundingClientRect(),
          newTop = _el$current$getBoundi2.top,
          newLeft = _el$current$getBoundi2.left,
          newHeight = _el$current$getBoundi2.height,
          newWidth = _el$current$getBoundi2.width;

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
    return function () {
      return cancelIdleCallback(id);
    };
  }, [live, pageReflowCompleted]); // RENDER FRAME

  var frame = function frame(_ref2) {
    var _getOffset, _getOffset2;

    var gl = _ref2.gl;
    var top = bounds.top,
        height = bounds.height; // get offset from resizing window + offset from callback function from parent

    var offsetX = local.offsetX + (live && ((_getOffset = getOffset()) == null ? void 0 : _getOffset.x) || 0);
    var offsetY = local.offsetY + (live && ((_getOffset2 = getOffset()) == null ? void 0 : _getOffset2.y) || 0); // add scroll value to bounds to get current position

    var scrollTop = -scrollY.get(); // frame delta

    var deltaScroll = prevBounds.top - scrollTop;
    var delta = Math.abs(deltaScroll) + Math.abs(prevBounds.x - offsetX) + Math.abs(prevBounds.y - offsetY);

    if (!local.needUpdate && delta < config.scrollRestDelta) {
      // abort if no delta change
      return;
    } // parallax position
    // const progress = MathUtils.lerp(1, -1, MathUtils.clamp((size.height - scrollTop) / (size.height + height), 0, 1))
    // const offset = transform(progress, [1, 0, -1], [0, 0, 400])
    // scrollTop += offset
    // Lerp the distance to simulate easing


    var lerpScroll = three.Math.lerp(prevBounds.top, scrollTop, lerp + lerpOffset);
    var lerpX = three.Math.lerp(prevBounds.x, offsetX, layoutLerp);
    var lerpY = three.Math.lerp(prevBounds.y, offsetY, layoutLerp); // Abort if element not in screen

    var elTop = top + lerpScroll + lerpY;
    var isOffscreen = elTop + height < -100 || elTop > viewportHeight + 100; // Update DOM element position if in view, or if was in view last frame

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
    var child = React__default.Children.only( /*#__PURE__*/React__default.cloneElement(children, {
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

var useCanvas = function useCanvas(object, deps, key) {
  if (deps === void 0) {
    deps = [];
  }

  var updateCanvas = useCanvasStore(function (state) {
    return state.updateCanvas;
  });
  var renderToCanvas = useCanvasStore(function (state) {
    return state.renderToCanvas;
  });
  var removeFromCanvas = useCanvasStore(function (state) {
    return state.removeFromCanvas;
  }); // auto generate uuid v4 key

  var uniqueKey = React.useMemo(function () {
    return key || three.MathUtils.generateUUID();
  }, []);
  React.useLayoutEffect(function () {
    renderToCanvas(uniqueKey, object);
    return function () {
      return removeFromCanvas(uniqueKey);
    };
  }, deps); // return function that can set new props on the canvas component

  var set = function set(props) {
    requestIdleCallback(function () {
      return updateCanvas(uniqueKey, props);
    }, {
      timeout: 100
    });
  };

  return set;
};

var useDelayedEffect = function useDelayedEffect(fn, deps, ms) {
  if (ms === void 0) {
    ms = 0;
  }

  var timer;
  React.useEffect(function () {
    timer = setTimeout(fn, ms);
    return function () {
      return clearTimeout(timer);
    };
  }, deps);
};

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted after initial delay (ms)
 * @param {object} object THREE.js object3d
 */

var useDelayedCanvas = function useDelayedCanvas(object, ms, deps, key) {
  if (deps === void 0) {
    deps = [];
  }

  var updateCanvas = useCanvasStore(function (state) {
    return state.updateCanvas;
  });
  var renderToCanvas = useCanvasStore(function (state) {
    return state.renderToCanvas;
  });
  var removeFromCanvas = useCanvasStore(function (state) {
    return state.removeFromCanvas;
  }); // auto generate uuid v4 key

  var uniqueKey = React.useMemo(function () {
    return key || three.MathUtils.generateUUID();
  }, []); // remove on unmount

  React.useLayoutEffect(function () {
    return function () {
      return removeFromCanvas(uniqueKey);
    };
  }, []);
  useDelayedEffect(function () {
    renderToCanvas(uniqueKey, object);
  }, deps, ms); // return function that can set new props on the canvas component

  var set = function set(props) {
    requestIdleCallback(function () {
      return updateCanvas(uniqueKey, props);
    }, {
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

var useImageBitmap = typeof createImageBitmap !== 'undefined' && /Firefox/.test(navigator.userAgent) === false; // Override fetch to prefer cached images by default

if (typeof window !== 'undefined') {
  var realFetch = window.fetch;

  window.fetch = function (url, options) {
    if (options === void 0) {
      options = {
        cache: 'force-cache'
      };
    }

    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    return realFetch.apply(void 0, [url, options].concat(args));
  };
}

function isPowerOfTwo(dimensions) {
  if (dimensions === void 0) {
    dimensions = {
      width: -1,
      height: -1
    };
  }

  return three.Math.isPowerOfTwo(dimensions.width) && three.Math.isPowerOfTwo(dimensions.height);
}

var useTextureLoader = function useTextureLoader(url, dimensions, _temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$disableMipmaps = _ref.disableMipmaps,
      disableMipmaps = _ref$disableMipmaps === void 0 ? false : _ref$disableMipmaps;

  var _useState = React.useState(),
      texture = _useState[0],
      setTexture = _useState[1];

  var _useState2 = React.useState(),
      imageBitmap = _useState2[0],
      setImageBitmap = _useState2[1];

  var _useThree = reactThreeFiber.useThree(),
      gl = _useThree.gl;

  var disposeBitmap = React.useCallback(function () {
    if (imageBitmap && imageBitmap.close) {
      imageBitmap.close();
      setImageBitmap(null);
    }
  }, [imageBitmap]);

  var loadTexture = function loadTexture(url) {
    var loader;

    if (useImageBitmap) {
      loader = new three.ImageBitmapLoader(); // Flip if texture is powerOf2

      if (!isPowerOfTwo(dimensions)) {
        loader.setOptions({
          imageOrientation: 'flipY',
          premultiplyAlpha: 'none'
        });
      }
    } else {
      loader = new three.TextureLoader();
    }

    loader.setCrossOrigin('anonymous');
    loader.load(url, function (texture) {
      if (useImageBitmap) {
        setImageBitmap(imageBitmap);
        texture = new three.CanvasTexture(texture);
      } // max quality


      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      texture.encoding = three.sRGBEncoding;

      if (disableMipmaps) {
        texture.minFilter = three.LinearFilter;
        texture.generateMipmaps = false;
      } // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
      // eslint-disable-next-line no-useless-escape


      var isJPEG = url.search(/\.jpe?g($|\?)/i) > 0 || url.search(/^data\:image\/jpeg/) === 0;
      texture.format = isJPEG ? three.RGBFormat : three.RGBAFormat;
      setTexture(texture);
    }, null, function (err) {
      console.error('err', err);
    });
  };

  React.useEffect(function () {
    if (url) {
      loadTexture(url);
    }
  }, [url]);
  return [texture, disposeBitmap];
};
var useImgTagAsTexture = function useImgTagAsTexture(imgEl, dimensions, opts) {
  var _useState3 = React.useState(null),
      url = _useState3[0],
      setUrl = _useState3[1];

  var _useTextureLoader = useTextureLoader(url, dimensions, opts),
      texture = _useTextureLoader[0],
      disposeBitmap = _useTextureLoader[1];

  var loadTexture = function loadTexture() {
    imgEl.removeEventListener('load', loadTexture);
    setUrl(imgEl.currentSrc || imgEl.src);
  };

  React.useEffect(function () {
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

var DEFAULT_LERP = 0.1;

function _lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

var FakeScroller = function FakeScroller(_ref) {
  var el = _ref.el,
      _ref$lerp = _ref.lerp,
      lerp = _ref$lerp === void 0 ? DEFAULT_LERP : _ref$lerp,
      _ref$restDelta = _ref.restDelta,
      restDelta = _ref$restDelta === void 0 ? 1 : _ref$restDelta,
      _ref$scrollY = _ref.scrollY,
      scrollY = _ref$scrollY === void 0 ? null : _ref$scrollY;
  var pageReflow = useCanvasStore(function (state) {
    return state.pageReflow;
  });
  var triggerReflowCompleted = useCanvasStore(function (state) {
    return state.triggerReflowCompleted;
  });
  var heightEl = React.useRef();

  var _useState = React.useState(),
      fakeHeight = _useState[0],
      setFakeHeight = _useState[1];

  var state = React.useRef({
    preventPointer: false,
    total: 0,
    scroll: {
      target: 0,
      current: 0,
      lerp: lerp,
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

  var run = function run() {
    state.frame = window.requestAnimationFrame(run);
    var scroll = state.scroll;
    scroll.current = _lerp(scroll.current, scroll.target, scroll.lerp);
    var delta = scroll.current - scroll.target;
    scroll.velocity = Math.abs(delta);
    scroll.direction = Math.sign(delta);
    transformSections(); // stop animation if delta is low

    if (scroll.velocity < restDelta) {
      window.cancelAnimationFrame(state.frame);
      state.frame = null; // el.current && el.current.classList.remove('is-scrolling')

      preventPointerEvents(false);
    }
  };

  var transformSections = function transformSections() {
    var total = state.total,
        isResizing = state.isResizing,
        scroll = state.scroll,
        sections = state.sections;
    var translate = "translate3d(0, " + -scroll.current + "px, 0)";
    if (!sections) return;

    for (var i = 0; i < total; i++) {
      var data = sections[i];
      var _el = data.el,
          bounds = data.bounds;

      if (isVisible(bounds) || isResizing) {
        Object.assign(data, {
          out: false
        });
        _el.style.transform = translate;
      } else if (!data.out) {
        Object.assign(data, {
          out: true
        });
        _el.style.transform = translate;
      }
    }
  };

  var isVisible = function isVisible(bounds) {
    var _state$bounds = state.bounds,
        height = _state$bounds.height,
        threshold = _state$bounds.threshold;
    var current = state.scroll.current;
    var top = bounds.top,
        bottom = bounds.bottom;
    var start = top - current;
    var end = bottom - current;
    var isVisible = start < threshold + height && end > -threshold;
    return isVisible;
  };

  var getSections = function getSections() {
    if (!state.sectionEls) return;
    state.sections = [];
    state.sectionEls.forEach(function (el) {
      el.style.transform = 'translate3d(0, 0, 0)'; // FF complains that we exceed the budget for willChange and will ignore the rest
      // Testing to remove this to see if it speeds up other things
      // el.style.willChange = 'transform'

      var _el$getBoundingClient = el.getBoundingClientRect(),
          top = _el$getBoundingClient.top,
          bottom = _el$getBoundingClient.bottom;

      state.sections.push({
        el: el,
        bounds: {
          top: top,
          bottom: bottom
        },
        out: true
      });
    });
  }; // disable pointer events while scrolling to avoid slow event handlers


  var preventPointerEvents = function preventPointerEvents(prevent) {
    if (el.current) {
      el.current.style.pointerEvents = prevent ? 'none' : '';
    }

    state.preventPointer = prevent;
  };

  var onScroll = function onScroll(val) {
    // check if use with scroll wrapper or native scroll event
    state.scroll.target = scrollY ? val : window.pageYOffset; // restart animation loop if needed

    if (!state.frame && !state.isResizing) {
      state.frame = window.requestAnimationFrame(run);
    }

    if (!state.preventPointer && state.scroll.velocity > 100) {
      setTimeout(function () {
        // el.current && el.current.classList.add('is-scrolling')
        state.preventPointer = true;
        preventPointerEvents(true);
      }, 0);
    }
  }; // reset pointer events when moving mouse


  var onMouseMove = function onMouseMove() {
    if (state.preventPointer) {
      preventPointerEvents(false);
    }
  }; // Bind mouse event


  React.useEffect(function () {
    window.addEventListener('mousemove', onMouseMove);
    return function () {
      return window.removeEventListener('mousemove', onMouseMove);
    };
  }, []); // Bind scroll event

  React.useEffect(function () {
    if (scrollY) {
      return scrollY.onChange(onScroll);
    } else {
      window.addEventListener('scroll', onScroll);
      return function () {
        return window.removeEventListener('scroll', onScroll);
      };
    }
  }, []);
  React.useEffect(function () {
    if (el.current) {
      state.sectionEls = Array.from(el.current.children);
      state.total = state.sectionEls.length;
      getSections();
    } // reset on umount


    return function () {
      var sections = state.sections;

      if (sections) {
        sections.forEach(function (_ref2) {
          var el = _ref2.el,
              bounds = _ref2.bounds;
          el.style.transform = '';
        });
        state.sections = null;
      }
    };
  }, [el.current]); // RESIZE calculate fake height and move elemnts into place

  var handleResize = function handleResize() {
    var total = state.total,
        bounds = state.bounds,
        sections = state.sections,
        scroll = state.scroll;
    state.isResizing = true;
    bounds.height = window.innerHeight; // move els back into place and measure their offset

    if (sections) {
      sections.forEach(function (_ref3) {
        var el = _ref3.el,
            bounds = _ref3.bounds;
        el.style.transform = 'translate3d(0, 0, 0)';

        var _el$getBoundingClient2 = el.getBoundingClientRect(),
            top = _el$getBoundingClient2.top,
            bottom = _el$getBoundingClient2.bottom;

        bounds.top = top;
        bounds.bottom = bottom;
      });
    } // set viewport height and fake document height


    var _state$sectionEls$get = state.sectionEls[total - 1].getBoundingClientRect(),
        bottom = _state$sectionEls$get.bottom;

    bounds.scrollHeight = bottom; // update fake height

    setFakeHeight(bounds.scrollHeight + "px");
    setTimeout(function () {
      // get new scroll position (changes if window height became smaller)
      scroll.current = window.pageYOffset; // move all items into place

      transformSections(); // notify canvas components to refresh positions

      triggerReflowCompleted();
      state.isResizing = false;
    }, 0);
  };

  React.useEffect(function () {
    handleResize();
  }, [pageReflow]);
  return /*#__PURE__*/React__default.createElement("div", {
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
var VirtualScrollbar = function VirtualScrollbar(_ref4) {
  var disabled = _ref4.disabled,
      children = _ref4.children,
      rest = _objectWithoutPropertiesLoose(_ref4, ["disabled", "children"]);

  var ref = React.useRef();

  var _useState2 = React.useState(false),
      active = _useState2[0],
      setActive = _useState2[1]; // FakeScroller wont trigger resize without this here.. whyyyy?
  // eslint-disable-next-line no-unused-vars


  var pageReflow = useCanvasStore(function (state) {
    return state.pageReflow;
  });
  var setVirtualScrollbar = useCanvasStore(function (state) {
    return state.setVirtualScrollbar;
  }); // NOT SURE THIS IS NEEDED ANY LONGER
  // Make sure we are scrolled to top before measuring stuff
  // `gatsby-plugin-transition-link` scrolls back to top in a `setTimeout()` which makes it delayed

  React.useLayoutEffect(function () {
    // __tl_back_button_pressed is set by `gatsby-plugin-transition-link`
    if (!window.__tl_back_button_pressed) {
      // make sure we start at top if scrollbar is active (transition)
      !disabled && window.scrollTo(0, 0);
    }
  }, []);
  React.useEffect(function () {
    document.documentElement.classList.toggle('js-has-virtual-scrollbar', !disabled);
    setVirtualScrollbar(!disabled); // allow webgl components to find positions first on page load

    var timer = setTimeout(function () {
      setActive(!disabled); // tell GlobalCanvas that VirtualScrollbar is active

      config.hasVirtualScrollbar = !disabled;
    }, 0);
    return function () {
      return clearTimeout(timer);
    };
  }, [disabled]);
  var activeStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%' // overflow: 'hidden',  // prevents tabbing to links in Chrome

  };
  var style = active ? activeStyle : {};
  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, children({
    ref: ref,
    style: style
  }), active && /*#__PURE__*/React__default.createElement(FakeScroller, _extends({
    el: ref
  }, rest)));
};

exports.GlobalCanvas = GlobalCanvas;
exports.ScrollDom = ScrollDom;
exports.ScrollDomPortal = ScrollDomPortal;
exports.VirtualScrollbar = VirtualScrollbar;
exports.canvasStoreApi = canvasStoreApi;
exports.config = config;
exports.useCanvas = useCanvas;
exports.useCanvasStore = useCanvasStore;
exports.useDelayedCanvas = useDelayedCanvas;
exports.useImgTagAsTexture = useImgTagAsTexture;
exports.useScrollRig = useScrollRig;
exports.useTextureLoader = useTextureLoader;
exports.utils = utils;
