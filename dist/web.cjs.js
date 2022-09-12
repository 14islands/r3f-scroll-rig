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
var mergeRefs = require('react-merge-refs');
var _toConsumableArray = require('@babel/runtime/helpers/toConsumableArray');
var three = require('three');
var _classCallCheck = require('@babel/runtime/helpers/classCallCheck');
var _createClass = require('@babel/runtime/helpers/createClass');
var _inherits = require('@babel/runtime/helpers/inherits');
var _possibleConstructorReturn = require('@babel/runtime/helpers/possibleConstructorReturn');
var _getPrototypeOf = require('@babel/runtime/helpers/getPrototypeOf');
var _slicedToArray = require('@babel/runtime/helpers/slicedToArray');
require('@14islands/lerp');
var shaderMaterial_js = require('@react-three/drei/core/shaderMaterial.js');
var debounce = require('debounce');
var Lenis = require('@studio-freight/lenis');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var _extends__default = /*#__PURE__*/_interopDefaultLegacy(_extends);
var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);
var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var React__namespace = /*#__PURE__*/_interopNamespace(React);
var queryString__default = /*#__PURE__*/_interopDefaultLegacy(queryString);
var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);
var create__default = /*#__PURE__*/_interopDefaultLegacy(create);
var mergeRefs__default = /*#__PURE__*/_interopDefaultLegacy(mergeRefs);
var _toConsumableArray__default = /*#__PURE__*/_interopDefaultLegacy(_toConsumableArray);
var _classCallCheck__default = /*#__PURE__*/_interopDefaultLegacy(_classCallCheck);
var _createClass__default = /*#__PURE__*/_interopDefaultLegacy(_createClass);
var _inherits__default = /*#__PURE__*/_interopDefaultLegacy(_inherits);
var _possibleConstructorReturn__default = /*#__PURE__*/_interopDefaultLegacy(_possibleConstructorReturn);
var _getPrototypeOf__default = /*#__PURE__*/_interopDefaultLegacy(_getPrototypeOf);
var _slicedToArray__default = /*#__PURE__*/_interopDefaultLegacy(_slicedToArray);
var debounce__default = /*#__PURE__*/_interopDefaultLegacy(debounce);
var Lenis__default = /*#__PURE__*/_interopDefaultLegacy(Lenis);

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

function ownKeys$8(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$8(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$8(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$8(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var useCanvasStore = create__default["default"](middleware.subscribeWithSelector(function (set) {
  return {
    // //////////////////////////////////////////////////////////////////////////
    // GLOBAL ScrollRig STATE
    // //////////////////////////////////////////////////////////////////////////
    globalRenderQueue: false,
    clearGlobalRenderQueue: function clearGlobalRenderQueue() {
      return set(function () {
        return {
          globalRenderQueue: false
        };
      });
    },
    // true if WebGL initialized without errors
    isCanvasAvailable: true,
    setCanvasAvailable: function setCanvasAvailable(isCanvasAvailable) {
      return set(function () {
        return {
          isCanvasAvailable: isCanvasAvailable
        };
      });
    },
    // true if <VirtualScrollbar> is currently enabled
    hasVirtualScrollbar: false,
    setVirtualScrollbar: function setVirtualScrollbar(hasVirtualScrollbar) {
      return set(function () {
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

        // check if already mounted
        if (Object.getOwnPropertyDescriptor(canvasChildren, key)) {
          // increase usage count
          canvasChildren[key].instances += 1;
          canvasChildren[key].props.inactive = false;
          return {
            canvasChildren: canvasChildren
          };
        } else {
          // otherwise mount it
          var obj = _objectSpread$8(_objectSpread$8({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
            mesh: mesh,
            props: props,
            instances: 1
          }));

          return {
            canvasChildren: obj
          };
        }
      });
    },
    // pass new props to a canvas component
    updateCanvas: function updateCanvas(key, newProps) {
      return set(function (_ref2) {
        var canvasChildren = _ref2.canvasChildren;
        if (!canvasChildren[key]) return;
        var _canvasChildren$key = canvasChildren[key],
            mesh = _canvasChildren$key.mesh,
            props = _canvasChildren$key.props,
            instances = _canvasChildren$key.instances;

        var obj = _objectSpread$8(_objectSpread$8({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
          mesh: mesh,
          props: _objectSpread$8(_objectSpread$8({}, props), newProps),
          instances: instances
        })); // console.log('updateCanvas', key, { ...props, ...newProps })


        return {
          canvasChildren: obj
        };
      });
    },
    // remove component from canvas
    removeFromCanvas: function removeFromCanvas(key) {
      var dispose = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      return set(function (_ref3) {
        var _canvasChildren$key2;

        var canvasChildren = _ref3.canvasChildren;

        // check if remove or reduce instances
        if (((_canvasChildren$key2 = canvasChildren[key]) === null || _canvasChildren$key2 === void 0 ? void 0 : _canvasChildren$key2.instances) > 1) {
          // reduce usage count
          canvasChildren[key].instances -= 1;
          return {
            canvasChildren: canvasChildren
          };
        } else {
          if (dispose) {
            // unmount since no longer used
            canvasChildren[key];
                var obj = _objectWithoutProperties__default["default"](canvasChildren, [key].map(_toPropertyKey)); // make a separate copy of the obj and omit


            return {
              canvasChildren: obj
            };
          } else {
            // or tell it to "act" hidden
            canvasChildren[key].instances = 0;
            canvasChildren[key].props.inactive = true;
            return {
              canvasChildren: canvasChildren
            };
          }
        }
      });
    },
    // Used to ask components to re-calculate their positions after a layout reflow
    pageReflow: 0,
    requestReflow: function requestReflow() {
      config.debug && console.log('ScrollRig', 'reflow() requested');
      set(function (state) {
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
    setScrollTo: function setScrollTo(fn) {
      console.log('setScrollTo', fn);
      set(function () {
        return {
          setScrollTo: fn
        };
      });
    }
  };
}));

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
var requestIdleCallback$1 = requestIdleCallback;

/**
 * Trigger reflow when WebFonts loaded
 */

var ResizeManager = function ResizeManager() {
  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  }); // reflow on webfont loaded to prevent misalignments

  React.useEffect(function () {
    if ('fonts' in document) {
      document.fonts.ready.then(function () {
        requestIdleCallback$1(requestReflow);
      });
    }
  }, []);
  return null;
};

var ResizeManager$1 = ResizeManager;

var _excluded$6 = ["makeDefault", "scaleMultiplier"];
var PerspectiveCamera = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var _ref$makeDefault = _ref.makeDefault,
      makeDefault = _ref$makeDefault === void 0 ? false : _ref$makeDefault,
      _ref$scaleMultiplier = _ref.scaleMultiplier,
      scaleMultiplier = _ref$scaleMultiplier === void 0 ? config.scaleMultiplier : _ref$scaleMultiplier,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$6);

  var set = fiber.useThree(function (state) {
    return state.set;
  });
  var camera = fiber.useThree(function (state) {
    return state.camera;
  });
  var size = fiber.useThree(function (state) {
    return state.size;
  });
  var pageReflow = useCanvasStore(function (state) {
    return state.pageReflow;
  });
  var distance = React.useMemo(function () {
    var width = size.width * scaleMultiplier;
    var height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, pageReflow, scaleMultiplier]);
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

var _excluded$5 = ["makeDefault", "scaleMultiplier"];
var OrthographicCamera = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
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
  var pageReflow = useCanvasStore(function (state) {
    return state.pageReflow;
  });
  var distance = React.useMemo(function () {
    var width = size.width * scaleMultiplier;
    var height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, pageReflow, scaleMultiplier]);
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
    reflow: requestReflow
  };
};

function ownKeys$7(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$7(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$7(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$7(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
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

  fiber.useFrame(function () {
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

  fiber.useFrame(function (_ref2) {
    var camera = _ref2.camera,
        scene = _ref2.scene;
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
  return /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, Object.keys(canvasChildren).map(function (key) {
    var _canvasChildren$key = canvasChildren[key],
        mesh = _canvasChildren$key.mesh,
        props = _canvasChildren$key.props;

    if (typeof mesh === 'function') {
      return /*#__PURE__*/React__default["default"].createElement(React.Fragment, {
        key: key
      }, mesh(_objectSpread$7(_objectSpread$7({
        key: key
      }, scrollRig), props)));
    }

    return /*#__PURE__*/React__default["default"].cloneElement(mesh, _objectSpread$7({
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

var _excluded$4 = ["as", "children", "gl", "style", "orthographic", "config", "camera"],
    _excluded2 = ["onError"];

function ownKeys$6(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$6(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$6(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$6(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var GlobalCanvas = function GlobalCanvas(_ref) {
  var _ref$as = _ref.as,
      as = _ref$as === void 0 ? fiber.Canvas : _ref$as,
      children = _ref.children,
      gl = _ref.gl,
      style = _ref.style,
      orthographic = _ref.orthographic,
      confOverrides = _ref.config,
      camera = _ref.camera,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$4);

  // override config
  React.useMemo(function () {
    Object.assign(config, confOverrides); // Querystring overrides

    var qs = queryString__default["default"].parse(window.location.search); // show debug statements

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
    gl: _objectSpread$6({
      // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
      failIfMajorPerformanceCaveat: true
    }, gl) // polyfill old iOS safari
    ,
    resize: {
      scroll: false,
      debounce: 0,
      polyfill: resizeObserver.ResizeObserver
    } // default styles
    ,
    style: _objectSpread$6({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '100vh'
    }, style) // allow to override anything of the above

  }, props), children, /*#__PURE__*/React__default["default"].createElement(GlobalRenderer$1, null), !orthographic && /*#__PURE__*/React__default["default"].createElement(PerspectiveCamera$1, _extends__default["default"]({
    makeDefault: true
  }, camera)), orthographic && /*#__PURE__*/React__default["default"].createElement(OrthographicCamera$1, _extends__default["default"]({
    makeDefault: true
  }, camera)), /*#__PURE__*/React__default["default"].createElement(ResizeManager$1, null));
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

var DebugMaterial = shaderMaterial_js.shaderMaterial({
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
  return /*#__PURE__*/React__default["default"].createElement("mesh", {
    scale: scale
  }, /*#__PURE__*/React__default["default"].createElement("planeBufferGeometry", null), /*#__PURE__*/React__default["default"].createElement("debugMaterial", {
    color: "hotpink",
    transparent: true,
    opacity: 0.5
  }));
};
var DebugMesh$1 = DebugMesh;

/**
 * Public interface for ScrollRig
 */

var useScrollbar = function useScrollbar() {
  var hasVirtualScrollbar = useCanvasStore(function (state) {
    return state.hasVirtualScrollbar;
  });
  var scroll = useCanvasStore(function (state) {
    return state.scroll;
  });
  var scrollTo = useCanvasStore(function (state) {
    return state.scrollTo;
  });
  return {
    enabled: hasVirtualScrollbar,
    scroll: scroll,
    scrollTo: scrollTo
  };
};

function ownKeys$5(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$5(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$5(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function isElementProps(obj) {
  return _typeof__default["default"](obj) === 'object' && 'track' in obj;
}

var defaultArgs = {
  inViewportMargin: 0.33
};
/**
 * Returns the current Scene position of the DOM element
 * based on initial getBoundingClientRect and scroll delta from start
 */

function useTracker(args) {
  var deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var size = fiber.useThree(function (s) {
    return s.size;
  });

  var _useState = React.useState(false),
      _useState2 = _slicedToArray__default["default"](_useState, 2),
      inViewport = _useState2[0],
      setInViewport = _useState2[1];

  var _useScrollbar = useScrollbar(),
      scroll = _useScrollbar.scroll;

  var _ref = isElementProps(args) ? _objectSpread$5(_objectSpread$5({}, defaultArgs), args) : _objectSpread$5(_objectSpread$5({}, defaultArgs), {}, {
    track: args
  }),
      track = _ref.track,
      inViewportMargin = _ref.inViewportMargin;

  var scrollMargin = size.height * inViewportMargin; // cache the return object

  var position = React.useRef({
    x: 0,
    // exact position on page
    y: 0,
    // exact position on page
    top: 0,
    left: 0,
    positiveYUpBottom: 0
  }).current; // DOM rect bounds

  var bounds = React.useMemo(function () {
    var _track$current;

    var _ref2 = ((_track$current = track.current) === null || _track$current === void 0 ? void 0 : _track$current.getBoundingClientRect()) || {},
        top = _ref2.top,
        bottom = _ref2.bottom,
        left = _ref2.left,
        right = _ref2.right,
        width = _ref2.width,
        height = _ref2.height; // Offset to Threejs scene which has 0,0 in the center of the screen


    var sceneOffset = {
      x: size.width * 0.5 - width * 0.5,
      y: size.height * 0.5 - height * 0.5
    };
    var bounds = {
      top: top + window.scrollY,
      bottom: bottom + window.scrollY,
      left: left + window.scrollX,
      right: right + window.scrollX,
      width: width,
      height: height,
      sceneOffset: sceneOffset,
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
  }, [track, size].concat(_toConsumableArray__default["default"](deps))); // scale in viewport units and pixel

  var scale = React.useMemo(function () {
    return [(bounds === null || bounds === void 0 ? void 0 : bounds.width) * config.scaleMultiplier, (bounds === null || bounds === void 0 ? void 0 : bounds.height) * config.scaleMultiplier, 1];
  }, [track, size].concat(_toConsumableArray__default["default"](deps)));
  var scrollState = React.useRef({
    inViewport: false,
    progress: -1,
    visibility: -1,
    viewport: -1
  }).current;
  var update = React.useCallback(function () {
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

    if (scrollState.inViewport && !inViewport) React.startTransition(function () {
      return setInViewport(true);
    });else if (!scrollState.inViewport && inViewport) React.startTransition(function () {
      return setInViewport(false);
    });

    if (scrollState.inViewport) {
      // calculate progress of passing through viewport (0 = just entered, 1 = just exited)
      var pxInside = bounds.top + position.y - bounds.top + size.height - bounds.sceneOffset.y;
      scrollState.progress = three.MathUtils.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1); // percent of total visible distance

      scrollState.visibility = three.MathUtils.mapLinear(pxInside, 0, bounds.height, 0, 1); // percent of item height in view

      scrollState.viewport = three.MathUtils.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
    }
  }, [bounds, track, size]);
  return {
    bounds: bounds,
    // HTML initial bounds
    scale: scale,
    // Scene scale - includes z-axis so it can be spread onto mesh directly
    scrollState: scrollState,
    position: position,
    // get current Scene position with scroll taken into account
    inViewport: inViewport,
    update: update // call in rAF to update with latest scroll position

  };
}

var _excluded$3 = ["track", "children", "margin", "inViewportMargin", "visible", "scissor", "debug", "positionFixed", "hiddenStyle", "as", "autoRender", "hideOffscreen", "renderOrder", "priority"];

function ownKeys$4(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$4(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$4(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned and scaled exactly above DOM element
 *
 * @author david@14islands.com
 */

exports.ScrollScene = function ScrollScene(_ref) {
  var track = _ref.track,
      children = _ref.children,
      _ref$margin = _ref.margin,
      margin = _ref$margin === void 0 ? 0 : _ref$margin,
      _ref$inViewportMargin = _ref.inViewportMargin,
      inViewportMargin = _ref$inViewportMargin === void 0 ? 0 : _ref$inViewportMargin,
      _ref$visible = _ref.visible,
      visible = _ref$visible === void 0 ? true : _ref$visible,
      _ref$scissor = _ref.scissor,
      scissor = _ref$scissor === void 0 ? false : _ref$scissor,
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? false : _ref$debug,
      _ref$positionFixed = _ref.positionFixed,
      positionFixed = _ref$positionFixed === void 0 ? false : _ref$positionFixed,
      _ref$hiddenStyle = _ref.hiddenStyle,
      hiddenStyle = _ref$hiddenStyle === void 0 ? {
    opacity: 0
  } : _ref$hiddenStyle,
      _ref$as = _ref.as,
      as = _ref$as === void 0 ? 'scene' : _ref$as,
      _ref$autoRender = _ref.autoRender,
      autoRender = _ref$autoRender === void 0 ? true : _ref$autoRender,
      _ref$hideOffscreen = _ref.hideOffscreen,
      hideOffscreen = _ref$hideOffscreen === void 0 ? true : _ref$hideOffscreen,
      _ref$renderOrder = _ref.renderOrder,
      renderOrder = _ref$renderOrder === void 0 ? 1 : _ref$renderOrder,
      _ref$priority = _ref.priority,
      priority = _ref$priority === void 0 ? config.PRIORITY_SCISSORS : _ref$priority,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$3);

  var inlineSceneRef = React.useCallback(function (node) {
    if (node !== null) {
      setScene(node);
    }
  }, []);

  var _useState = React.useState(scissor ? new three.Scene() : null),
      _useState2 = _slicedToArray__default["default"](_useState, 2),
      scene = _useState2[0],
      setScene = _useState2[1];

  var _useScrollRig = useScrollRig(),
      requestRender = _useScrollRig.requestRender,
      renderScissor = _useScrollRig.renderScissor;

  var pageReflow = useCanvasStore(function (state) {
    return state.pageReflow;
  });

  var _useTracker = useTracker({
    track: track,
    inViewportMargin: inViewportMargin
  }, [pageReflow, scene]),
      update = _useTracker.update,
      bounds = _useTracker.bounds,
      scale = _useTracker.scale,
      position = _useTracker.position,
      scrollState = _useTracker.scrollState,
      inViewport = _useTracker.inViewport;

  console.log('ScrollScene', bounds, scale, position, scrollState, inViewport);
  React.useLayoutEffect(function () {
    // hide image - leave in DOM to measure and get events
    if (!(track !== null && track !== void 0 && track.current)) return;

    if (debug) {
      track.current.style.opacity = 0.5;
    } else {
      Object.assign(track.current.style, _objectSpread$4({}, hiddenStyle));
    }

    return function () {
      if (!(track !== null && track !== void 0 && track.current)) return;
      Object.keys(hiddenStyle).forEach(function (key) {
        return track.current.style[key] = '';
      });
    };
  }, [track]); // RENDER FRAME

  fiber.useFrame(function (_ref2) {
    var gl = _ref2.gl,
        camera = _ref2.camera;
    if (!scene || !scale) return; // update element tracker

    update();
    var x = position.x,
        y = position.y,
        positiveYUpBottom = position.positiveYUpBottom;
    var inViewport = scrollState.inViewport; // hide/show scene

    scene.visible = hideOffscreen ? inViewport && visible : visible;

    if (scene.visible) {
      // move scene
      if (!positionFixed) {
        scene.position.y = y;
        scene.position.x = x;
      }

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
      }
    }
  }, priority);
  var content = /*#__PURE__*/React__default["default"].createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && scale && /*#__PURE__*/React__default["default"].createElement(DebugMesh$1, {
    scale: scale
  }), children && scene && scale && children(_objectSpread$4({
    // inherited props
    track: track,
    margin: margin,
    renderOrder: renderOrder,
    // new props
    scale: scale,
    // array
    scaleObj: {
      width: scale[0],
      height: scale[1]
    },
    scrollState: scrollState,
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

var _excluded$2 = ["track", "children", "margin", "inViewportMargin", "visible", "debug", "orthographic", "hiddenStyle", "renderOrder", "priority"];

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$3(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is rendered into a GL viewport matching the DOM position for better performance
 *
 * Adapted to @react-three/fiber from https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
 * @author david@14islands.com
 */

exports.ViewportScrollScene = function ViewportScrollScene(_ref) {
  var track = _ref.track,
      children = _ref.children,
      _ref$margin = _ref.margin,
      margin = _ref$margin === void 0 ? 0 : _ref$margin,
      _ref$inViewportMargin = _ref.inViewportMargin,
      inViewportMargin = _ref$inViewportMargin === void 0 ? 0 : _ref$inViewportMargin,
      _ref$visible = _ref.visible,
      visible = _ref$visible === void 0 ? true : _ref$visible,
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? false : _ref$debug,
      _ref$orthographic = _ref.orthographic,
      orthographic = _ref$orthographic === void 0 ? false : _ref$orthographic,
      _ref$hiddenStyle = _ref.hiddenStyle,
      hiddenStyle = _ref$hiddenStyle === void 0 ? {
    opacity: 0
  } : _ref$hiddenStyle,
      _ref$renderOrder = _ref.renderOrder,
      renderOrder = _ref$renderOrder === void 0 ? 1 : _ref$renderOrder,
      _ref$priority = _ref.priority,
      priority = _ref$priority === void 0 ? config.PRIORITY_VIEWPORTS : _ref$priority,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$2);

  var camera = React.useRef();

  var _useState = React.useState(function () {
    return new three.Scene();
  }),
      _useState2 = _slicedToArray__default["default"](_useState, 1),
      scene = _useState2[0];

  var _useThree = fiber.useThree(),
      invalidate = _useThree.invalidate;

  var _useScrollRig = useScrollRig(),
      renderViewport = _useScrollRig.renderViewport;

  var _useScrollbar = useScrollbar(),
      scroll = _useScrollbar.scroll;

  var pageReflow = useCanvasStore(function (state) {
    return state.pageReflow;
  });

  var _useTracker = useTracker({
    track: track,
    inViewportMargin: inViewportMargin
  }, [pageReflow, scene]),
      update = _useTracker.update,
      bounds = _useTracker.bounds,
      scale = _useTracker.scale,
      position = _useTracker.position,
      scrollState = _useTracker.scrollState,
      inViewport = _useTracker.inViewport;

  var _useState3 = React.useState(0),
      _useState4 = _slicedToArray__default["default"](_useState3, 2),
      cameraDistance = _useState4[0],
      setCameraDistance = _useState4[1]; // El is rendered


  React.useLayoutEffect(function () {
    // hide image - leave in DOM to measure and get events
    if (!(track !== null && track !== void 0 && track.current)) return;

    if (debug) {
      track.current.style.opacity = 0.5;
    } else {
      Object.assign(track.current.style, _objectSpread$3({}, hiddenStyle));
    }

    return function () {
      if (!(track !== null && track !== void 0 && track.current)) return;
      Object.keys(hiddenStyle).forEach(function (key) {
        return track.current.style[key] = '';
      });
    };
  }, [track]); // Find bounding box & scale mesh on resize

  React.useLayoutEffect(function () {
    var viewportWidth = bounds.width * config.scaleMultiplier;
    var viewportHeight = bounds.height * config.scaleMultiplier;
    var cameraDistance = Math.max(viewportWidth, viewportHeight) * config.scaleMultiplier;
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
  var compute = React__default["default"].useCallback(function (event, state) {
    if (track.current && event.target === track.current) {
      var width = bounds.width,
          height = bounds.height,
          left = bounds.left,
          top = bounds.top;
      var x = event.clientX - left + scroll.x;
      var y = event.clientY - top + scroll.y;
      state.pointer.set(x / width * 2 - 1, -(y / height) * 2 + 1);
      state.raycaster.setFromCamera(state.pointer, camera.current);
    }
  }, [bounds, position]); // RENDER FRAME

  fiber.useFrame(function (_ref2) {
    var gl = _ref2.gl;
    if (!scene || !scale) return; // update element tracker

    update();
    var inViewport = scrollState.inViewport; // hide/show scene

    scene.visible = inViewport && visible; // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas

    if (scene.visible) {
      renderViewport({
        gl: gl,
        scene: scene,
        camera: camera.current,
        left: bounds.left - margin,
        top: position.positiveYUpBottom - margin,
        width: bounds.width + margin * 2,
        height: bounds.height + margin * 2
      });
    }
  }, priority);
  return bounds && fiber.createPortal( /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, !orthographic && /*#__PURE__*/React__default["default"].createElement("perspectiveCamera", {
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
  }), children && scene && scale && children(_objectSpread$3({
    // inherited props
    track: track,
    margin: margin,
    renderOrder: renderOrder,
    // new props
    scale: scale,
    scrollState: scrollState,
    scene: scene,
    camera: camera.current,
    inViewport: inViewport,
    // useFrame render priority (in case children need to run after)
    priority: priority + renderOrder
  }, props)))), scene, {
    events: {
      compute: compute,
      priority: priority
    },
    size: {
      width: bounds.width,
      height: bounds.height
    }
  });
};

exports.ViewportScrollScene = /*#__PURE__*/React__default["default"].memo(exports.ViewportScrollScene);

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted
 * @param {object} object THREE.js object3d
 */

function useCanvas(object, deps, _ref) {
  var key = _ref.key,
      _ref$dispose = _ref.dispose,
      dispose = _ref$dispose === void 0 ? true : _ref$dispose;
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
  }, []); // render to canvas if not mounted already

  React.useLayoutEffect(function () {
    renderToCanvas(uniqueKey, object, {
      inactive: false
    });
  }, [uniqueKey]); // remove from canvas if no usage (after render so new users have time to register)

  React.useEffect(function () {
    return function () {
      removeFromCanvas(uniqueKey, dispose);
    };
  }, [uniqueKey]); // return function that can set new props on the canvas component

  var set = React.useCallback(function (props) {
    updateCanvas(uniqueKey, props);
  }, [updateCanvas, uniqueKey]); // auto update props when deps change

  React.useEffect(function () {
    set(deps);
  }, _toConsumableArray__default["default"](Object.values(deps)));
  return set;
}

var _excluded$1 = ["children", "id"];

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$2(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var UseCanvas = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var children = _ref.children,
      id = _ref.id,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$1);

  // auto update canvas with all props
  useCanvas(children, _objectSpread$2(_objectSpread$2({}, props), {}, {
    ref: ref
  }), {
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

var _excluded = ["children", "duration", "easing", "smooth", "direction", "config"];

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var EASE_EXP_OUT = function EASE_EXP_OUT(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}; // https://easings.net/


function LenisScrollbar(_ref, ref) {
  var children = _ref.children,
      _ref$duration = _ref.duration,
      duration = _ref$duration === void 0 ? 1 : _ref$duration,
      _ref$easing = _ref.easing,
      easing = _ref$easing === void 0 ? EASE_EXP_OUT : _ref$easing,
      _ref$smooth = _ref.smooth,
      smooth = _ref$smooth === void 0 ? true : _ref$smooth,
      _ref$direction = _ref.direction,
      direction = _ref$direction === void 0 ? 'vertical' : _ref$direction,
      config = _ref.config,
      props = _objectWithoutProperties__default["default"](_ref, _excluded);

  var lenisImpl = React.useRef();
  React.useImperativeHandle(ref, function () {
    return {
      start: function start() {
        var _lenisImpl$current;

        return (_lenisImpl$current = lenisImpl.current) === null || _lenisImpl$current === void 0 ? void 0 : _lenisImpl$current.start();
      },
      stop: function stop() {
        var _lenisImpl$current2;

        return (_lenisImpl$current2 = lenisImpl.current) === null || _lenisImpl$current2 === void 0 ? void 0 : _lenisImpl$current2.stop();
      },
      onScroll: function onScroll(cb) {
        var _lenisImpl$current3;

        return (_lenisImpl$current3 = lenisImpl.current) === null || _lenisImpl$current3 === void 0 ? void 0 : _lenisImpl$current3.on('scroll', cb);
      },
      scrollTo: function scrollTo(target, props) {
        var _lenisImpl$current4;

        return (_lenisImpl$current4 = lenisImpl.current) === null || _lenisImpl$current4 === void 0 ? void 0 : _lenisImpl$current4.scrollTo(target, props);
      }
    };
  });
  React.useEffect(function () {
    var lenis = lenisImpl.current = new Lenis__default["default"](_objectSpread$1({
      duration: duration,
      easing: easing,
      smooth: smooth,
      direction: direction
    }, config)); // let r3f drive the frameloop

    var removeEffect = fiber.addEffect(function (time) {
      return lenis.raf(time);
    }); // cleanup on unmount

    return function () {
      removeEffect();
      lenis.destroy();
    };
  }, [smooth]);
  return children && children(props);
}
var LenisScrollbar$1 = /*#__PURE__*/React.forwardRef(LenisScrollbar);

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var SmoothScrollbar = function SmoothScrollbar(_ref) {
  var children = _ref.children,
      _ref$smooth = _ref.smooth,
      smooth = _ref$smooth === void 0 ? true : _ref$smooth,
      _ref$paused = _ref.paused,
      paused = _ref$paused === void 0 ? false : _ref$paused,
      _ref$scrollRestoratio = _ref.scrollRestoration,
      scrollRestoration = _ref$scrollRestoratio === void 0 ? 'auto' : _ref$scrollRestoratio,
      _ref$disablePointerOn = _ref.disablePointerOnScroll,
      disablePointerOnScroll = _ref$disablePointerOn === void 0 ? true : _ref$disablePointerOn;
  var ref = React.useRef();
  var lenis = React.useRef();
  var preventPointer = React.useRef(false);
  var setVirtualScrollbar = useCanvasStore(function (state) {
    return state.setVirtualScrollbar;
  });
  var scrollState = useCanvasStore(function (state) {
    return state.scroll;
  }); // disable pointer events while scrolling to avoid slow event handlers

  var preventPointerEvents = function preventPointerEvents(prevent) {
    if (!disablePointerOnScroll) return;

    if (ref.current && preventPointer.current !== prevent) {
      preventPointer.current = prevent;
      ref.current.style.pointerEvents = prevent ? 'none' : 'auto';
    }
  }; // reset pointer events when moving mouse


  var onMouseMove = React.useCallback(function () {
    preventPointerEvents(false);
  }, []);
  React.useEffect(function () {
    var _lenis$current, _lenis$current2;

    // update global scroll store
    (_lenis$current = lenis.current) === null || _lenis$current === void 0 ? void 0 : _lenis$current.onScroll(function (_ref2) {
      var scroll = _ref2.scroll,
          limit = _ref2.limit,
          velocity = _ref2.velocity,
          direction = _ref2.direction,
          progress = _ref2.progress;
      scrollState.y = direction === 'vertical' ? scroll : 0;
      scrollState.x = direction === 'horizontal' ? scroll : 0;
      scrollState.limit = limit;
      scrollState.velocity = velocity;
      scrollState.direction = direction;
      scrollState.progress = progress; // disable pointer logic

      var disablePointer = debounce__default["default"](function () {
        return preventPointerEvents(true);
      }, 100, true);

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
    return function () {
      window.removeEventListener('pointermove', onMouseMove);
    };
  }, [smooth]);
  React.useEffect(function () {
    document.documentElement.classList.toggle('js-has-smooth-scrollbar', smooth);
    setVirtualScrollbar(smooth);
  }, [smooth]);
  React.useLayoutEffect(function () {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = scrollRestoration;
    }
  }, []);
  React.useEffect(function () {
    var _lenis$current3, _lenis$current4;

    paused ? (_lenis$current3 = lenis.current) === null || _lenis$current3 === void 0 ? void 0 : _lenis$current3.stop() : (_lenis$current4 = lenis.current) === null || _lenis$current4 === void 0 ? void 0 : _lenis$current4.start();
  }, [paused]);
  return /*#__PURE__*/React__namespace.createElement(LenisScrollbar$1, {
    ref: lenis,
    smooth: smooth
  }, function (bind) {
    return children(_objectSpread(_objectSpread({}, bind), {}, {
      ref: ref
    }));
  });
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
exports.SmoothScrollbar = SmoothScrollbar;
exports.UseCanvas = UseCanvas;
exports._config = config;
exports.useCanvas = useCanvas;
exports.useCanvasStore = useCanvasStore;
exports.useDelayedCanvas = useDelayedCanvas;
exports.useImgTagAsTexture = useImgTagAsTexture;
exports.useScrollRig = useScrollRig;
exports.useScrollbar = useScrollbar;
exports.useTextureLoader = useTextureLoader;
exports.useTracker = useTracker;
