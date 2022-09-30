'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var _objectWithoutProperties = require('@babel/runtime/helpers/objectWithoutProperties');
var React = require('react');
var fiber = require('@react-three/fiber');
var resizeObserver = require('@juggle/resize-observer');
var queryString = require('query-string');
var _typeof = require('@babel/runtime/helpers/typeof');
var create = require('zustand');
var mergeRefs = require('react-merge-refs');
var jsxRuntime = require('react/jsx-runtime');
var three = require('three');
var _toConsumableArray = require('@babel/runtime/helpers/toConsumableArray');
var _classCallCheck = require('@babel/runtime/helpers/classCallCheck');
var _createClass = require('@babel/runtime/helpers/createClass');
var _inherits = require('@babel/runtime/helpers/inherits');
var _possibleConstructorReturn = require('@babel/runtime/helpers/possibleConstructorReturn');
var _getPrototypeOf = require('@babel/runtime/helpers/getPrototypeOf');
var _slicedToArray = require('@babel/runtime/helpers/slicedToArray');
var reactIntersectionObserver = require('react-intersection-observer');
var vecn = require('vecn');
var suspendReact = require('suspend-react');
var debounce = require('debounce');
var Lenis = require('@studio-freight/lenis');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);
var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
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
var Lenis__default = /*#__PURE__*/_interopDefaultLegacy(Lenis);

// Transient shared state for canvas components
// usContext() causes re-rendering which can drop frames
var config = {
  // Execution order for useFrames (highest = last render)
  PRIORITY_PRELOAD: 0,
  PRIORITY_SCISSORS: 1,
  PRIORITY_VIEWPORTS: 1,
  PRIORITY_GLOBAL: 1000,
  DEFAULT_SCALE_MULTIPLIER: 1,
  // Global rendering props
  preloadQueue: []
};

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof__default["default"](key) === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (_typeof__default["default"](input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof__default["default"](res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

function ownKeys$b(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$b(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$b(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$b(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var useCanvasStore = create__default["default"](function (set) {
  return {
    // //////////////////////////////////////////////////////////////////////////
    // GLOBAL ScrollRig STATE
    // //////////////////////////////////////////////////////////////////////////
    debug: false,
    scaleMultiplier: config.DEFAULT_SCALE_MULTIPLIER,
    globalRender: true,
    globalPriority: config.PRIORITY_GLOBAL,
    globalAutoClear: false,
    globalClearDepth: true,
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
    // true if <VirtualScrollbar> is currently enabled
    hasSmoothScrollbar: false,
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
          var obj = _objectSpread$b(_objectSpread$b({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
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
      return (// @ts-ignore
        set(function (_ref2) {
          var canvasChildren = _ref2.canvasChildren;
          if (!canvasChildren[key]) return;
          var _canvasChildren$key = canvasChildren[key],
              mesh = _canvasChildren$key.mesh,
              props = _canvasChildren$key.props,
              instances = _canvasChildren$key.instances;

          var obj = _objectSpread$b(_objectSpread$b({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
            mesh: mesh,
            props: _objectSpread$b(_objectSpread$b({}, props), newProps),
            instances: instances
          })); // console.log('updateCanvas', key, { ...props, ...newProps })


          return {
            canvasChildren: obj
          };
        })
      );
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
    scrollTo: function scrollTo(target) {
      return window.scrollTo(0, target);
    },
    onScroll: function onScroll() {
      return function () {};
    }
  };
});

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

var _excluded$6 = ["makeDefault"];

function ownKeys$a(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$a(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$a(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$a(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var PerspectiveCamera = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var _ref$makeDefault = _ref.makeDefault,
      makeDefault = _ref$makeDefault === void 0 ? false : _ref$makeDefault,
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
  var scaleMultiplier = useCanvasStore(function (state) {
    return state.scaleMultiplier;
  });
  var distance = React.useMemo(function () {
    var width = size.width * scaleMultiplier;
    var height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, pageReflow, scaleMultiplier]);
  var cameraRef = React.useRef();
  React.useLayoutEffect(function () {
    var width = size.width * scaleMultiplier;
    var height = size.height * scaleMultiplier; // const radToDeg = (radians) => radians * (180 / Math.PI)
    // const degToRad = (degrees) => degrees * (Math.PI / 180)

    cameraRef.current.aspect = width / height;
    cameraRef.current.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * cameraRef.current.position.z)); // cameraRef.current.fov = props.fov
    // const vFOV = props.fov * (Math.PI / 180)
    // const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * cameraRef.current.aspect)
    // cameraRef.current.position.z = cameraRef.current.getFilmHeight() / cameraRef.current.getFocalLength()
    // cameraRef.current.position.z = Math.tan(((hFOV / 2.0) * Math.PI) / 180.0) * 2.0

    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
    // Update matrix world since the renderer is a frame late

    cameraRef.current.updateMatrixWorld();
  }, [distance, size, scaleMultiplier]);
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
  return /*#__PURE__*/jsxRuntime.jsx("perspectiveCamera", _objectSpread$a({
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

var _excluded$5 = ["makeDefault"];

function ownKeys$9(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$9(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$9(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$9(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var OrthographicCamera = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var _ref$makeDefault = _ref.makeDefault,
      makeDefault = _ref$makeDefault === void 0 ? false : _ref$makeDefault,
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
  var scaleMultiplier = useCanvasStore(function (state) {
    return state.scaleMultiplier;
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
  return /*#__PURE__*/jsxRuntime.jsx("orthographicCamera", _objectSpread$9({
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
  var hasSmoothScrollbar = useCanvasStore(function (state) {
    return state.hasSmoothScrollbar;
  });
  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  });
  var debug = useCanvasStore(function (state) {
    return state.debug;
  });
  var scaleMultiplier = useCanvasStore(function (state) {
    return state.scaleMultiplier;
  });
  React.useEffect(function () {
    if (debug) {
      // @ts-ignore
      window._scrollRig = window._scrollRig || {}; // @ts-ignore

      window._scrollRig.reflow = requestReflow;
    }
  }, []);
  return {
    // boolean state
    debug: debug,
    isCanvasAvailable: isCanvasAvailable,
    hasSmoothScrollbar: hasSmoothScrollbar,
    // scale
    scaleMultiplier: scaleMultiplier,
    // render API
    preloadScene: preloadScene,
    requestRender: requestRender,
    renderScissor: renderScissor,
    renderViewport: renderViewport,
    // recalc all tracker positions
    reflow: requestReflow
  };
};

function ownKeys$8(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$8(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$8(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$8(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var col = new three.Color();
/**
 * Global render loop to avoid double renders on the same frame
 */

var GlobalRenderer = function GlobalRenderer() {
  var gl = fiber.useThree(function (s) {
    return s.gl;
  });
  var frameloop = fiber.useThree(function (s) {
    return s.frameloop;
  });
  var canvasChildren = useCanvasStore(function (state) {
    return state.canvasChildren;
  });
  var globalRender = useCanvasStore(function (state) {
    return state.globalRender;
  });
  var globalClearDepth = useCanvasStore(function (state) {
    return state.globalClearDepth;
  });
  var globalAutoClear = useCanvasStore(function (state) {
    return state.globalAutoClear;
  });
  var globalPriority = useCanvasStore(function (state) {
    return state.globalPriority;
  });
  var scrollRig = useScrollRig(); // https://threejs.org/docs/#api/en/renderers/WebGLRenderer.debug

  React.useLayoutEffect(function () {
    gl.debug.checkShaderErrors = scrollRig.debug;
  }, [scrollRig.debug]);
  React.useEffect(function () {
    // clear canvas automatically if all children were removed
    if (!Object.keys(canvasChildren).length) {
      scrollRig.debug && console.log('GlobalRenderer', 'auto clear empty canvas');
      gl.getClearColor(col);
      gl.setClearColor(col, gl.getClearAlpha());
      gl.clear(true, true);
    }
  }, [canvasChildren]); // PRELOAD RENDER LOOP

  fiber.useFrame(function () {
    if (!config.preloadQueue.length) return;
    gl.autoClear = false; // Render preload frames first and clear directly

    config.preloadQueue.forEach(function (render) {
      return render(gl);
    }); // cleanup

    gl.clear();
    config.preloadQueue = [];
    gl.autoClear = true; // trigger new frame to get correct visual state after all preloads

    scrollRig.debug && console.log('GlobalRenderer', 'preload complete. trigger global render');
    scrollRig.requestRender();
    fiber.invalidate();
  }, globalRender ? config.PRIORITY_PRELOAD : -1 //negative priority doesn't take over render loop
  ); // GLOBAL RENDER LOOP

  fiber.useFrame(function (_ref) {
    var camera = _ref.camera,
        scene = _ref.scene;
    var globalRenderQueue = useCanvasStore.getState().globalRenderQueue; // Render if requested or if always on

    if (globalRender && (frameloop === 'always' || globalRenderQueue)) {
      gl.autoClear = globalAutoClear; // false will fail in Oculus Quest VR
      // render default layer, scene, camera

      camera.layers.disableAll();

      if (globalRenderQueue) {
        globalRenderQueue.forEach(function (layer) {
          camera.layers.enable(layer);
        });
      } else {
        camera.layers.enable(0);
      } // render as HUD over any other renders by default


      globalClearDepth && gl.clearDepth();
      gl.render(scene, camera);
      gl.autoClear = true;
    } // cleanup for next frame


    useCanvasStore.getState().clearGlobalRenderQueue();
  }, globalRender ? globalPriority : undefined); // Take over rendering

  scrollRig.debug && console.log('GlobalRenderer', Object.keys(canvasChildren).length);
  return /*#__PURE__*/jsxRuntime.jsx(jsxRuntime.Fragment, {
    children: Object.keys(canvasChildren).map(function (key) {
      var _canvasChildren$key = canvasChildren[key],
          mesh = _canvasChildren$key.mesh,
          props = _canvasChildren$key.props;

      if (typeof mesh === 'function') {
        return /*#__PURE__*/jsxRuntime.jsx(React.Fragment, {
          children: mesh(_objectSpread$8(_objectSpread$8({
            key: key
          }, scrollRig), props))
        }, key);
      }

      return /*#__PURE__*/React__default["default"].cloneElement(mesh, _objectSpread$8({
        key: key
      }, props));
    })
  });
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

var _excluded$4 = ["as", "children", "gl", "style", "orthographic", "camera", "debug", "scaleMultiplier", "globalRender", "globalPriority", "globalAutoClear", "globalClearDepth", "loadingFallback"],
    _excluded2 = ["children", "onError"];

function ownKeys$7(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$7(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$7(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$7(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var GlobalCanvas = function GlobalCanvas(_ref) {
  var _ref$as = _ref.as,
      as = _ref$as === void 0 ? fiber.Canvas : _ref$as,
      children = _ref.children,
      gl = _ref.gl,
      style = _ref.style,
      orthographic = _ref.orthographic,
      camera = _ref.camera,
      debug = _ref.debug,
      _ref$scaleMultiplier = _ref.scaleMultiplier,
      scaleMultiplier = _ref$scaleMultiplier === void 0 ? config.DEFAULT_SCALE_MULTIPLIER : _ref$scaleMultiplier,
      _ref$globalRender = _ref.globalRender,
      globalRender = _ref$globalRender === void 0 ? true : _ref$globalRender,
      _ref$globalPriority = _ref.globalPriority,
      globalPriority = _ref$globalPriority === void 0 ? config.PRIORITY_GLOBAL : _ref$globalPriority,
      _ref$globalAutoClear = _ref.globalAutoClear,
      globalAutoClear = _ref$globalAutoClear === void 0 ? false : _ref$globalAutoClear,
      _ref$globalClearDepth = _ref.globalClearDepth,
      globalClearDepth = _ref$globalClearDepth === void 0 ? true : _ref$globalClearDepth,
      loadingFallback = _ref.loadingFallback,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$4);

  // enable debug mode
  React.useLayoutEffect(function () {
    // Querystring overrides
    var qs = queryString.parse(window.location.search); // show debug statements

    if (debug || typeof qs.debug !== 'undefined') {
      useCanvasStore.setState({
        debug: true
      });
    }
  }, [debug]); // update state

  React.useLayoutEffect(function () {
    useCanvasStore.setState({
      scaleMultiplier: scaleMultiplier,
      globalRender: globalRender,
      globalPriority: globalPriority,
      globalAutoClear: globalAutoClear,
      globalClearDepth: globalClearDepth
    });
  }, [scaleMultiplier, globalPriority, globalRender, globalAutoClear, globalClearDepth]);
  var CanvasElement = as;
  return /*#__PURE__*/jsxRuntime.jsxs(CanvasElement // use our own default camera
  , _objectSpread$7(_objectSpread$7({
    camera: null // Some sane defaults
    ,
    gl: _objectSpread$7({
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
    style: _objectSpread$7({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '100vh'
    }, style) // allow to override anything of the above

  }, props), {}, {
    children: [/*#__PURE__*/jsxRuntime.jsxs(React.Suspense, {
      fallback: loadingFallback,
      children: [children, /*#__PURE__*/jsxRuntime.jsx(GlobalRenderer$1, {})]
    }), !orthographic && /*#__PURE__*/jsxRuntime.jsx(PerspectiveCamera$1, _objectSpread$7({
      makeDefault: true
    }, camera)), orthographic && /*#__PURE__*/jsxRuntime.jsx(OrthographicCamera$1, _objectSpread$7({
      makeDefault: true
    }, camera)), /*#__PURE__*/jsxRuntime.jsx(ResizeManager$1, {})]
  }));
};

var GlobalCanvasIfSupported = function GlobalCanvasIfSupported(_ref2) {
  var children = _ref2.children,
      _onError = _ref2.onError,
      props = _objectWithoutProperties__default["default"](_ref2, _excluded2);

  React.useLayoutEffect(function () {
    document.documentElement.classList.add('js-has-global-canvas');
  }, []);
  return (
    /*#__PURE__*/
    // @ts-ignore
    jsxRuntime.jsx(CanvasErrorBoundary$1, {
      onError: function onError(err) {
        _onError && _onError(err);
        useCanvasStore.setState({
          isCanvasAvailable: false
        });
        /* WebGL failed to init */

        document.documentElement.classList.remove('js-has-global-canvas');
        document.documentElement.classList.add('js-global-canvas-error');
      },
      children: /*#__PURE__*/jsxRuntime.jsx(GlobalCanvas, _objectSpread$7(_objectSpread$7({}, props), {}, {
        children: children
      }))
    })
  );
};

var GlobalCanvasIfSupported$1 = GlobalCanvasIfSupported;

var DebugMesh = function DebugMesh(_ref) {
  var scale = _ref.scale;
  return /*#__PURE__*/jsxRuntime.jsxs("mesh", {
    scale: scale,
    children: [/*#__PURE__*/jsxRuntime.jsx("planeGeometry", {}), /*#__PURE__*/jsxRuntime.jsx("shaderMaterial", {
      args: [{
        uniforms: {
          color: {
            value: new three.Color('hotpink')
          }
        },
        vertexShader: "\n            void main() {\n              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n            }\n          ",
        fragmentShader: "\n            uniform vec3 color;\n            uniform float opacity;\n            void main() {\n              gl_FragColor.rgba = vec4(color, .5);\n            }\n          "
      }],
      transparent: true
    })]
  });
};
var DebugMesh$1 = DebugMesh;

/**
 * Public interface for ScrollRig
 */
var useScrollbar = function useScrollbar() {
  var hasSmoothScrollbar = useCanvasStore(function (state) {
    return state.hasSmoothScrollbar;
  });
  var scroll = useCanvasStore(function (state) {
    return state.scroll;
  });
  var scrollTo = useCanvasStore(function (state) {
    return state.scrollTo;
  });
  var onScroll = useCanvasStore(function (state) {
    return state.onScroll;
  });
  return {
    enabled: hasSmoothScrollbar,
    scroll: scroll,
    scrollTo: scrollTo,
    onScroll: onScroll
  };
};

function ownKeys$6(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$6(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$6(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$6(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function isElementProps(obj) {
  return _typeof__default["default"](obj) === 'object' && 'track' in obj;
}

function updateBounds(bounds, rect, scroll, size) {
  bounds.top = rect.top - scroll.y;
  bounds.bottom = rect.bottom - scroll.y;
  bounds.left = rect.left - scroll.x;
  bounds.right = rect.right - scroll.x;
  bounds.width = rect.width;
  bounds.height = rect.height; // move coordinate system so 0,0 is at center of screen

  bounds.x = bounds.left + rect.width * 0.5 - size.width * 0.5;
  bounds.y = bounds.top + rect.height * 0.5 - size.height * 0.5;
  bounds.positiveYUpBottom = size.height - bounds.bottom; // inverse Y
}

function updatePosition(position, bounds, scaleMultiplier) {
  position.x = bounds.x * scaleMultiplier;
  position.y = -1 * bounds.y * scaleMultiplier;
}

var defaultArgs = {
  rootMargin: '50%',
  threshold: 0,
  autoUpdate: true
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

  var _useScrollbar = useScrollbar(),
      scroll = _useScrollbar.scroll,
      onScroll = _useScrollbar.onScroll;

  var scaleMultiplier = useCanvasStore(function (state) {
    return state.scaleMultiplier;
  });
  var pageReflow = useCanvasStore(function (state) {
    return state.pageReflow;
  });

  var _ref = isElementProps(args) ? _objectSpread$6(_objectSpread$6({}, defaultArgs), args) : _objectSpread$6(_objectSpread$6({}, defaultArgs), {}, {
    track: args
  }),
      track = _ref.track,
      rootMargin = _ref.rootMargin,
      threshold = _ref.threshold,
      autoUpdate = _ref.autoUpdate; // check if element is in viewport


  var _useInView = reactIntersectionObserver.useInView({
    rootMargin: rootMargin,
    threshold: threshold
  }),
      ref = _useInView.ref,
      inViewport = _useInView.inView; // bind useInView ref to current tracking element


  React.useLayoutEffect(function () {
    ref(track.current);
  }, [track]);
  var scrollState = React.useRef({
    inViewport: false,
    progress: -1,
    visibility: -1,
    viewport: -1
  }).current; // DOM rect (initial position in pixels offset by scroll value on page load)

  var rect = React.useMemo(function () {
    var _track$current;

    var rect = ((_track$current = track.current) === null || _track$current === void 0 ? void 0 : _track$current.getBoundingClientRect()) || {};
    var top = rect.top + window.scrollY;
    var left = rect.left + window.scrollX;
    return {
      top: top,
      bottom: rect.bottom + window.scrollY,
      left: left,
      right: rect.right + window.scrollX,
      width: rect.width,
      height: rect.width,
      x: left + rect.width * 0.5,
      y: top + rect.height * 0.5
    };
  }, [track, size, pageReflow].concat(_toConsumableArray__default["default"](deps))); // bounding rect in pixels - updated by scroll

  var bounds = React.useMemo(function () {
    var bounds = _objectSpread$6(_objectSpread$6({}, rect), {}, {
      positiveYUpBottom: 0
    });

    updateBounds(bounds, rect, scroll, size);
    return bounds;
  }, []); // position in viewport units - updated by scroll

  var position = React.useMemo(function () {
    var position = vecn.vec3(0, 0, 0);
    updatePosition(position, bounds, scaleMultiplier);
    return position;
  }, []); // scale in viewport units

  var scale = React.useMemo(function () {
    return vecn.vec3((rect === null || rect === void 0 ? void 0 : rect.width) * scaleMultiplier, (rect === null || rect === void 0 ? void 0 : rect.height) * scaleMultiplier, 1);
  }, [rect, scaleMultiplier]);

  var _update = React.useCallback(function () {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref2$onlyUpdateInVie = _ref2.onlyUpdateInViewport,
        onlyUpdateInViewport = _ref2$onlyUpdateInVie === void 0 ? true : _ref2$onlyUpdateInVie;

    if (!track.current || onlyUpdateInViewport && !scrollState.inViewport) {
      return;
    }

    updateBounds(bounds, rect, scroll, size);
    updatePosition(position, bounds, scaleMultiplier); // calculate progress of passing through viewport (0 = just entered, 1 = just exited)

    var pxInside = size.height - bounds.top;
    scrollState.progress = three.MathUtils.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1); // percent of total visible distance

    scrollState.visibility = three.MathUtils.mapLinear(pxInside, 0, bounds.height, 0, 1); // percent of item height in view

    scrollState.viewport = three.MathUtils.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
  }, [position, bounds, size, rect, scaleMultiplier, scroll]); // update scrollState in viewport


  React.useLayoutEffect(function () {
    scrollState.inViewport = inViewport;
  }, [inViewport]); // re-run if the callback updated

  React.useLayoutEffect(function () {
    _update({
      onlyUpdateInViewport: false
    });
  }, [_update]); // auto-update on scroll

  React.useEffect(function () {
    if (autoUpdate) return onScroll(function (_scroll) {
      return _update();
    });
  }, [autoUpdate, _update, onScroll]);
  return {
    rect: rect,
    // Dom rect - doesn't change on scroll - reactive
    bounds: bounds,
    // scrolled bounding rect in pixels - not reactive
    scale: scale,
    // reactive scene scale - includes z-axis so it can be spread onto mesh directly
    position: position,
    // scrolled element position in viewport units - not reactive
    scrollState: scrollState,
    // scroll progress stats - not reactive
    inViewport: inViewport,
    // reactive prop for when inside viewport
    update: function update() {
      return _update({
        onlyUpdateInViewport: false
      });
    } // optional manual update

  };
}

var _excluded$3 = ["track", "children", "margin", "inViewportMargin", "inViewportThreshold", "visible", "hideOffscreen", "scissor", "debug", "as", "renderOrder", "priority"];

function ownKeys$5(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$5(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$5(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

exports.ScrollScene = function ScrollScene(_ref) {
  var track = _ref.track,
      children = _ref.children,
      _ref$margin = _ref.margin,
      margin = _ref$margin === void 0 ? 0 : _ref$margin,
      inViewportMargin = _ref.inViewportMargin,
      inViewportThreshold = _ref.inViewportThreshold,
      _ref$visible = _ref.visible,
      visible = _ref$visible === void 0 ? true : _ref$visible,
      _ref$hideOffscreen = _ref.hideOffscreen,
      hideOffscreen = _ref$hideOffscreen === void 0 ? true : _ref$hideOffscreen,
      _ref$scissor = _ref.scissor,
      scissor = _ref$scissor === void 0 ? false : _ref$scissor,
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? false : _ref$debug,
      _ref$as = _ref.as,
      as = _ref$as === void 0 ? 'scene' : _ref$as,
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

  var globalRender = useCanvasStore(function (state) {
    return state.globalRender;
  });

  var _useTracker = useTracker({
    track: track,
    rootMargin: inViewportMargin,
    threshold: inViewportThreshold
  }),
      bounds = _useTracker.bounds,
      scale = _useTracker.scale,
      position = _useTracker.position,
      scrollState = _useTracker.scrollState,
      inViewport = _useTracker.inViewport; // Hide scene when outside of viewport if `hideOffscreen` or set to `visible` prop


  React.useLayoutEffect(function () {
    if (scene) scene.visible = hideOffscreen ? inViewport && visible : visible;
  }, [scene, inViewport, hideOffscreen, visible]); // RENDER FRAME

  fiber.useFrame(function (_ref2) {
    var gl = _ref2.gl,
        camera = _ref2.camera;
    if (!scene || !scale) return;

    if (scene.visible) {
      // move scene
      scene.position.y = position.y;
      scene.position.x = position.x;

      if (scissor) {
        renderScissor({
          gl: gl,
          scene: scene,
          camera: camera,
          left: bounds.left - margin,
          top: bounds.positiveYUpBottom - margin,
          width: bounds.width + margin * 2,
          height: bounds.height + margin * 2
        });
      } else {
        requestRender();
      }
    }
  }, globalRender ? priority : undefined);

  var content = /*#__PURE__*/jsxRuntime.jsxs("group", {
    renderOrder: renderOrder,
    children: [(!children || debug) && scale && /*#__PURE__*/jsxRuntime.jsx(DebugMesh$1, {
      scale: scale
    }), children && scene && scale && children(_objectSpread$5({
      // inherited props
      track: track,
      margin: margin,
      renderOrder: renderOrder,
      // new props
      scale: scale,
      scrollState: scrollState,
      inViewport: inViewport,
      scene: scene,
      // useFrame render priority (in case children need to run after)
      priority: priority + renderOrder
    }, props))]
  }); // portal if scissor or inline nested scene


  var InlineElement = as;
  return scissor ? fiber.createPortal(content, scene) : /*#__PURE__*/jsxRuntime.jsx(InlineElement, {
    ref: inlineSceneRef,
    children: content
  });
};

exports.ScrollScene = /*#__PURE__*/React__default["default"].memo(exports.ScrollScene);

var _excluded$2 = ["track", "children", "margin", "inViewportMargin", "inViewportThreshold", "visible", "hideOffscreen", "debug", "orthographic", "renderOrder", "priority"];

function ownKeys$4(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$4(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$4(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

exports.ViewportScrollScene = function ViewportScrollScene(_ref) {
  var track = _ref.track,
      children = _ref.children,
      _ref$margin = _ref.margin,
      margin = _ref$margin === void 0 ? 0 : _ref$margin,
      inViewportMargin = _ref.inViewportMargin,
      inViewportThreshold = _ref.inViewportThreshold,
      _ref$visible = _ref.visible,
      visible = _ref$visible === void 0 ? true : _ref$visible,
      _ref$hideOffscreen = _ref.hideOffscreen,
      hideOffscreen = _ref$hideOffscreen === void 0 ? true : _ref$hideOffscreen,
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? false : _ref$debug,
      _ref$orthographic = _ref.orthographic,
      orthographic = _ref$orthographic === void 0 ? false : _ref$orthographic,
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
      scene = _useState2[0]; // const get = useThree((state) => state.get)
  // const setEvents = useThree((state) => state.setEvents)


  var _useScrollRig = useScrollRig(),
      renderViewport = _useScrollRig.renderViewport;

  var pageReflow = useCanvasStore(function (state) {
    return state.pageReflow;
  });
  var scaleMultiplier = useCanvasStore(function (state) {
    return state.scaleMultiplier;
  });

  var _useTracker = useTracker({
    track: track,
    rootMargin: inViewportMargin,
    threshold: inViewportThreshold
  }),
      rect = _useTracker.rect,
      bounds = _useTracker.bounds,
      scale = _useTracker.scale,
      position = _useTracker.position,
      scrollState = _useTracker.scrollState,
      inViewport = _useTracker.inViewport; // Hide scene when outside of viewport if `hideOffscreen` or set to `visible` prop


  React.useLayoutEffect(function () {
    scene.visible = hideOffscreen ? inViewport && visible : visible;
  }, [inViewport, hideOffscreen, visible]);

  var _useState3 = React.useState(0),
      _useState4 = _slicedToArray__default["default"](_useState3, 2),
      cameraDistance = _useState4[0],
      setCameraDistance = _useState4[1]; // Find bounding box & scale mesh on resize


  React.useLayoutEffect(function () {
    var viewportWidth = rect.width * scaleMultiplier;
    var viewportHeight = rect.height * scaleMultiplier;
    var cameraDistance = Math.max(viewportWidth, viewportHeight);
    setCameraDistance(cameraDistance); // Calculate FOV to match the DOM rect for this camera distance

    if (camera.current && !orthographic) {
      camera.current.aspect = (viewportWidth + margin * 2 * scaleMultiplier) / (viewportHeight + margin * 2 * scaleMultiplier);
      camera.current.fov = 2 * (180 / Math.PI) * Math.atan((viewportHeight + margin * 2 * scaleMultiplier) / (2 * cameraDistance));
      camera.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
      // Update matrix world since the renderer is a frame late

      camera.current.updateMatrixWorld();
    } // trigger a frame


    fiber.invalidate();
  }, [track, pageReflow, rect, scaleMultiplier]);
  var compute = React__default["default"].useCallback(function (event, state) {
    // limit events to DOM element bounds
    if (track.current && event.target === track.current) {
      var width = bounds.width,
          height = bounds.height,
          left = bounds.left,
          top = bounds.top;
      var mWidth = width + margin * 2;
      var mHeight = height + margin * 2;
      var x = event.clientX - left + margin;
      var y = event.clientY - top + margin;
      state.pointer.set(x / mWidth * 2 - 1, -(y / mHeight) * 2 + 1);
      state.raycaster.setFromCamera(state.pointer, camera.current);
    }
  }, [bounds, position]); // Not needed?
  // from: https://github.com/pmndrs/drei/blob/d22fe0f58fd596c7bfb60a7a543cf6c80da87624/src/web/View.tsx#L80
  // but seems to work without it
  // useEffect(() => {
  //   // Connect the event layer to the tracking element
  //   const old = get().events.connected
  //   setEvents({ connected: track.current })
  //   return () => setEvents({ connected: old })
  // }, [])
  // RENDER FRAME

  fiber.useFrame(function (_ref2) {
    var gl = _ref2.gl;
    if (!scene || !scale) return; // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas

    if (scene.visible) {
      renderViewport({
        gl: gl,
        scene: scene,
        camera: camera.current,
        left: bounds.left - margin,
        top: bounds.positiveYUpBottom - margin,
        width: bounds.width + margin * 2,
        height: bounds.height + margin * 2
      });
    }
  }, priority);
  return bounds && fiber.createPortal( /*#__PURE__*/jsxRuntime.jsxs(jsxRuntime.Fragment, {
    children: [!orthographic && /*#__PURE__*/jsxRuntime.jsx("perspectiveCamera", {
      ref: camera,
      position: [0, 0, cameraDistance],
      onUpdate: function onUpdate(self) {
        return self.updateProjectionMatrix();
      }
    }), orthographic && /*#__PURE__*/jsxRuntime.jsx("orthographicCamera", {
      ref: camera,
      position: [0, 0, cameraDistance],
      onUpdate: function onUpdate(self) {
        return self.updateProjectionMatrix();
      },
      left: scale[0] / -2,
      right: scale[0] / 2,
      top: scale[1] / 2,
      bottom: scale[1] / -2,
      far: cameraDistance * 2,
      near: 0.001
    }), /*#__PURE__*/jsxRuntime.jsxs("group", {
      renderOrder: renderOrder,
      children: [(!children || debug) && scale && /*#__PURE__*/jsxRuntime.jsx(DebugMesh$1, {
        scale: scale
      }), children && scene && scale && children(_objectSpread$4({
        // inherited props
        track: track,
        margin: margin,
        renderOrder: renderOrder,
        // new props
        scale: scale,
        scrollState: scrollState,
        inViewport: inViewport,
        scene: scene,
        camera: camera.current,
        // useFrame render priority (in case children need to run after)
        priority: priority + renderOrder
      }, props))]
    })]
  }), scene, {
    events: {
      compute: compute,
      priority: priority
    },
    size: {
      width: rect.width,
      height: rect.height
    }
  });
};

exports.ViewportScrollScene = /*#__PURE__*/React__default["default"].memo(exports.ViewportScrollScene);

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted
 * @param {object} object THREE.js object3d
 */

function useCanvas(object) {
  var deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      key = _ref.key,
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

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$3(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var UseCanvas = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var children = _ref.children,
      id = _ref.id,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$1);

  // auto update canvas with all props
  useCanvas(children, _objectSpread$3(_objectSpread$3({}, props), {}, {
    ref: ref
  }), {
    key: id
  });
  return null;
});

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$2(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function useHideElementWhileMounted(el) {
  var deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  var _ref = arguments.length > 2 ? arguments[2] : undefined,
      debug = _ref.debug,
      _ref$style = _ref.style,
      style = _ref$style === void 0 ? {
    opacity: '0'
  } : _ref$style,
      className = _ref.className;

  // Hide DOM element
  React.useLayoutEffect(function () {
    // hide image - leave in DOM to measure and get events
    if (!(el !== null && el !== void 0 && el.current)) return;

    if (debug) {
      el.current.style.opacity = '0.5';
    } else {
      className && el.current.classList.add(className);
      Object.assign(el.current.style, _objectSpread$2({}, style));
    }

    return function () {
      if (!(el !== null && el !== void 0 && el.current)) return; // @ts-ignore

      Object.keys(style).forEach(function (key) {
        return el.current.style[key] = '';
      });
      className && el.current.classList.remove(className);
    };
  }, deps);
}

/**
 * Purpose: Hide tracked DOM elements on mount if GlobalCanvas is in use
 *
 * Creates an HTMLElement ref and applies CSS styles and/or a classname while the the component is mounted
 */

function useCanvasRef() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      style = _ref.style,
      className = _ref.className;

  var isCanvasAvailable = useCanvasStore(function (s) {
    return s.isCanvasAvailable;
  });
  var debug = useCanvasStore(function (s) {
    return s.debug;
  });
  var ref = React.useRef(null); // Apply hidden styles/classname to DOM element

  useHideElementWhileMounted(ref, [isCanvasAvailable], {
    debug: debug,
    style: style,
    className: className
  });
  return ref;
}

/**
 *  Create Threejs Texture from DOM image tag
 *
 *  - Supports <picture> and `srcset` - uses `currentSrc` to get the responsive image source
 *
 *  - Supports lazy-loading image - suspends until first load event. Warning: the GPU upload can cause jank
 *
 *  - Relies on browser cache to avoid loading image twice. We let the <img> tag load the image and suspend until it's ready.
 *
 *  - NOTE: You must add the `crossOrigin` attribute
 *     <img src="" alt="" crossOrigin="anonymous"/>
 */

function useTextureLoader() {
  // Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
  // expensive work of uploading a texture to the GPU off the main thread.
  // Copied from: github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/GLTFLoader.js#L2424
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) === true;
  var isFirefox = navigator.userAgent.indexOf('Firefox') > -1; // @ts-ignore

  var firefoxVersion = isFirefox ? navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1] : -1;
  return typeof createImageBitmap === 'undefined' || isSafari || isFirefox && firefoxVersion < 98;
}

function useImageAsTexture(imgRef) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$initTexture = _ref.initTexture,
      initTexture = _ref$initTexture === void 0 ? true : _ref$initTexture,
      _ref$premultiplyAlpha = _ref.premultiplyAlpha,
      premultiplyAlpha = _ref$premultiplyAlpha === void 0 ? 'default' : _ref$premultiplyAlpha;

  var _useThree = fiber.useThree(),
      gl = _useThree.gl;

  var _useThree2 = fiber.useThree(),
      size = _useThree2.size;

  var currentSrc = suspendReact.suspend(function () {
    return new Promise(function (resolve) {
      var el = imgRef.current; // respond to all future load events (resizing might load another image)

      el === null || el === void 0 ? void 0 : el.addEventListener('load', function () {
        return resolve(el === null || el === void 0 ? void 0 : el.currentSrc);
      }, {
        once: true
      }); // detect if loaded from browser cache

      if (el !== null && el !== void 0 && el.complete) {
        resolve(el === null || el === void 0 ? void 0 : el.currentSrc);
      }
    });
  }, [imgRef, size]);
  var LoaderProto = useTextureLoader() ? three.TextureLoader : three.ImageBitmapLoader; // @ts-ignore

  var result = fiber.useLoader(LoaderProto, currentSrc, function (loader) {
    if (loader instanceof three.ImageBitmapLoader) {
      loader.setOptions({
        colorSpaceConversion: 'none',
        premultiplyAlpha: premultiplyAlpha,
        // "none" increases blocking time in lighthouse
        imageOrientation: 'flipY'
      });
    }
  });
  var texture = React.useMemo(function () {
    if (result instanceof three.Texture) {
      return result;
    }

    if (result instanceof ImageBitmap) {
      return new three.CanvasTexture(result);
    }
  }, [result]); // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render

  React.useEffect(function uploadTextureToGPU() {
    initTexture && gl.initTexture(texture);
  }, [gl, texture, initTexture]);
  return texture;
}

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

  var lenisImpl = React.useRef(); // Expose lenis imperative API

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
      on: function on(event, cb) {
        var _lenisImpl$current3;

        return (_lenisImpl$current3 = lenisImpl.current) === null || _lenisImpl$current3 === void 0 ? void 0 : _lenisImpl$current3.on(event, cb);
      },
      once: function once(event, cb) {
        var _lenisImpl$current4;

        return (_lenisImpl$current4 = lenisImpl.current) === null || _lenisImpl$current4 === void 0 ? void 0 : _lenisImpl$current4.once(event, cb);
      },
      off: function off(event, cb) {
        var _lenisImpl$current5;

        return (_lenisImpl$current5 = lenisImpl.current) === null || _lenisImpl$current5 === void 0 ? void 0 : _lenisImpl$current5.off(event, cb);
      },
      scrollTo: function scrollTo(target, props) {
        var _lenisImpl$current6;

        return (_lenisImpl$current6 = lenisImpl.current) === null || _lenisImpl$current6 === void 0 ? void 0 : _lenisImpl$current6.scrollTo(target, props);
      },
      raf: function raf(time) {
        var _lenisImpl$current7;

        return (_lenisImpl$current7 = lenisImpl.current) === null || _lenisImpl$current7 === void 0 ? void 0 : _lenisImpl$current7.raf(time);
      }
    };
  });
  React.useEffect(function initLenis() {
    var lenis = lenisImpl.current = new Lenis__default["default"](_objectSpread$1({
      duration: duration,
      easing: easing,
      smooth: smooth,
      direction: direction
    }, config)); // cleanup on unmount

    return function () {
      lenis.destroy();
    };
  }, [duration, easing, smooth, direction]); // Support a render function as child

  return children && children(props);
}
var LenisScrollbar$1 = /*#__PURE__*/React.forwardRef(LenisScrollbar);

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var SmoothScrollbar = function SmoothScrollbar(_ref) {
  var _children = _ref.children,
      _ref$enabled = _ref.enabled,
      enabled = _ref$enabled === void 0 ? true : _ref$enabled,
      _ref$locked = _ref.locked,
      locked = _ref$locked === void 0 ? false : _ref$locked,
      _ref$scrollRestoratio = _ref.scrollRestoration,
      scrollRestoration = _ref$scrollRestoratio === void 0 ? 'auto' : _ref$scrollRestoratio,
      _ref$disablePointerOn = _ref.disablePointerOnScroll,
      disablePointerOnScroll = _ref$disablePointerOn === void 0 ? true : _ref$disablePointerOn,
      _ref$horizontal = _ref.horizontal,
      horizontal = _ref$horizontal === void 0 ? false : _ref$horizontal,
      config = _ref.config;
  var ref = React.useRef();
  var lenis = React.useRef();
  var preventPointer = React.useRef(false);
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
  }, []); // function to bind to scroll event
  // return function that will unbind same callback

  var onScroll = React.useCallback(function (cb) {
    var _lenis$current;

    (_lenis$current = lenis.current) === null || _lenis$current === void 0 ? void 0 : _lenis$current.on('scroll', cb);
    return function () {
      var _lenis$current2;

      return (_lenis$current2 = lenis.current) === null || _lenis$current2 === void 0 ? void 0 : _lenis$current2.off('scroll', cb);
    };
  }, []);
  React.useEffect(function () {
    var _lenis$current4, _lenis$current5;

    // let r3f drive the frameloop
    var removeEffect = fiber.addEffect(function (time) {
      var _lenis$current3;

      return (_lenis$current3 = lenis.current) === null || _lenis$current3 === void 0 ? void 0 : _lenis$current3.raf(time);
    }); // update global scroll store

    (_lenis$current4 = lenis.current) === null || _lenis$current4 === void 0 ? void 0 : _lenis$current4.on('scroll', function (_ref2) {
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

      var disablePointer = debounce.debounce(function () {
        return preventPointerEvents(true);
      }, 100, true);

      if (Math.abs(velocity) > 1.4) {
        disablePointer();
      } else {
        preventPointerEvents(false);
      }

      fiber.invalidate();
    }); // expose global scrollTo function
    // @ts-ignore

    useCanvasStore.setState({
      scrollTo: (_lenis$current5 = lenis.current) === null || _lenis$current5 === void 0 ? void 0 : _lenis$current5.scrollTo
    }); // expose global onScroll function to subscribe to scroll events
    // @ts-ignore

    useCanvasStore.setState({
      onScroll: onScroll
    }); // Set active

    document.documentElement.classList.toggle('js-has-smooth-scrollbar', enabled);
    useCanvasStore.setState({
      hasSmoothScrollbar: enabled
    }); // make sure R3F loop is invalidated when scrolling

    var invalidateOnWheelEvent = function invalidateOnWheelEvent() {
      return fiber.invalidate();
    };

    window.addEventListener('pointermove', onMouseMove);
    window.addEventListener('wheel', invalidateOnWheelEvent);
    return function () {
      removeEffect();
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('wheel', invalidateOnWheelEvent);
    };
  }, [enabled]);
  React.useLayoutEffect(function () {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = scrollRestoration;
    }
  }, []);
  React.useEffect(function () {
    var _lenis$current6, _lenis$current7;

    locked ? (_lenis$current6 = lenis.current) === null || _lenis$current6 === void 0 ? void 0 : _lenis$current6.stop() : (_lenis$current7 = lenis.current) === null || _lenis$current7 === void 0 ? void 0 : _lenis$current7.start();
  }, [locked]);
  return /*#__PURE__*/jsxRuntime.jsx(LenisScrollbar$1, {
    ref: lenis,
    smooth: enabled,
    direction: horizontal ? 'horizontal' : 'vertical',
    config: config,
    children: function children(bind) {
      return _children(_objectSpread(_objectSpread({}, bind), {}, {
        ref: ref
      }));
    }
  });
};

exports.GlobalCanvas = GlobalCanvasIfSupported$1;
exports.SmoothScrollbar = SmoothScrollbar;
exports.UseCanvas = UseCanvas;
exports._config = config;
exports.useCanvas = useCanvas;
exports.useCanvasRef = useCanvasRef;
exports.useCanvasStore = useCanvasStore;
exports.useImageAsTexture = useImageAsTexture;
exports.useScrollRig = useScrollRig;
exports.useScrollbar = useScrollbar;
exports.useTracker = useTracker;
