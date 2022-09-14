'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _typeof = require('@babel/runtime/helpers/typeof');
var _objectWithoutProperties = require('@babel/runtime/helpers/objectWithoutProperties');
var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var create = require('zustand');
var middleware = require('zustand/middleware');
var react = require('react');
var Lenis = require('@studio-freight/lenis');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);
var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);
var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var create__default = /*#__PURE__*/_interopDefaultLegacy(create);
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
var config$1 = config;

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof__default["default"](key) === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (_typeof__default["default"](input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof__default["default"](res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var useCanvasStore = create__default["default"](middleware.subscribeWithSelector(function (set) {
  return {
    // //////////////////////////////////////////////////////////////////////////
    // GLOBAL ScrollRig STATE
    // //////////////////////////////////////////////////////////////////////////
    debug: false,
    scaleMultiplier: config$1.DEFAULT_SCALE_MULTIPLIER,
    globalRender: true,
    globalPriority: config$1.PRIORITY_GLOBAL,
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
          var obj = _objectSpread$1(_objectSpread$1({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
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

        var obj = _objectSpread$1(_objectSpread$1({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
          mesh: mesh,
          props: _objectSpread$1(_objectSpread$1({}, props), newProps),
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
    }
  };
}));

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

var _excluded = ["children", "duration", "easing", "smooth", "direction", "config"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

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

  var lenisImpl = react.useRef(); // Expose lenis imperative API

  react.useImperativeHandle(ref, function () {
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
      scrollTo: function scrollTo(target, props) {
        var _lenisImpl$current4;

        return (_lenisImpl$current4 = lenisImpl.current) === null || _lenisImpl$current4 === void 0 ? void 0 : _lenisImpl$current4.scrollTo(target, props);
      },
      raf: function raf(time) {
        var _lenisImpl$current5;

        return (_lenisImpl$current5 = lenisImpl.current) === null || _lenisImpl$current5 === void 0 ? void 0 : _lenisImpl$current5.raf(time);
      }
    };
  });
  react.useEffect(function initLenis() {
    var lenis = lenisImpl.current = new Lenis__default["default"](_objectSpread({
      duration: duration,
      easing: easing,
      smooth: smooth,
      direction: direction
    }, config)); // cleanup on unmount

    return function () {
      lenis.destroy();
    };
  }, [duration, easing, smooth, direction, config]); // Support a render function as child

  return children && children(props);
}

exports.LenisScrollbar = LenisScrollbar;
exports.useScrollbar = useScrollbar;
