'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _typeof = require('@babel/runtime/helpers/typeof');
var _objectWithoutProperties = require('@babel/runtime/helpers/objectWithoutProperties');
var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var create = require('zustand');
var middleware = require('zustand/middleware');
var _slicedToArray = require('@babel/runtime/helpers/slicedToArray');
var React = require('react');
var PropTypes = require('prop-types');
var _lerp = require('@14islands/lerp');
var windowSize = require('@react-hook/window-size');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);
var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);
var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var create__default = /*#__PURE__*/_interopDefaultLegacy(create);
var _slicedToArray__default = /*#__PURE__*/_interopDefaultLegacy(_slicedToArray);
var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var PropTypes__default = /*#__PURE__*/_interopDefaultLegacy(PropTypes);
var _lerp__default = /*#__PURE__*/_interopDefaultLegacy(_lerp);

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

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof__default["default"](key) === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (_typeof__default["default"](input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof__default["default"](res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
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

        var obj = _objectSpread(_objectSpread({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
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

        var obj = _objectSpread(_objectSpread({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
          mesh: mesh,
          props: _objectSpread(_objectSpread({}, props), newProps)
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
var useCanvasStore$1 = useCanvasStore;

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
var config$1 = config;

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
  var setVirtualScrollbar = useCanvasStore$1(function (state) {
    return state.setVirtualScrollbar;
  });
  var requestReflow = useCanvasStore$1(function (state) {
    return state.requestReflow;
  });
  var pageReflowRequested = useCanvasStore$1(function (state) {
    return state.pageReflowRequested;
  });
  var setScrollY = useCanvasStore$1(function (state) {
    return state.setScrollY;
  });

  var _useWindowSize = windowSize.useWindowSize(),
      _useWindowSize2 = _slicedToArray__default["default"](_useWindowSize, 2),
      width = _useWindowSize2[0],
      height = _useWindowSize2[1];

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
    return lerp || config$1.scrollLerp;
  }, [lerp]); // reflow on webfont loaded to prevent misalignments

  React.useLayoutEffect(function () {
    if ('fonts' in document) {
      document.fonts.onloadingdone = requestReflow;
    }

    return function () {
      if ('fonts' in document) {
        document.fonts.onloadingdone = null;
      }
    };
  }, []);

  var setScrollPosition = function setScrollPosition() {
    if (!scrolling.current) return;

    window.__origScrollTo(0, roundedY.current); // Trigger optional callback here


    onUpdate && onUpdate(y);

    if (delta.current <= (restDelta || config$1.scrollRestDelta)) {
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

    var newTarget = _lerp__default["default"](y.current, y.target, config$1.scrollLerp, frameDelta * 0.001);

    delta.current = Math.abs(y.current - newTarget);
    y.current = newTarget; // round for scrollbar

    roundedY.current = config$1.subpixelScrolling ? y.current : Math.floor(y.current);

    if (!useRenderLoop) {
      setScrollPosition();
    }
  };

  var scrollTo = React.useCallback(function (newY) {
    var lerp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : originalLerp;
    config$1.scrollLerp = lerp;
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
  }, [scrollTo]); // disable subpixelScrolling for better visual sync with canvas

  React.useLayoutEffect(function () {
    var ssBefore = config$1.subpixelScrolling;
    config$1.subpixelScrolling = subpixelScrolling;
    return function () {
      config$1.subpixelScrolling = ssBefore;
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
      y.current = window.scrollY;
      y.target = window.scrollY; // set lerp to 1 temporarily so canvas also moves immediately

      config$1.scrollLerp = 1; // update internal state to we are in sync

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
      documentHeight.current = document.body.clientHeight - window.innerHeight;
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
  }));
};
HijackedScrollbar.propTypes = {
  disabled: PropTypes__default["default"].bool,
  onUpdate: PropTypes__default["default"].func,
  speed: PropTypes__default["default"].number,
  lerp: PropTypes__default["default"].number,
  restDelta: PropTypes__default["default"].number,
  location: PropTypes__default["default"].any,
  useUpdateLoop: PropTypes__default["default"].func,
  useRenderLoop: PropTypes__default["default"].func,
  invalidate: PropTypes__default["default"].func,
  subpixelScrolling: PropTypes__default["default"].bool
};

exports.HijackedScrollbar = HijackedScrollbar;
exports.useScrollbar = useScrollbar;
