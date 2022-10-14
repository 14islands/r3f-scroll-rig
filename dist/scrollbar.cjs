'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _typeof = require('@babel/runtime/helpers/typeof');
var _objectWithoutProperties = require('@babel/runtime/helpers/objectWithoutProperties');
var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var create = require('zustand');
var react = require('react');
var fiber = require('@react-three/fiber');
var debounce = require('debounce');
var Lenis = require('@studio-freight/lenis');
var jsxRuntime = require('react/jsx-runtime');
var _slicedToArray = require('@babel/runtime/helpers/slicedToArray');
var reactIntersectionObserver = require('react-intersection-observer');
var reactUse = require('react-use');
var vecn = require('vecn');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);
var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);
var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var create__default = /*#__PURE__*/_interopDefaultLegacy(create);
var Lenis__default = /*#__PURE__*/_interopDefaultLegacy(Lenis);
var _slicedToArray__default = /*#__PURE__*/_interopDefaultLegacy(_slicedToArray);

// Global config
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

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$3(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var useCanvasStore = create__default["default"](function (set) {
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
          var obj = _objectSpread$3(_objectSpread$3({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
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

          var obj = _objectSpread$3(_objectSpread$3({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
            mesh: mesh,
            props: _objectSpread$3(_objectSpread$3({}, props), newProps),
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
            // or tell it that it is "inactive"
            canvasChildren[key].instances = 0;
            canvasChildren[key].props.inactive = true;
            return {
              canvasChildren: _objectSpread$3({}, canvasChildren)
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
var useCanvasStore$1 = useCanvasStore;

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

var isBrowser = typeof window !== 'undefined';
var useLayoutEffect = isBrowser ? react.useLayoutEffect : react.useEffect;

var _excluded = ["children", "duration", "easing", "smooth", "direction", "config"];

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$2(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

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
  react.useEffect(function initLenis() {
    // @ts-ignore
    var lenis = lenisImpl.current = new Lenis__default["default"](_objectSpread$2({
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
var LenisScrollbar$1 = /*#__PURE__*/react.forwardRef(LenisScrollbar);

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
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
  var ref = react.useRef();
  var lenis = react.useRef();
  var preventPointer = react.useRef(false);
  var globalScrollState = useCanvasStore$1(function (state) {
    return state.scroll;
  }); // set initial scroll direction
  // need to be updated before children render

  globalScrollState.direction = horizontal ? 'horizontal' : 'vertical'; // disable pointer events while scrolling to avoid slow event handlers

  var preventPointerEvents = function preventPointerEvents(prevent) {
    if (!disablePointerOnScroll) return;

    if (ref.current && preventPointer.current !== prevent) {
      preventPointer.current = prevent;
      ref.current.style.pointerEvents = prevent ? 'none' : 'auto';
    }
  }; // reset pointer events when moving mouse


  var onMouseMove = react.useCallback(function () {
    preventPointerEvents(false);
  }, []); // function to bind to scroll event
  // return function that will unbind same callback

  var onScroll = react.useCallback(function (cb) {
    var _lenis$current;

    (_lenis$current = lenis.current) === null || _lenis$current === void 0 ? void 0 : _lenis$current.on('scroll', cb);
    return function () {
      var _lenis$current2;

      return (_lenis$current2 = lenis.current) === null || _lenis$current2 === void 0 ? void 0 : _lenis$current2.off('scroll', cb);
    };
  }, []); // apply chosen scroll restoration

  useLayoutEffect(function () {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = scrollRestoration;
    }
  }, []);
  react.useEffect(function () {
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
      globalScrollState.y = direction === 'vertical' ? scroll : 0;
      globalScrollState.x = direction === 'horizontal' ? scroll : 0;
      globalScrollState.limit = limit;
      globalScrollState.velocity = velocity;
      globalScrollState.direction = direction;
      globalScrollState.progress = progress; // disable pointer logic

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

    useCanvasStore$1.setState({
      scrollTo: (_lenis$current5 = lenis.current) === null || _lenis$current5 === void 0 ? void 0 : _lenis$current5.scrollTo
    }); // expose global onScroll function to subscribe to scroll events
    // @ts-ignore

    useCanvasStore$1.setState({
      onScroll: onScroll
    }); // Set current scroll position on load in case reloaded further down

    useCanvasStore$1.getState().scroll.y = window.scrollY;
    useCanvasStore$1.getState().scroll.x = window.scrollX; // Set active

    document.documentElement.classList.toggle('js-smooth-scrollbar-enabled', enabled);
    document.documentElement.classList.toggle('js-smooth-scrollbar-disabled', !enabled);
    useCanvasStore$1.setState({
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
  react.useEffect(function () {
    var _lenis$current6, _lenis$current7;

    locked ? (_lenis$current6 = lenis.current) === null || _lenis$current6 === void 0 ? void 0 : _lenis$current6.stop() : (_lenis$current7 = lenis.current) === null || _lenis$current7 === void 0 ? void 0 : _lenis$current7.start();
  }, [locked]);
  return /*#__PURE__*/jsxRuntime.jsx(LenisScrollbar$1, {
    ref: lenis,
    smooth: enabled,
    direction: horizontal ? 'horizontal' : 'vertical',
    config: config,
    children: function children(bind) {
      return _children(_objectSpread$1(_objectSpread$1({}, bind), {}, {
        ref: ref
      }));
    }
  });
};

// Linear mapping from range <a1, a2> to range <b1, b2>
function mapLinear(x, a1, a2, b1, b2) {
  return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
}

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

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

function useTracker(track, options) {
  var size = reactUse.useWindowSize();

  var _useScrollbar = useScrollbar(),
      scroll = _useScrollbar.scroll,
      onScroll = _useScrollbar.onScroll;

  var scaleMultiplier = useCanvasStore(function (state) {
    return state.scaleMultiplier;
  });
  var pageReflow = useCanvasStore(function (state) {
    return state.pageReflow;
  });

  var _defaultArgs$options = _objectSpread(_objectSpread({}, defaultArgs), options),
      rootMargin = _defaultArgs$options.rootMargin,
      threshold = _defaultArgs$options.threshold,
      autoUpdate = _defaultArgs$options.autoUpdate; // check if element is in viewport


  var _useInView = reactIntersectionObserver.useInView({
    rootMargin: rootMargin,
    threshold: threshold
  }),
      ref = _useInView.ref,
      inViewport = _useInView.inView; // bind useInView ref to current tracking element


  useLayoutEffect(function () {
    ref(track.current);
  }, [track]); // Using state so it's reactive

  var _useState = react.useState(),
      _useState2 = _slicedToArray__default["default"](_useState, 2),
      scale = _useState2[0],
      setScale = _useState2[1]; // Using ref because


  var scrollState = react.useRef({
    inViewport: false,
    progress: -1,
    visibility: -1,
    viewport: -1
  }).current; // DOM rect (initial position in pixels offset by scroll value on page load)
  // Using ref so we can calculate bounds & position without a re-render

  var rect = react.useRef({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0
  }).current; // expose internal ref as a reactive state as well

  var _useState3 = react.useState(rect),
      _useState4 = _slicedToArray__default["default"](_useState3, 2),
      reactiveRect = _useState4[0],
      setReactiveRect = _useState4[1]; // bounding rect in pixels - updated by scroll


  var bounds = react.useRef({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    positiveYUpBottom: 0
  }).current; // position in viewport units - updated by scroll

  var position = react.useRef(vecn.vec3(0, 0, 0)).current; // Calculate bounding Rect as soon as it's available

  useLayoutEffect(function () {
    var _track$current;

    var _rect = (_track$current = track.current) === null || _track$current === void 0 ? void 0 : _track$current.getBoundingClientRect();

    rect.top = _rect.top + window.scrollY;
    rect.bottom = _rect.bottom + window.scrollY;
    rect.left = _rect.left + window.scrollX;
    rect.right = _rect.right + window.scrollX;
    rect.width = _rect.width;
    rect.height = _rect.height;
    rect.x = rect.left + _rect.width * 0.5;
    rect.y = rect.top + _rect.height * 0.5;
    setReactiveRect(_objectSpread({}, rect));
    setScale(vecn.vec3((rect === null || rect === void 0 ? void 0 : rect.width) * scaleMultiplier, (rect === null || rect === void 0 ? void 0 : rect.height) * scaleMultiplier, 1));
  }, [track, size, pageReflow, scaleMultiplier]);

  var _update = react.useCallback(function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$onlyUpdateInView = _ref.onlyUpdateInViewport,
        onlyUpdateInViewport = _ref$onlyUpdateInView === void 0 ? true : _ref$onlyUpdateInView;

    if (!track.current || onlyUpdateInViewport && !scrollState.inViewport) {
      return;
    }

    updateBounds(bounds, rect, scroll, size);
    updatePosition(position, bounds, scaleMultiplier); // scrollState setup based on scroll direction

    var isHorizontal = scroll.direction === 'horizontal';
    var sizeProp = isHorizontal ? 'width' : 'height';
    var startProp = isHorizontal ? 'left' : 'top'; // calculate progress of passing through viewport (0 = just entered, 1 = just exited)

    var pxInside = size[sizeProp] - bounds[startProp];
    scrollState.progress = mapLinear(pxInside, 0, size[sizeProp] + bounds[sizeProp], 0, 1); // percent of total visible distance

    scrollState.visibility = mapLinear(pxInside, 0, bounds[sizeProp], 0, 1); // percent of item height in view

    scrollState.viewport = mapLinear(pxInside, 0, size[sizeProp], 0, 1); // percent of window height scrolled since visible
  }, [track, size, scaleMultiplier, scroll]); // update scrollState in viewport


  useLayoutEffect(function () {
    scrollState.inViewport = inViewport; // update once more in case it went out of view

    _update({
      onlyUpdateInViewport: false
    });
  }, [inViewport]); // re-run if the callback updated

  useLayoutEffect(function () {
    _update({
      onlyUpdateInViewport: false
    });
  }, [_update]); // auto-update on scroll

  react.useEffect(function () {
    if (autoUpdate) return onScroll(function (_scroll) {
      return _update();
    });
  }, [autoUpdate, _update, onScroll]);
  return {
    rect: reactiveRect,
    // Dom rect - doesn't change on scroll - not - reactive
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

exports.SmoothScrollbar = SmoothScrollbar;
exports.useScrollbar = useScrollbar;
exports.useTracker = useTracker;
