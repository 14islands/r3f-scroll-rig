'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _extends = require('@babel/runtime/helpers/extends');
var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var _objectWithoutProperties = require('@babel/runtime/helpers/objectWithoutProperties');
var React = require('react');
var fiber = require('@react-three/fiber');
var resizeObserver = require('@juggle/resize-observer');
var queryString = require('query-string');
var _typeof = require('@babel/runtime/helpers/typeof');
var create = require('zustand');
var middleware = require('zustand/middleware');
var _slicedToArray = require('@babel/runtime/helpers/slicedToArray');
var StatsImpl = require('three/examples/js/libs/stats.min');
var windowSize = require('@react-hook/window-size');
var mergeRefs = require('react-merge-refs');
var _toConsumableArray = require('@babel/runtime/helpers/toConsumableArray');
var three = require('three');
var _classCallCheck = require('@babel/runtime/helpers/classCallCheck');
var _createClass = require('@babel/runtime/helpers/createClass');
var _inherits = require('@babel/runtime/helpers/inherits');
var _possibleConstructorReturn = require('@babel/runtime/helpers/possibleConstructorReturn');
var _getPrototypeOf = require('@babel/runtime/helpers/getPrototypeOf');
var PropTypes = require('prop-types');
var _lerp = require('@14islands/lerp');
var shaderMaterial = require('@react-three/drei/core/shaderMaterial');
var ReactDOM = require('react-dom');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _extends__default = /*#__PURE__*/_interopDefaultLegacy(_extends);
var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);
var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var queryString__default = /*#__PURE__*/_interopDefaultLegacy(queryString);
var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);
var create__default = /*#__PURE__*/_interopDefaultLegacy(create);
var _slicedToArray__default = /*#__PURE__*/_interopDefaultLegacy(_slicedToArray);
var StatsImpl__default = /*#__PURE__*/_interopDefaultLegacy(StatsImpl);
var mergeRefs__default = /*#__PURE__*/_interopDefaultLegacy(mergeRefs);
var _toConsumableArray__default = /*#__PURE__*/_interopDefaultLegacy(_toConsumableArray);
var _classCallCheck__default = /*#__PURE__*/_interopDefaultLegacy(_classCallCheck);
var _createClass__default = /*#__PURE__*/_interopDefaultLegacy(_createClass);
var _inherits__default = /*#__PURE__*/_interopDefaultLegacy(_inherits);
var _possibleConstructorReturn__default = /*#__PURE__*/_interopDefaultLegacy(_possibleConstructorReturn);
var _getPrototypeOf__default = /*#__PURE__*/_interopDefaultLegacy(_getPrototypeOf);
var PropTypes__default = /*#__PURE__*/_interopDefaultLegacy(PropTypes);
var _lerp__default = /*#__PURE__*/_interopDefaultLegacy(_lerp);
var ReactDOM__default = /*#__PURE__*/_interopDefaultLegacy(ReactDOM);

/**
 * runtime check for requestIdleCallback
 */
var requestIdleCallback = function requestIdleCallback(callback) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
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
var requestIdleCallback$1 = requestIdleCallback;

// Transient shared state for canvas components
// usContext() causes re-rendering which can drop frames
var config = {
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

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof__default["default"](key) === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (_typeof__default["default"](input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof__default["default"](res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

function ownKeys$5(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$5(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$5(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var useCanvasStore = create__default["default"](middleware.subscribeWithSelector(function (set) {
  return {
    // //////////////////////////////////////////////////////////////////////////
    // GLOBAL ScrollRig STATE
    // //////////////////////////////////////////////////////////////////////////
    globalRenderQueue: false,
    clearGlobalRenderQueue: function clearGlobalRenderQueue() {
      return set(function (state) {
        return {
          globalRenderQueue: false
        };
      });
    },
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
    // map of all components to render on the global canvas
    canvasChildren: {},
    // add component to canvas
    renderToCanvas: function renderToCanvas(key, mesh) {
      var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return set(function (_ref) {
        var canvasChildren = _ref.canvasChildren;

        var obj = _objectSpread$5(_objectSpread$5({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
          mesh: mesh,
          props: props
        }));

        return {
          canvasChildren: obj
        };
      });
    },
    // pass new props to a canvas component
    updateCanvas: function updateCanvas(key, newProps) {
      return set(function (_ref2) {
        var canvasChildren = _ref2.canvasChildren;
        if (!canvasChildren[key]) return;
        var _canvasChildren$key = canvasChildren[key],
            mesh = _canvasChildren$key.mesh,
            props = _canvasChildren$key.props;

        var obj = _objectSpread$5(_objectSpread$5({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
          mesh: mesh,
          props: _objectSpread$5(_objectSpread$5({}, props), newProps)
        }));

        return {
          canvasChildren: obj
        };
      });
    },
    // remove component from canvas
    removeFromCanvas: function removeFromCanvas(key) {
      return set(function (_ref3) {
        var canvasChildren = _ref3.canvasChildren;

        canvasChildren[key];
            var obj = _objectWithoutProperties__default["default"](canvasChildren, [key].map(_toPropertyKey)); // make a separate copy of the obj and omit


        return {
          canvasChildren: obj
        };
      });
    },
    // Used to ask components to re-calculate their positions after a layout reflow
    pageReflowRequested: 0,
    pageReflowCompleted: 0,
    requestReflow: function requestReflow() {
      config.debug && console.log('ScrollRig', 'reflow() requested');
      set(function (state) {
        requestIdleCallback(state.triggerReflowCompleted, {
          timeout: 100
        });
        return {
          pageReflowRequested: state.pageReflowRequested + 1
        };
      });
    },
    triggerReflowCompleted: function triggerReflowCompleted() {
      set(function (state) {
        return {
          pageReflowCompleted: state.pageReflowCompleted + 1
        };
      });
    },
    // keep track of scroll position
    scrollY: 0,
    setScrollY: function setScrollY(scrollY) {
      return set(function (state) {
        return {
          scrollY: scrollY
        };
      });
    }
  };
}));

/* Copied from drei - no need to import just for this */

function Stats(_ref) {
  var _ref$showPanel = _ref.showPanel,
      showPanel = _ref$showPanel === void 0 ? 0 : _ref$showPanel,
      className = _ref.className,
      parent = _ref.parent;

  var _useState = React.useState(new StatsImpl__default["default"]()),
      _useState2 = _slicedToArray__default["default"](_useState, 1),
      stats = _useState2[0];

  React.useEffect(function () {
    if (stats) {
      var node = parent && parent.current || document.body;
      stats.showPanel(showPanel);
      node.appendChild(stats.dom);
      if (className) stats.dom.classList.add(className);
      var begin = fiber.addEffect(function () {
        return stats.begin();
      });
      var end = fiber.addAfterEffect(function () {
        return stats.end();
      });
      return function () {
        node.removeChild(stats.dom);
        begin();
        end();
      };
    }
  }, [parent, stats, className, showPanel]);
  return null;
}

var StatsDebug = function StatsDebug(_ref) {
  var _ref$render = _ref.render,
      render = _ref$render === void 0 ? true : _ref$render,
      _ref$memory = _ref.memory,
      memory = _ref$memory === void 0 ? true : _ref$memory;
  var stats = React.useRef({
    calls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0
  }).current;
  fiber.useFrame(function (_ref2) {
    var gl = _ref2.gl;
        _ref2.clock;
    gl.info.autoReset = false;
    var _calls = gl.info.render.calls;
    var _triangles = gl.info.render.triangles;
    var _geometries = gl.info.memory.geometries;
    var _textures = gl.info.memory.textures;

    if (render) {
      if (_calls !== stats.calls || _triangles !== stats.triangles) {
        requestIdleCallback(function () {
          return console.info('Draw calls: ', _calls, ' Triangles: ', _triangles);
        });
        stats.calls = _calls;
        stats.triangles = _triangles;
      }
    }

    if (memory) {
      if (_geometries !== stats.geometries || _textures !== stats.textures) {
        requestIdleCallback(function () {
          return console.info('Geometries: ', _geometries, 'Textures: ', _textures);
        });
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
 *  1. reflow() will cause VirtualScrollbar to recalculate positions
 *  2. VirtualScrollbar triggers `pageReflowCompleted`
 *  3. Canvas scroll components listen to  `pageReflowCompleted` and recalc positions
 *
 *  HijackedScrollbar does not care about this and only react to window resize to recalculate the total page height
 */

var ResizeManager = function ResizeManager(_ref) {
  var reflow = _ref.reflow,
      _ref$resizeOnWebFontL = _ref.resizeOnWebFontLoaded,
      resizeOnWebFontLoaded = _ref$resizeOnWebFontL === void 0 ? true : _ref$resizeOnWebFontL;
  var mounted = React.useRef(false);

  var _useWindowSize = windowSize.useWindowSize({
    wait: 300
  }),
      _useWindowSize2 = _slicedToArray__default["default"](_useWindowSize, 2),
      windowWidth = _useWindowSize2[0],
      windowHeight = _useWindowSize2[1]; // Detect only resize events


  React.useEffect(function () {
    if (mounted.current) {
      config.debug && console.log('ResizeManager', 'reflow() because width changed');
      reflow();
    } else {
      mounted.current = true;
    }
  }, [windowWidth, windowHeight]); // reflow on webfont loaded to prevent misalignments

  React.useEffect(function () {
    if (!resizeOnWebFontLoaded) return;
    var fallbackTimer;

    if ('fonts' in document) {
      document.fonts.ready.then(function () {
        requestIdleCallback$1(reflow);
      });
    } else {
      fallbackTimer = setTimeout(reflow, 1000);
    }

    return function () {
      return clearTimeout(fallbackTimer);
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

  obj.children.forEach(function (child) {
    return setAllCulled(child, overrideCulled);
  });
}

var viewportSize = new three.Vector2(); // Flag that we need global rendering (full screen)

var requestRender = function requestRender() {
  var layers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [0];
  useCanvasStore.getState().globalRenderQueue = useCanvasStore.getState().globalRenderQueue || [0];
  useCanvasStore.getState().globalRenderQueue = [].concat(_toConsumableArray__default["default"](useCanvasStore.getState().globalRenderQueue), _toConsumableArray__default["default"](layers));
};
var renderScissor = function renderScissor(_ref) {
  var gl = _ref.gl,
      scene = _ref.scene,
      camera = _ref.camera,
      left = _ref.left,
      top = _ref.top,
      width = _ref.width,
      height = _ref.height,
      _ref$layer = _ref.layer,
      layer = _ref$layer === void 0 ? 0 : _ref$layer,
      _ref$autoClear = _ref.autoClear,
      autoClear = _ref$autoClear === void 0 ? false : _ref$autoClear,
      _ref$clearDepth = _ref.clearDepth,
      clearDepth = _ref$clearDepth === void 0 ? true : _ref$clearDepth;
  if (!scene || !camera) return;
  var _autoClear = gl.autoClear;
  gl.autoClear = autoClear;
  gl.setScissor(left, top, width, height);
  gl.setScissorTest(true);
  camera.layers.set(layer);
  clearDepth && gl.clearDepth();
  gl.render(scene, camera);
  gl.setScissorTest(false);
  gl.autoClear = _autoClear;
};
var renderViewport = function renderViewport(_ref2) {
  var gl = _ref2.gl,
      scene = _ref2.scene,
      camera = _ref2.camera,
      left = _ref2.left,
      top = _ref2.top,
      width = _ref2.width,
      height = _ref2.height,
      _ref2$layer = _ref2.layer,
      layer = _ref2$layer === void 0 ? 0 : _ref2$layer,
      _ref2$scissor = _ref2.scissor,
      scissor = _ref2$scissor === void 0 ? true : _ref2$scissor,
      _ref2$autoClear = _ref2.autoClear,
      autoClear = _ref2$autoClear === void 0 ? false : _ref2$autoClear,
      _ref2$clearDepth = _ref2.clearDepth,
      clearDepth = _ref2$clearDepth === void 0 ? true : _ref2$clearDepth;
  if (!scene || !camera) return;
  var _autoClear = gl.autoClear;
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
var preloadScene = function preloadScene(scene, camera) {
  var layer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var callback = arguments.length > 3 ? arguments[3] : undefined;
  if (!scene || !camera) return;
  config.preloadQueue.push(function (gl) {
    gl.setScissorTest(false);
    setAllCulled(scene, false);
    camera.layers.set(layer);
    gl.render(scene, camera);
    setAllCulled(scene, true);
    callback && callback();
  }); // auto trigger a new frame for the preload

  fiber.invalidate();
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
  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  });
  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  });
  React.useEffect(function () {
    if (config.debug) {
      window._scrollRig = window._scrollRig || {};
      window._scrollRig.reflow = requestReflow;
    }
  }, []);
  return {
    isCanvasAvailable: isCanvasAvailable,
    hasVirtualScrollbar: hasVirtualScrollbar,
    preloadScene: preloadScene,
    requestRender: requestRender,
    renderScissor: renderScissor,
    renderViewport: renderViewport,
    reflow: requestReflow,
    reflowCompleted: pageReflowCompleted
  };
};

var _excluded$5 = ["makeDefault", "scaleMultiplier"];
var PerspectiveCamera = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var _ref$makeDefault = _ref.makeDefault,
      makeDefault = _ref$makeDefault === void 0 ? false : _ref$makeDefault,
      _ref$scaleMultiplier = _ref.scaleMultiplier,
      scaleMultiplier = _ref$scaleMultiplier === void 0 ? config.scaleMultiplier : _ref$scaleMultiplier,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$5);

  var set = fiber.useThree(function (state) {
    return state.set;
  });
  var camera = fiber.useThree(function (state) {
    return state.camera;
  });
  var size = fiber.useThree(function (state) {
    return state.size;
  });

  var _useScrollRig = useScrollRig(),
      reflowCompleted = _useScrollRig.reflowCompleted;

  var distance = React.useMemo(function () {
    var width = size.width * scaleMultiplier;
    var height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, reflowCompleted, scaleMultiplier]);
  var cameraRef = React.useRef();
  React.useLayoutEffect(function () {
    var width = size.width * scaleMultiplier;
    var height = size.height * scaleMultiplier;
    cameraRef.current.aspect = width / height;
    cameraRef.current.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance));
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
    // Update matrix world since the renderer is a frame late

    cameraRef.current.updateMatrixWorld();
  }, [distance, size]);
  React.useLayoutEffect(function () {
    if (makeDefault && cameraRef.current) {
      var oldCam = camera;
      set({
        camera: cameraRef.current
      });
      return function () {
        return set({
          camera: oldCam
        });
      };
    }
  }, [camera, cameraRef, makeDefault, set]);
  return /*#__PURE__*/React__default["default"].createElement("perspectiveCamera", _extends__default["default"]({
    ref: mergeRefs__default["default"]([cameraRef, ref]),
    position: [0, 0, distance],
    onUpdate: function onUpdate(self) {
      return self.updateProjectionMatrix();
    },
    near: 0.1,
    far: distance * 2
  }, props));
});
PerspectiveCamera.displayName = 'PerspectiveCamera';
var PerspectiveCamera$1 = PerspectiveCamera;

var _excluded$4 = ["makeDefault", "scaleMultiplier"];
var OrthographicCamera = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var _ref$makeDefault = _ref.makeDefault,
      makeDefault = _ref$makeDefault === void 0 ? false : _ref$makeDefault,
      _ref$scaleMultiplier = _ref.scaleMultiplier,
      scaleMultiplier = _ref$scaleMultiplier === void 0 ? config.scaleMultiplier : _ref$scaleMultiplier,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$4);

  var set = fiber.useThree(function (state) {
    return state.set;
  });
  var camera = fiber.useThree(function (state) {
    return state.camera;
  });
  var size = fiber.useThree(function (state) {
    return state.size;
  });

  var _useScrollRig = useScrollRig(),
      reflowCompleted = _useScrollRig.reflowCompleted;

  var distance = React.useMemo(function () {
    var width = size.width * scaleMultiplier;
    var height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, reflowCompleted, scaleMultiplier]);
  var cameraRef = React.useRef();
  React.useLayoutEffect(function () {
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
    // Update matrix world since the renderer is a frame late

    cameraRef.current.updateMatrixWorld();
  }, [distance, size]);
  React.useLayoutEffect(function () {
    if (makeDefault && cameraRef.current) {
      var oldCam = camera;
      set({
        camera: cameraRef.current
      });
      return function () {
        return set({
          camera: oldCam
        });
      };
    }
  }, [camera, cameraRef, makeDefault, set]);
  return /*#__PURE__*/React__default["default"].createElement("orthographicCamera", _extends__default["default"]({
    left: size.width * scaleMultiplier / -2,
    right: size.width * scaleMultiplier / 2,
    top: size.height * scaleMultiplier / 2,
    bottom: size.height * scaleMultiplier / -2,
    far: distance * 2,
    position: [0, 0, distance],
    near: 0.001,
    ref: mergeRefs__default["default"]([cameraRef, ref]),
    onUpdate: function onUpdate(self) {
      return self.updateProjectionMatrix();
    }
  }, props));
});
OrthographicCamera.displayName = 'OrthographicCamera';
var OrthographicCamera$1 = OrthographicCamera;

var DefaultScrollTracker = function DefaultScrollTracker() {
  var hasVirtualScrollbar = useCanvasStore(function (state) {
    return state.hasVirtualScrollbar;
  });
  var setScrollY = useCanvasStore(function (state) {
    return state.setScrollY;
  });
  var setScroll = React.useCallback(function () {
    setScrollY(window.pageYOffset);
  }, [setScrollY]);
  React.useEffect(function () {
    if (!hasVirtualScrollbar) {
      window.addEventListener('scroll', setScroll);
    }

    return function () {
      return window.removeEventListener('scroll', setScroll);
    };
  }, [hasVirtualScrollbar]);
  return null;
};
var DefaultScrollTracker$1 = DefaultScrollTracker;

function ownKeys$4(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$4(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$4(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
/**
 * Global render loop to avoid double renders on the same frame
 */

var GlobalRenderer = function GlobalRenderer(_ref) {
  var children = _ref.children;
  var gl = fiber.useThree(function (s) {
    return s.gl;
  });
  var frameloop = fiber.useThree(function (s) {
    return s.frameloop;
  });
  var canvasChildren = useCanvasStore(function (state) {
    return state.canvasChildren;
  });
  var scrollRig = useScrollRig();
  React.useLayoutEffect(function () {
    gl.debug.checkShaderErrors = config.debug;
  }, []);
  React.useEffect(function () {
    // clear canvas automatically if all children were removed
    if (!children && !Object.keys(canvasChildren).length) {
      config.debug && console.log('GlobalRenderer', 'auto clear empty canvas');
      gl.clear();
    }
  }, [children, canvasChildren]); // PRELOAD RENDER LOOP

  fiber.useFrame(function (_ref2) {
    _ref2.camera;
        _ref2.scene;
    if (!config.preloadQueue.length) return;
    gl.autoClear = false; // Render preload frames first and clear directly

    config.preloadQueue.forEach(function (render) {
      return render(gl);
    }); // cleanup

    gl.clear();
    config.preloadQueue = [];
    gl.autoClear = true; // trigger new frame to get correct visual state after all preloads

    config.debug && console.log('GlobalRenderer', 'preload complete. trigger global render');
    scrollRig.requestRender();
    fiber.invalidate();
  }, config.PRIORITY_PRELOAD); // GLOBAL RENDER LOOP

  fiber.useFrame(function (_ref3) {
    var camera = _ref3.camera,
        scene = _ref3.scene;
    var globalRenderQueue = useCanvasStore.getState().globalRenderQueue; // Render if requested or if always on

    if (config.globalRender && (frameloop === 'always' || globalRenderQueue)) {
      if (config.disableAutoClear) {
        gl.autoClear = false; // will fail in VR
      } // render default layer, scene, camera


      camera.layers.disableAll();

      if (globalRenderQueue) {
        globalRenderQueue.forEach(function (layer) {
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
  return /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, Object.keys(canvasChildren).map(function (key, i) {
    var _canvasChildren$key = canvasChildren[key],
        mesh = _canvasChildren$key.mesh,
        props = _canvasChildren$key.props;

    if (typeof mesh === 'function') {
      return /*#__PURE__*/React__default["default"].createElement(React.Fragment, {
        key: key
      }, mesh(_objectSpread$4(_objectSpread$4({
        key: key
      }, scrollRig), props)));
    }

    return /*#__PURE__*/React__default["default"].cloneElement(mesh, _objectSpread$4({
      key: key
    }, props));
  }), children);
};

var GlobalRenderer$1 = GlobalRenderer;

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf__default["default"](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default["default"](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default["default"](this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var CanvasErrorBoundary = /*#__PURE__*/function (_React$Component) {
  _inherits__default["default"](CanvasErrorBoundary, _React$Component);

  var _super = _createSuper(CanvasErrorBoundary);

  function CanvasErrorBoundary(props) {
    var _this;

    _classCallCheck__default["default"](this, CanvasErrorBoundary);

    _this = _super.call(this, props);
    _this.state = {
      error: false
    };
    _this.props = props;
    return _this;
  }

  _createClass__default["default"](CanvasErrorBoundary, [{
    key: "render",
    value: // componentDidCatch(error, errorInfo) {
    //   // You can also log the error to an error reporting service
    //   // logErrorToMyService(error, errorInfo)
    // }
    function render() {
      if (this.state.error) {
        this.props.onError && this.props.onError(this.state.error);
        return null;
      }

      return this.props.children;
    }
  }], [{
    key: "getDerivedStateFromError",
    value: function getDerivedStateFromError(error) {
      // Update state so the next render will show the fallback UI.
      return {
        error: error
      };
    }
  }]);

  return CanvasErrorBoundary;
}(React__default["default"].Component);

var CanvasErrorBoundary$1 = CanvasErrorBoundary;

var _excluded$3 = ["as", "children", "gl", "style", "orthographic", "config", "camera", "fallback"],
    _excluded2 = ["onError"];

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$3(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var GlobalCanvas = function GlobalCanvas(_ref) {
  var _ref$as = _ref.as,
      as = _ref$as === void 0 ? fiber.Canvas : _ref$as,
      children = _ref.children,
      gl = _ref.gl,
      style = _ref.style,
      orthographic = _ref.orthographic,
      confOverrides = _ref.config,
      camera = _ref.camera,
      _ref$fallback = _ref.fallback,
      fallback = _ref$fallback === void 0 ? null : _ref$fallback,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$3);

  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  }); // override config

  React.useMemo(function () {
    Object.assign(config, confOverrides); // Querystring overrides

    var qs = queryString__default["default"].parse(window.location.search); // show FPS counter on request

    if (typeof qs.fps !== 'undefined') {
      config.fps = true;
    } // show debug statements


    if (typeof qs.debug !== 'undefined') {
      config.debug = true;
    }
  }, [confOverrides]);
  var CanvasElement = as;
  return /*#__PURE__*/React__default["default"].createElement(CanvasElement, _extends__default["default"]({
    className: "ScrollRigCanvas" // use our own default camera
    ,
    camera: null // Some sane defaults
    ,
    gl: _objectSpread$3({
      antialias: true,
      alpha: true,
      depth: true,
      powerPreference: 'high-performance',
      // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
      failIfMajorPerformanceCaveat: true
    }, gl) // polyfill old iOS safari
    ,
    resize: {
      scroll: false,
      debounce: 0,
      polyfill: resizeObserver.ResizeObserver
    } // default pixelratio
    ,
    dpr: [1, 2] // default styles
    ,
    style: _objectSpread$3({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '100vh',
      // use 100vh to avoid resize on iOS when url bar goes away
      transform: 'translateZ(0)'
    }, style) // allow to override anything of the above

  }, props), /*#__PURE__*/React__default["default"].createElement(React.Suspense, {
    fallback: fallback
  }, children, /*#__PURE__*/React__default["default"].createElement(GlobalRenderer$1, null)), !orthographic && /*#__PURE__*/React__default["default"].createElement(PerspectiveCamera$1, _extends__default["default"]({
    makeDefault: true
  }, camera)), orthographic && /*#__PURE__*/React__default["default"].createElement(OrthographicCamera$1, _extends__default["default"]({
    makeDefault: true
  }, camera)), config.debug && /*#__PURE__*/React__default["default"].createElement(StatsDebug$1, null), config.fps && /*#__PURE__*/React__default["default"].createElement(Stats, null), /*#__PURE__*/React__default["default"].createElement(ResizeManager$1, {
    reflow: requestReflow
  }), /*#__PURE__*/React__default["default"].createElement(DefaultScrollTracker$1, null));
};

var GlobalCanvasIfSupported = function GlobalCanvasIfSupported(_ref2) {
  var _onError = _ref2.onError,
      props = _objectWithoutProperties__default["default"](_ref2, _excluded2);

  var setCanvasAvailable = useCanvasStore(function (state) {
    return state.setCanvasAvailable;
  });
  React.useLayoutEffect(function () {
    document.documentElement.classList.add('js-has-global-canvas');
  }, []);
  return /*#__PURE__*/React__default["default"].createElement(CanvasErrorBoundary$1, {
    onError: function onError(err) {
      _onError && _onError(err);
      setCanvasAvailable(false);
      /* WebGL failed to init */

      document.documentElement.classList.remove('js-has-global-canvas');
      document.documentElement.classList.add('js-global-canvas-error');
    }
  }, /*#__PURE__*/React__default["default"].createElement(GlobalCanvas, props));
};

var GlobalCanvasIfSupported$1 = GlobalCanvasIfSupported;

var DebugMaterial = shaderMaterial.shaderMaterial({
  color: new three.Color(1.0, 0.0, 0.0),
  opacity: 1
}, // vertex shader
" varying vec2 vUv;\n    void main() {\n      vUv = uv;\n      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  }", // fragment shader
"\n    uniform vec3 color;\n    uniform float opacity;\n    varying vec2 vUv;\n    void main() {\n      gl_FragColor.rgba = vec4(color, opacity);\n    }\n  ");
fiber.extend({
  DebugMaterial: DebugMaterial
});
var DebugMesh = function DebugMesh(_ref) {
  var scale = _ref.scale;
  return /*#__PURE__*/React__default["default"].createElement("mesh", null, /*#__PURE__*/React__default["default"].createElement("planeBufferGeometry", {
    attach: "geometry",
    args: [scale.width, scale.height, 1, 1]
  }), /*#__PURE__*/React__default["default"].createElement("debugMaterial", {
    color: "hotpink",
    attach: "material",
    transparent: true,
    opacity: 0.5
  }));
};
var DebugMesh$1 = DebugMesh;

var _excluded$2 = ["el", "lerp", "lerpOffset", "children", "renderOrder", "priority", "margin", "inViewportMargin", "visible", "scissor", "debug", "setInViewportProp", "updateLayout", "positionFixed", "hiddenStyle", "resizeDelay", "as", "autoRender", "hideOffscreen"];

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$2(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned and scaled exactly above DOM element
 *
 * @author david@14islands.com
 */

exports.ScrollScene = function ScrollScene(_ref) {
  var el = _ref.el,
      lerp = _ref.lerp,
      _ref$lerpOffset = _ref.lerpOffset,
      lerpOffset = _ref$lerpOffset === void 0 ? 1 : _ref$lerpOffset,
      children = _ref.children,
      _ref$renderOrder = _ref.renderOrder,
      renderOrder = _ref$renderOrder === void 0 ? 1 : _ref$renderOrder,
      _ref$priority = _ref.priority,
      priority = _ref$priority === void 0 ? config.PRIORITY_SCISSORS : _ref$priority,
      _ref$margin = _ref.margin,
      margin = _ref$margin === void 0 ? 14 : _ref$margin,
      inViewportMargin = _ref.inViewportMargin,
      _ref$visible = _ref.visible,
      visible = _ref$visible === void 0 ? true : _ref$visible,
      _ref$scissor = _ref.scissor,
      scissor = _ref$scissor === void 0 ? false : _ref$scissor,
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? false : _ref$debug,
      _ref$setInViewportPro = _ref.setInViewportProp,
      setInViewportProp = _ref$setInViewportPro === void 0 ? false : _ref$setInViewportPro,
      _ref$updateLayout = _ref.updateLayout,
      updateLayout = _ref$updateLayout === void 0 ? 0 : _ref$updateLayout,
      _ref$positionFixed = _ref.positionFixed,
      positionFixed = _ref$positionFixed === void 0 ? false : _ref$positionFixed,
      _ref$hiddenStyle = _ref.hiddenStyle,
      hiddenStyle = _ref$hiddenStyle === void 0 ? {
    opacity: 0
  } : _ref$hiddenStyle,
      _ref$resizeDelay = _ref.resizeDelay,
      resizeDelay = _ref$resizeDelay === void 0 ? 0 : _ref$resizeDelay,
      _ref$as = _ref.as,
      as = _ref$as === void 0 ? 'scene' : _ref$as,
      _ref$autoRender = _ref.autoRender,
      autoRender = _ref$autoRender === void 0 ? true : _ref$autoRender,
      _ref$hideOffscreen = _ref.hideOffscreen,
      hideOffscreen = _ref$hideOffscreen === void 0 ? true : _ref$hideOffscreen,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$2);

  var inlineSceneRef = React.useCallback(function (node) {
    if (node !== null) {
      setScene(node);
    }
  }, []);

  var _useState = React.useState(scissor ? new three.Scene() : null),
      _useState2 = _slicedToArray__default["default"](_useState, 2),
      scene = _useState2[0],
      setScene = _useState2[1];

  var _useState3 = React.useState(false),
      _useState4 = _slicedToArray__default["default"](_useState3, 2),
      inViewport = _useState4[0],
      setInViewport = _useState4[1];

  var _useState5 = React.useState(null),
      _useState6 = _slicedToArray__default["default"](_useState5, 2),
      scale = _useState6[0],
      setScale = _useState6[1];

  var _useThree = fiber.useThree(),
      size = _useThree.size,
      invalidate = _useThree.invalidate;

  var _useScrollRig = useScrollRig(),
      requestRender = _useScrollRig.requestRender,
      renderScissor = _useScrollRig.renderScissor;

  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  }); // get initial scrollY and listen for transient updates

  var scrollY = React.useRef(useCanvasStore.getState().scrollY);
  React.useEffect(function () {
    return useCanvasStore.subscribe(function (state) {
      return state.scrollY;
    }, function (y) {
      scrollY.current = y;
      invalidate(); // Trigger render on scroll
    });
  }, []); // non-reactive state

  var _transient = React.useRef({
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
  React.useEffect(function () {
    _transient.mounted = true;
    return function () {
      return _transient.mounted = false;
    };
  }, []);
  React.useLayoutEffect(function () {
    // hide image - leave in DOM to measure and get events
    if (!(el !== null && el !== void 0 && el.current)) return;

    if (debug) {
      el.current.style.opacity = 0.5;
    } else {
      Object.assign(el.current.style, _objectSpread$2({}, hiddenStyle));
    }

    return function () {
      if (!(el !== null && el !== void 0 && el.current)) return;
      Object.keys(hiddenStyle).forEach(function (key) {
        return el.current.style[key] = '';
      });
    };
  }, [el.current]);

  var updateSizeAndPosition = function updateSizeAndPosition() {
    if (!el || !el.current || !scene) {
      return;
    }

    var bounds = _transient.bounds,
        prevBounds = _transient.prevBounds;

    var _el$current$getBoundi = el.current.getBoundingClientRect(),
        top = _el$current$getBoundi.top,
        left = _el$current$getBoundi.left,
        width = _el$current$getBoundi.width,
        height = _el$current$getBoundi.height; // pixel bounds


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

    if (_transient.isFirstRender) {
      prevBounds.y = top - bounds.centerOffset;
      _transient.isFirstRender = false;
    }

    invalidate(); // trigger render
  }; // Find bounding box & scale mesh on resize


  React.useLayoutEffect(function () {
    var timer = setTimeout(function () {
      updateSizeAndPosition();
    }, resizeDelay);
    return function () {
      clearTimeout(timer);
    };
  }, [pageReflowCompleted, updateLayout, scene]); // RENDER FRAME

  fiber.useFrame(function (_ref2, frameDelta) {
    var gl = _ref2.gl,
        camera = _ref2.camera;
        _ref2.clock;
    if (!scene || !scale) return;
    var bounds = _transient.bounds,
        prevBounds = _transient.prevBounds; // Find new Y based on cached position and scroll

    var initialPos = config.subpixelScrolling ? bounds.top - bounds.centerOffset : Math.floor(bounds.top - bounds.centerOffset);
    var y = initialPos - scrollY.current; // frame delta

    var delta = Math.abs(prevBounds.y - y); // Lerp the distance to simulate easing

    var lerpY = _lerp__default["default"](prevBounds.y, y, (lerp || config.scrollLerp) * lerpOffset, frameDelta);

    var newY = config.subpixelScrolling ? lerpY : Math.floor(lerpY); // Abort if element not in screen

    var scrollMargin = inViewportMargin || size.height * 0.33;
    var isOffscreen = hideOffscreen && (newY + size.height * 0.5 + scale.pixelHeight * 0.5 < -scrollMargin || newY + size.height * 0.5 - scale.pixelHeight * 0.5 > size.height + scrollMargin); // store top value for next frame

    bounds.inViewport = !isOffscreen;
    setInViewportProp && requestIdleCallback$1(function () {
      return _transient.mounted && setInViewport(!isOffscreen);
    });
    prevBounds.y = lerpY; // hide/show scene

    scene.visible = !isOffscreen && visible;

    if (scene.visible) {
      // move scene
      if (!positionFixed) {
        scene.position.y = -newY * config.scaleMultiplier;
      }

      var positiveYUpBottom = size.height * 0.5 - (newY + scale.pixelHeight * 0.5); // inverse Y

      if (scissor) {
        autoRender && renderScissor({
          gl: gl,
          scene: scene,
          camera: camera,
          left: bounds.left - margin,
          top: positiveYUpBottom - margin,
          width: bounds.width + margin * 2,
          height: bounds.height + margin * 2
        });
      } else {
        autoRender && requestRender();
      } // calculate progress of passing through viewport (0 = just entered, 1 = just exited)


      var pxInside = bounds.top - newY - bounds.top + size.height - bounds.centerOffset;
      bounds.progress = three.MathUtils.mapLinear(pxInside, 0, size.height + scale.pixelHeight, 0, 1); // percent of total visible distance

      bounds.visibility = three.MathUtils.mapLinear(pxInside, 0, scale.pixelHeight, 0, 1); // percent of item height in view

      bounds.viewport = three.MathUtils.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
    } // render another frame if delta is large enough


    if (!isOffscreen && delta > config.scrollRestDelta) {
      invalidate();
    }
  }, priority);
  var content = /*#__PURE__*/React__default["default"].createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && scale && /*#__PURE__*/React__default["default"].createElement(DebugMesh$1, {
    scale: scale
  }), children && scene && scale && children(_objectSpread$2({
    // inherited props
    el: el,
    lerp: lerp || config.scrollLerp,
    lerpOffset: lerpOffset,
    margin: margin,
    renderOrder: renderOrder,
    // new props
    scale: scale,
    state: _transient,
    // @deprecated
    scrollState: _transient.bounds,
    scene: scene,
    inViewport: inViewport,
    // useFrame render priority (in case children need to run after)
    priority: priority + renderOrder
  }, props))); // portal if scissor or inline nested scene

  var InlineElement = as;
  return scissor ? fiber.createPortal(content, scene) : /*#__PURE__*/React__default["default"].createElement(InlineElement, {
    ref: inlineSceneRef
  }, content);
};

exports.ScrollScene = /*#__PURE__*/React__default["default"].memo(exports.ScrollScene);
exports.ScrollScene.childPropTypes = _objectSpread$2(_objectSpread$2({}, exports.ScrollScene.propTypes), {}, {
  scale: PropTypes__default["default"].shape({
    width: PropTypes__default["default"].number,
    height: PropTypes__default["default"].number
  }),
  state: PropTypes__default["default"].shape({
    bounds: PropTypes__default["default"].shape({
      left: PropTypes__default["default"].number,
      top: PropTypes__default["default"].number,
      width: PropTypes__default["default"].number,
      height: PropTypes__default["default"].number,
      inViewport: PropTypes__default["default"].bool,
      progress: PropTypes__default["default"].number,
      visibility: PropTypes__default["default"].number,
      viewport: PropTypes__default["default"].number
    })
  }),
  scene: PropTypes__default["default"].object,
  // Parent scene,
  inViewport: PropTypes__default["default"].bool // {x,y} to scale

});
exports.ScrollScene.priority = config.PRIORITY_SCISSORS;

var _excluded$1 = ["el", "lerp", "lerpOffset", "children", "margin", "visible", "renderOrder", "priority", "debug", "setInViewportProp", "scaleMultiplier", "orthographic", "hiddenStyle", "resizeDelay"];

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is rendered into a GL viewport matching the DOM position for better performance
 *
 * Adapted to @react-three/fiber from https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
 * @author david@14islands.com
 */

exports.ViewportScrollScene = function ViewportScrollScene(_ref) {
  var el = _ref.el,
      lerp = _ref.lerp,
      _ref$lerpOffset = _ref.lerpOffset,
      lerpOffset = _ref$lerpOffset === void 0 ? 1 : _ref$lerpOffset,
      children = _ref.children,
      _ref$margin = _ref.margin,
      margin = _ref$margin === void 0 ? 0 : _ref$margin,
      _ref$visible = _ref.visible,
      visible = _ref$visible === void 0 ? true : _ref$visible,
      renderOrder = _ref.renderOrder,
      _ref$priority = _ref.priority,
      priority = _ref$priority === void 0 ? config.PRIORITY_VIEWPORTS : _ref$priority,
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? false : _ref$debug,
      _ref$setInViewportPro = _ref.setInViewportProp,
      setInViewportProp = _ref$setInViewportPro === void 0 ? false : _ref$setInViewportPro,
      _ref$scaleMultiplier = _ref.scaleMultiplier,
      scaleMultiplier = _ref$scaleMultiplier === void 0 ? config.scaleMultiplier : _ref$scaleMultiplier,
      _ref$orthographic = _ref.orthographic,
      orthographic = _ref$orthographic === void 0 ? false : _ref$orthographic,
      _ref$hiddenStyle = _ref.hiddenStyle,
      hiddenStyle = _ref$hiddenStyle === void 0 ? {
    opacity: 0
  } : _ref$hiddenStyle,
      _ref$resizeDelay = _ref.resizeDelay,
      resizeDelay = _ref$resizeDelay === void 0 ? 0 : _ref$resizeDelay,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$1);

  var camera = React.useRef();

  var _useState = React.useState(function () {
    return new three.Scene();
  }),
      _useState2 = _slicedToArray__default["default"](_useState, 1),
      scene = _useState2[0];

  var _useState3 = React.useState(false),
      _useState4 = _slicedToArray__default["default"](_useState3, 2),
      inViewport = _useState4[0],
      setInViewport = _useState4[1];

  var _useState5 = React.useState(null),
      _useState6 = _slicedToArray__default["default"](_useState5, 2),
      scale = _useState6[0],
      setScale = _useState6[1];

  var _useThree = fiber.useThree(),
      size = _useThree.size,
      invalidate = _useThree.invalidate;

  var _useScrollRig = useScrollRig(),
      renderViewport = _useScrollRig.renderViewport;

  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  });

  var _useState7 = React.useState(0),
      _useState8 = _slicedToArray__default["default"](_useState7, 2),
      cameraDistance = _useState8[0],
      setCameraDistance = _useState8[1]; // non-reactive state


  var _transient = React.useRef({
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

  var scrollY = React.useRef(useCanvasStore.getState().scrollY);
  React.useEffect(function () {
    return useCanvasStore.subscribe(function (state) {
      return state.scrollY;
    }, function (y) {
      scrollY.current = y;
      invalidate(); // Trigger render on scroll
    });
  }, []);
  React.useEffect(function () {
    _transient.mounted = true;
    return function () {
      _transient.mounted = false;
    };
  }, []); // El is rendered

  React.useLayoutEffect(function () {
    // hide image - leave in DOM to measure and get events
    if (!(el !== null && el !== void 0 && el.current)) return;

    if (debug) {
      el.current.style.opacity = 0.5;
    } else {
      Object.assign(el.current.style, _objectSpread$1({}, hiddenStyle));
    }

    return function () {
      if (!(el !== null && el !== void 0 && el.current)) return;
      Object.keys(hiddenStyle).forEach(function (key) {
        return el.current.style[key] = '';
      });
    };
  }, [el.current]);

  var updateSizeAndPosition = function updateSizeAndPosition() {
    if (!el || !el.current) return;
    var bounds = _transient.bounds,
        prevBounds = _transient.prevBounds;

    var _el$current$getBoundi = el.current.getBoundingClientRect(),
        top = _el$current$getBoundi.top,
        left = _el$current$getBoundi.left,
        width = _el$current$getBoundi.width,
        height = _el$current$getBoundi.height; // pixel bounds


    bounds.top = top + window.pageYOffset;
    bounds.left = left;
    bounds.width = width;
    bounds.height = height;
    prevBounds.top = top;
    var viewportWidth = width * scaleMultiplier;
    var viewportHeight = height * scaleMultiplier; // scale in viewport units and pixel

    setScale({
      width: viewportWidth,
      height: viewportHeight,
      multiplier: scaleMultiplier,
      pixelWidth: width,
      pixelHeight: height,
      viewportWidth: size.width * scaleMultiplier,
      viewportHeight: size.height * scaleMultiplier
    });
    var cameraDistance = Math.max(viewportWidth, viewportHeight);
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


  React.useLayoutEffect(function () {
    var timer = setTimeout(function () {
      updateSizeAndPosition();
    }, resizeDelay);
    return function () {
      clearTimeout(timer);
    };
  }, [pageReflowCompleted]); // RENDER FRAME

  fiber.useFrame(function (_ref2, frameDelta) {
    var gl = _ref2.gl;
    if (!scene || !scale) return;
    var bounds = _transient.bounds,
        prevBounds = _transient.prevBounds; // add scroll value to bounds to get current position

    var initialPos = config.subpixelScrolling ? bounds.top : Math.floor(bounds.top);
    var topY = initialPos - scrollY.current; // frame delta

    var delta = Math.abs(prevBounds.top - topY); // Lerp the distance to simulate easing

    var lerpTop = _lerp__default["default"](prevBounds.top, topY, (lerp || config.scrollLerp) * lerpOffset, frameDelta);

    var newTop = config.subpixelScrolling ? lerpTop : Math.floor(lerpTop); // Abort if element not in screen

    var isOffscreen = newTop + bounds.height < -100 || newTop > size.height + 100; // store top value for next frame

    bounds.inViewport = !isOffscreen;
    setInViewportProp && requestIdleCallback$1(function () {
      return _transient.mounted && setInViewport(!isOffscreen);
    });
    prevBounds.top = lerpTop; // hide/show scene

    scene.visible = !isOffscreen && visible; // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas

    if (scene.visible) {
      var positiveYUpBottom = size.height - (newTop + bounds.height); // inverse Y

      renderViewport({
        gl: gl,
        scene: scene,
        camera: camera.current,
        left: bounds.left - margin,
        top: positiveYUpBottom - margin,
        width: bounds.width + margin * 2,
        height: bounds.height + margin * 2
      }); // calculate progress of passing through viewport (0 = just entered, 1 = just exited)

      var pxInside = bounds.top - newTop - bounds.top + size.height;
      bounds.progress = three.MathUtils.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1); // percent of total visible distance

      bounds.visibility = three.MathUtils.mapLinear(pxInside, 0, bounds.height, 0, 1); // percent of item height in view

      bounds.viewport = three.MathUtils.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
    } // render another frame if delta is large enough


    if (!isOffscreen && delta > config.scrollRestDelta) {
      invalidate();
    }
  }, priority);
  return fiber.createPortal( /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, !orthographic && /*#__PURE__*/React__default["default"].createElement("perspectiveCamera", {
    ref: camera,
    position: [0, 0, cameraDistance],
    onUpdate: function onUpdate(self) {
      return self.updateProjectionMatrix();
    }
  }), orthographic && /*#__PURE__*/React__default["default"].createElement("orthographicCamera", {
    ref: camera,
    position: [0, 0, cameraDistance],
    onUpdate: function onUpdate(self) {
      return self.updateProjectionMatrix();
    },
    left: scale.width / -2,
    right: scale.width / 2,
    top: scale.height / 2,
    bottom: scale.height / -2,
    far: cameraDistance * 2,
    near: 0.001
  }), /*#__PURE__*/React__default["default"].createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && scale && /*#__PURE__*/React__default["default"].createElement(DebugMesh$1, {
    scale: scale
  }), children && scene && scale && children(_objectSpread$1({
    // inherited props
    el: el,
    lerp: lerp || config.scrollLerp,
    lerpOffset: lerpOffset,
    margin: margin,
    renderOrder: renderOrder,
    // new props
    scale: scale,
    state: _transient,
    // @deprecated
    scrollState: _transient.bounds,
    scene: scene,
    camera: camera.current,
    inViewport: inViewport,
    // useFrame render priority (in case children need to run after)
    priority: priority + renderOrder
  }, props)))), scene);
};

exports.ViewportScrollScene = /*#__PURE__*/React__default["default"].memo(exports.ViewportScrollScene);
exports.ViewportScrollScene.childPropTypes = _objectSpread$1(_objectSpread$1({}, exports.ViewportScrollScene.propTypes), {}, {
  scale: PropTypes__default["default"].shape({
    width: PropTypes__default["default"].number,
    height: PropTypes__default["default"].number
  }),
  state: PropTypes__default["default"].shape({
    bounds: PropTypes__default["default"].shape({
      left: PropTypes__default["default"].number,
      top: PropTypes__default["default"].number,
      width: PropTypes__default["default"].number,
      height: PropTypes__default["default"].number,
      inViewport: PropTypes__default["default"].bool,
      progress: PropTypes__default["default"].number
    })
  }),
  scene: PropTypes__default["default"].object,
  // Parent scene,
  inViewport: PropTypes__default["default"].bool // {x,y} to scale

});

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var LAYOUT_LERP = 0.1;
/**
 * Render child element in portal and move using useFrame so we can and match the lerp of the VirtualScrollbar
 * TThe original el used for position
 * @author david@14islands.com
 */

var ScrollDomPortal = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var el = _ref.el,
      portalEl = _ref.portalEl,
      lerp = _ref.lerp,
      _ref$lerpOffset = _ref.lerpOffset,
      lerpOffset = _ref$lerpOffset === void 0 ? 1 : _ref$lerpOffset,
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
    offsetX: 0,
    raf: -1,
    lastFrame: -1
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
  var viewportHeight = windowSize.useWindowHeight();
  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  });

  var invalidate = function invalidate() {
    window.cancelAnimationFrame(local.raf);
    local.raf = window.requestAnimationFrame(frame);
  }; // get initial scrollY and listen for transient updates


  var scrollY = React.useRef(useCanvasStore.getState().scrollY);
  React.useEffect(function () {
    return useCanvasStore.subscribe(function (state) {
      return state.scrollY;
    }, function (y) {
      scrollY.current = y;
      invalidate(); // Trigger render on scroll
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
    invalidate();
  }, [el]); // TODO: decide if react to size.height to avoid mobile viewport scroll bugs

  var updateSizeAndPosition = function updateSizeAndPosition() {
    if (!el || !el.current) return;
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
    invalidate();
  }; // Update position on window resize


  React.useEffect(function () {
    updateSizeAndPosition();
  }, [pageReflowCompleted]); // Update position if `live` flag changes

  React.useEffect(function () {
    var id = requestIdleCallback(updateSizeAndPosition, {
      timeout: 100
    });
    return function () {
      return cancelIdleCallback(id);
    };
  }, [live]); // RENDER FRAME

  var frame = function frame(ts) {
    var _getOffset, _getOffset2;

    var top = bounds.top,
        height = bounds.height;

    if (!local.lastFrame) {
      local.lastFrame = ts;
    }

    var frameDelta = (ts - local.lastFrame) * 0.001;
    local.lastFrame = ts; // get offset from resizing window + offset from callback function from parent

    var offsetX = local.offsetX + (live && ((_getOffset = getOffset()) === null || _getOffset === void 0 ? void 0 : _getOffset.x) || 0);
    var offsetY = local.offsetY + (live && ((_getOffset2 = getOffset()) === null || _getOffset2 === void 0 ? void 0 : _getOffset2.y) || 0); // add scroll value to bounds to get current position

    var scrollTop = -scrollY.current; // frame delta

    var deltaScroll = prevBounds.top - scrollTop;
    var delta = Math.abs(deltaScroll) + Math.abs(prevBounds.x - offsetX) + Math.abs(prevBounds.y - offsetY);

    if (!local.needUpdate && delta < config.scrollRestDelta) {
      // abort if no delta change
      return;
    } // Lerp the distance


    var lerpScroll = _lerp__default["default"](prevBounds.top, scrollTop, (lerp || config.scrollLerp) * lerpOffset, frameDelta);

    var lerpX = _lerp__default["default"](prevBounds.x, offsetX, layoutLerp, frameDelta);

    var lerpY = _lerp__default["default"](prevBounds.y, offsetY, layoutLerp, frameDelta); // Abort if element not in screen


    var elTop = top + lerpScroll + lerpY;
    var isOffscreen = elTop + height < -100 || elTop > viewportHeight + 100; // Update DOM element position if in view, or if was in view last frame

    if (!isOffscreen) {
      if (copyEl.current) {
        Object.assign(copyEl.current.style, _objectSpread(_objectSpread({
          visibility: ''
        }, style), {}, {
          transform: "translate3d(".concat(lerpX, "px, ").concat(lerpScroll + lerpY, "px, 0)")
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

  var child = React__default["default"].Children.only( /*#__PURE__*/React__default["default"].cloneElement(children, {
    ref: copyEl
  }));

  if (portalEl) {
    return /*#__PURE__*/ReactDOM__default["default"].createPortal(child, portalEl);
  }

  return child;
});
ScrollDomPortal.displayName = 'ScrollDomPortal';
ScrollDomPortal.propTypes = {
  el: PropTypes__default["default"].object,
  // DOM element to track,
  portalEl: PropTypes__default["default"].object,
  // DOM element to portal into,
  lerp: PropTypes__default["default"].number,
  // Base lerp ratio
  lerpOffset: PropTypes__default["default"].number,
  // Offset factor applied to `lerp`
  zIndex: PropTypes__default["default"].number,
  // z-index to apply to the cloned element
  getOffset: PropTypes__default["default"].func,
  // called for every frame to get {x,y} translation offset
  live: PropTypes__default["default"].bool,
  layoutLerp: PropTypes__default["default"].number,
  style: PropTypes__default["default"].object
};

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted
 * @param {object} object THREE.js object3d
 */

var useCanvas = function useCanvas(object) {
  var deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var key = arguments.length > 2 ? arguments[2] : undefined;
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
    requestIdleCallback$1(function () {
      return updateCanvas(uniqueKey, props);
    }, {
      timeout: 100
    });
  };

  return set;
};

/**
 * Public interface for ScrollRig
 */

var useScrollbar = function useScrollbar() {
  var hasVirtualScrollbar = useCanvasStore(function (state) {
    return state.hasVirtualScrollbar;
  });
  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  });
  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  });
  return {
    hasVirtualScrollbar: hasVirtualScrollbar,
    reflow: requestReflow,
    reflowCompleted: pageReflowCompleted
  };
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

var supportsImageBitmap = typeof createImageBitmap !== 'undefined' && /Firefox/.test(navigator.userAgent) === false; // Override fetch to prefer cached images by default

if (typeof window !== 'undefined') {
  var realFetch = window.fetch;

  window.fetch = function (url) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      cache: 'force-cache'
    };

    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    return realFetch.apply(void 0, [url, options].concat(args));
  };
}

var useTextureLoader = function useTextureLoader(url) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$disableMipmaps = _ref.disableMipmaps,
      disableMipmaps = _ref$disableMipmaps === void 0 ? false : _ref$disableMipmaps;

  var _useState = React.useState(),
      _useState2 = _slicedToArray__default["default"](_useState, 2),
      texture = _useState2[0],
      setTexture = _useState2[1];

  var _useState3 = React.useState(),
      _useState4 = _slicedToArray__default["default"](_useState3, 2),
      imageBitmap = _useState4[0],
      setImageBitmap = _useState4[1];

  var _useThree = fiber.useThree(),
      gl = _useThree.gl;

  var isWebGL2 = gl.capabilities.isWebGL2;
  var useImageBitmap = isWebGL2 && supportsImageBitmap; // webgl2 supports NPOT images so we have less flipY logic

  if (typeof window !== 'undefined') {
    window._useImageBitmap = useImageBitmap;
  }

  var disposeBitmap = React.useCallback(function () {
    if (imageBitmap && imageBitmap.close) {
      imageBitmap.close();
      setImageBitmap(null);
    }
  }, [imageBitmap]);

  var loadTexture = function loadTexture(url) {
    var loader;

    if (useImageBitmap) {
      loader = new three.ImageBitmapLoader(); // Flip if texture

      loader.setOptions({
        imageOrientation: 'flipY',
        premultiplyAlpha: 'none'
      });
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
var useImgTagAsTexture = function useImgTagAsTexture(imgEl, opts) {
  var _useState5 = React.useState(null),
      _useState6 = _slicedToArray__default["default"](_useState5, 2),
      url = _useState6[0],
      setUrl = _useState6[1];

  var _useTextureLoader = useTextureLoader(url, opts),
      _useTextureLoader2 = _slicedToArray__default["default"](_useTextureLoader, 2),
      texture = _useTextureLoader2[0],
      disposeBitmap = _useTextureLoader2[1];

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

// if r3f frameloop should be used, pass these props:
// const R3F_HijackedScrollbar = props => {
//   return <HijackedScrollbar {...props} useUpdateLoop={addEffect} useRenderLoop={addEffect}  invalidate={invalidate} />
// }

function map_range(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

var DRAG_ACTIVE_LERP = 0.3;
var DRAG_INERTIA_LERP = 0.05;
var HijackedScrollbar = function HijackedScrollbar(_ref) {
  var children = _ref.children,
      disabled = _ref.disabled,
      onUpdate = _ref.onUpdate,
      _ref$speed = _ref.speed,
      speed = _ref$speed === void 0 ? 1 : _ref$speed,
      lerp = _ref.lerp,
      restDelta = _ref.restDelta,
      location = _ref.location,
      useUpdateLoop = _ref.useUpdateLoop,
      useRenderLoop = _ref.useRenderLoop,
      invalidate = _ref.invalidate,
      _ref$subpixelScrollin = _ref.subpixelScrolling,
      subpixelScrolling = _ref$subpixelScrollin === void 0 ? false : _ref$subpixelScrollin;
  var setVirtualScrollbar = useCanvasStore(function (state) {
    return state.setVirtualScrollbar;
  });
  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  });
  var pageReflowRequested = useCanvasStore(function (state) {
    return state.pageReflowRequested;
  });
  var setScrollY = useCanvasStore(function (state) {
    return state.setScrollY;
  });

  var _useWindowSize = windowSize.useWindowSize({
    wait: 100
  }),
      _useWindowSize2 = _slicedToArray__default["default"](_useWindowSize, 2),
      width = _useWindowSize2[0],
      height = _useWindowSize2[1]; // run before ResizeManager


  var ref = React.useRef();
  var y = React.useRef({
    current: 0,
    target: 0
  }).current;
  var roundedY = React.useRef(0);
  var scrolling = React.useRef(false);
  var preventPointer = React.useRef(false);
  var documentHeight = React.useRef(0);
  var delta = React.useRef(0);
  var lastFrame = React.useRef(0);
  var originalLerp = React.useMemo(function () {
    return lerp || config.scrollLerp;
  }, [lerp]);

  var setScrollPosition = function setScrollPosition() {
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

  var animate = function animate(ts) {
    var frameDelta = ts - lastFrame.current;
    lastFrame.current = ts;
    if (!scrolling.current) return; // use internal target with floating point precision to make sure lerp is smooth

    var newTarget = _lerp__default["default"](y.current, y.target, config.scrollLerp, frameDelta * 0.001);

    delta.current = Math.abs(y.current - newTarget);
    y.current = newTarget; // round for scrollbar

    roundedY.current = config.subpixelScrolling ? y.current : Math.floor(y.current);

    if (!useRenderLoop) {
      setScrollPosition();
    }
  };

  var scrollTo = React.useCallback(function (newY) {
    var lerp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : originalLerp;
    config.scrollLerp = lerp;
    y.target = Math.min(Math.max(newY, 0), documentHeight.current);

    if (!scrolling.current) {
      scrolling.current = true;
      invalidate ? invalidate() : window.requestAnimationFrame(animate);
      setTimeout(function () {
        preventPointerEvents(true);
        preventPointer.current = true;
      }, 0);
    }

    setScrollY(y.target);
  }, []); // disable pointer events while scrolling to avoid slow event handlers

  var preventPointerEvents = function preventPointerEvents(prevent) {
    if (ref.current) {
      ref.current.style.pointerEvents = prevent ? 'none' : '';
    }

    preventPointer.current = prevent;
  }; // reset pointer events when moving mouse


  var onMouseMove = React.useCallback(function () {
    if (preventPointer.current) {
      preventPointerEvents(false);
    }
  }, []); // override window.scrollTo(0, targetY) with our lerped version
  // Don't use useLayoutEffect as we want the native scrollTo to execute first and set the history position

  React.useEffect(function () {
    window.__origScrollTo = window.__origScrollTo || window.scrollTo;
    window.__origScroll = window.__origScroll || window.scroll;

    window.scrollTo = function (x, y, lerp) {
      return scrollTo(y, lerp);
    };

    window.scroll = function (x, y, lerp) {
      return scrollTo(y, lerp);
    };

    return function () {
      window.scrollTo = window.__origScrollTo;
      window.scroll = window.__origScroll;
    };
  }, [scrollTo]); // make sure we have correct internal values at mount

  React.useEffect(function () {
    y.current = window.pageYOffset;
    y.target = window.pageYOffset;
    setScrollY(y.target);
  }, []); // disable subpixelScrolling for better visual sync with canvas

  React.useLayoutEffect(function () {
    var ssBefore = config.subpixelScrolling;
    config.subpixelScrolling = subpixelScrolling;
    return function () {
      config.subpixelScrolling = ssBefore;
    };
  }, []); // Check if we are using an external update loop (like r3f)
  // update scroll target before everything else

  React.useEffect(function () {
    if (useUpdateLoop) {
      return useUpdateLoop(animate);
    }
  }, [useUpdateLoop]); // Check if we are using an external render loop (like r3f)
  // update scroll position last

  React.useEffect(function () {
    if (useRenderLoop) {
      return useRenderLoop(setScrollPosition);
    }
  }, [useRenderLoop]);
  /*
   * Called by each call to native window.scroll
   * Either as a scrollbar / key navigation event
   * Or as a result of the lerp animation
   */

  var onScrollEvent = function onScrollEvent(e) {
    // If scrolling manually using keys or drag scrollbars
    if (!scrolling.current) {
      // skip lerp
      y.current = window.pageYOffset;
      y.target = window.pageYOffset; // set lerp to 1 temporarily so canvas also moves immediately

      config.scrollLerp = 1; // update internal state to we are in sync

      setScrollY(y.target);
      onUpdate && onUpdate(y);
    }
  };

  var onTouchStart = function onTouchStart(e) {
    var startY = e.touches[0].clientY;
    var deltaY = 0;
    var velY = 0;
    var lastEventTs = 0;
    var frameDelta;
    y.target = y.current;
    setScrollY(y.target);

    function calculateTouchScroll(touch) {
      var newDeltaY = touch.clientY - startY;
      frameDelta = deltaY - newDeltaY;
      deltaY = newDeltaY;
      var now = Date.now();
      var elapsed = now - lastEventTs;
      lastEventTs = now; // calculate velocity

      var v = 1000 * frameDelta / (1 + elapsed); // smooth using moving average filter (https://ariya.io/2013/11/javascript-kinetic-scrolling-part-2)

      velY = 0.1 * v + 0.9 * velY;
    }

    var onTouchMove = function onTouchMove(e) {
      e.preventDefault();
      calculateTouchScroll(e.touches[0]);
      scrollTo(y.target + frameDelta * speed, DRAG_ACTIVE_LERP);
    };

    var onTouchCancel = function onTouchCancel(e) {
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

    var onTouchEnd = function onTouchEnd(e) {
      window.removeEventListener('touchmove', onTouchMove, {
        passive: false
      });
      window.removeEventListener('touchend', onTouchEnd, {
        passive: false
      });
      window.removeEventListener('touchcancel', onTouchCancel, {
        passive: false
      }); // reduce velocity if took time to release finger

      var elapsed = Date.now() - lastEventTs;
      var time = Math.min(1, Math.max(0, map_range(elapsed, 0, 100, 0, 1)));
      velY = _lerp__default["default"](velY, 0, time); // inertia lerp

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


  React.useEffect(function () {
    requestIdleCallback$1(function () {
      documentHeight.current = document.documentElement.scrollHeight - window.innerHeight;
    });
  }, [pageReflowRequested, width, height, location]);

  var onWheelEvent = function onWheelEvent(e) {
    e.preventDefault();
    scrollTo(y.target + e.deltaY * speed);
  };

  React.useEffect(function () {
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
    return function () {
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
  return /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, children({
    ref: ref
  }), !config.hasGlobalCanvas && /*#__PURE__*/React__default["default"].createElement(ResizeManager$1, {
    reflow: requestReflow
  }));
};

var _excluded = ["disabled", "children", "scrollToTop"];

var FakeScroller = function FakeScroller(_ref) {
  var el = _ref.el,
      _ref$lerp = _ref.lerp,
      lerp = _ref$lerp === void 0 ? config.scrollLerp : _ref$lerp,
      _ref$restDelta = _ref.restDelta,
      restDelta = _ref$restDelta === void 0 ? config.scrollRestDelta : _ref$restDelta,
      onUpdate = _ref.onUpdate,
      _ref$threshold = _ref.threshold,
      threshold = _ref$threshold === void 0 ? 100 : _ref$threshold;
  var pageReflowRequested = useCanvasStore(function (state) {
    return state.pageReflowRequested;
  });
  var triggerReflowCompleted = useCanvasStore(function (state) {
    return state.triggerReflowCompleted;
  });
  var setScrollY = useCanvasStore(function (state) {
    return state.setScrollY;
  });
  var heightEl = React.useRef();
  var lastFrame = React.useRef(0);

  var _useState = React.useState(),
      _useState2 = _slicedToArray__default["default"](_useState, 2),
      fakeHeight = _useState2[0],
      setFakeHeight = _useState2[1];

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
      scrollHeight: 0
    },
    isResizing: false,
    sectionEls: null,
    sections: null
  }).current; // ANIMATION LOOP

  var run = function run(ts) {
    var frameDelta = ts - lastFrame.current;
    lastFrame.current = ts;
    state.frame = window.requestAnimationFrame(run);
    var scroll = state.scroll;
    scroll.current = _lerp__default["default"](scroll.current, scroll.target, scroll.lerp, frameDelta * 0.001);
    var delta = scroll.current - scroll.target;
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

  var transformSections = function transformSections() {
    var total = state.total,
        isResizing = state.isResizing,
        scroll = state.scroll,
        sections = state.sections;
    var translate = "translate3d(0, ".concat(-scroll.current, "px, 0)");
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
    var height = state.bounds.height;
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
    state.scroll.target = window.pageYOffset;
    setScrollY(state.scroll.target); // restart animation loop if needed

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
    window.addEventListener('scroll', onScroll);
    return function () {
      return window.removeEventListener('scroll', onScroll);
    };
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
          var el = _ref2.el;
              _ref2.bounds;
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

    setFakeHeight("".concat(bounds.scrollHeight, "px"));
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
  }, [pageReflowRequested]);
  return /*#__PURE__*/React__default["default"].createElement("div", {
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
      _ref4$scrollToTop = _ref4.scrollToTop,
      scrollToTop = _ref4$scrollToTop === void 0 ? false : _ref4$scrollToTop,
      rest = _objectWithoutProperties__default["default"](_ref4, _excluded);

  var ref = React.useRef();

  var _useState3 = React.useState(false),
      _useState4 = _slicedToArray__default["default"](_useState3, 2),
      active = _useState4[0],
      setActive = _useState4[1]; // FakeScroller wont trigger resize without touching the store here..
  // due to code splitting maybe? two instances of the store?


  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  });
  var setVirtualScrollbar = useCanvasStore(function (state) {
    return state.setVirtualScrollbar;
  }); // Optional: scroll to top when scrollbar mounts

  React.useLayoutEffect(function () {
    if (!scrollToTop) return; // __tl_back_button_pressed is set by `gatsby-plugin-transition-link`

    if (!window.__tl_back_button_pressed) {
      // make sure we start at top if scrollbar is active (transition)
      !disabled && window.scrollTo(0, 0);
    }
  }, [scrollToTop, disabled]);
  React.useEffect(function () {
    document.documentElement.classList.toggle('js-has-virtual-scrollbar', !disabled);
    setVirtualScrollbar(!disabled); // allow webgl components to find positions first on page load

    var timer = setTimeout(function () {
      setActive(!disabled); // tell GlobalCanvas that VirtualScrollbar is active

      config.hasVirtualScrollbar = !disabled;
    }, 0);
    return function () {
      clearTimeout(timer);
      config.hasVirtualScrollbar = false;
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
  return /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, children({
    ref: ref,
    style: style
  }), active && /*#__PURE__*/React__default["default"].createElement(FakeScroller, _extends__default["default"]({
    el: ref
  }, rest)), !config.hasGlobalCanvas && /*#__PURE__*/React__default["default"].createElement(ResizeManager$1, {
    reflow: requestReflow
  }));
};

var useDelayedEffect = function useDelayedEffect(fn, deps) {
  var ms = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var timer;
  React.useEffect(function () {
    timer = setTimeout(fn, ms);
    return function () {
      return clearTimeout(timer);
    };
  }, deps);
};
var useDelayedEffect$1 = useDelayedEffect;

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted after initial delay (ms)
 * @param {object} object THREE.js object3d
 */

var useDelayedCanvas = function useDelayedCanvas(object, ms) {
  var deps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var key = arguments.length > 3 ? arguments[3] : undefined;
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
  useDelayedEffect$1(function () {
    renderToCanvas(uniqueKey, object);
  }, deps, ms); // return function that can set new props on the canvas component

  var set = function set(props) {
    requestIdleCallback$1(function () {
      return updateCanvas(uniqueKey, props);
    }, {
      timeout: 100
    });
  };

  return set;
};

exports.GlobalCanvas = GlobalCanvasIfSupported$1;
exports.HijackedScrollbar = HijackedScrollbar;
exports.ScrollDomPortal = ScrollDomPortal;
exports.SmoothScrollbar = HijackedScrollbar;
exports.VirtualScrollbar = VirtualScrollbar;
exports._config = config;
exports.useCanvas = useCanvas;
exports.useCanvasStore = useCanvasStore;
exports.useDelayedCanvas = useDelayedCanvas;
exports.useImgTagAsTexture = useImgTagAsTexture;
exports.useScrollRig = useScrollRig;
exports.useScrollbar = useScrollbar;
exports.useTextureLoader = useTextureLoader;
