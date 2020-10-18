'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('@babel/runtime/helpers/extends'));
var _objectWithoutPropertiesLoose = _interopDefault(require('@babel/runtime/helpers/objectWithoutPropertiesLoose'));
var React = require('react');
var React__default = _interopDefault(React);
var create = _interopDefault(require('zustand'));

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
      scrollY = _ref$scrollY === void 0 ? null : _ref$scrollY,
      onUpdate = _ref.onUpdate;
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

exports.VirtualScrollbar = VirtualScrollbar;
