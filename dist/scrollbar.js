import create from 'zustand';
import { forwardRef, useRef, useImperativeHandle, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import { debounce } from 'debounce';
import { addEffect, invalidate } from '@react-three/fiber';
import Lenis from '@studio-freight/lenis';
import { jsx } from 'react/jsx-runtime';
import { useInView } from 'react-intersection-observer';
import { useWindowSize } from 'react-use';
import { vec3 } from 'vecn';

// Transient shared state for canvas components
// usContext() causes re-rendering which can drop frames
const config = {
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

const useCanvasStore = create(set => ({
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
  clearGlobalRenderQueue: () => set(() => ({
    globalRenderQueue: false
  })),
  // true if WebGL initialized without errors
  isCanvasAvailable: true,
  // true if <VirtualScrollbar> is currently enabled
  hasSmoothScrollbar: false,
  // map of all components to render on the global canvas
  canvasChildren: {},
  // add component to canvas
  renderToCanvas: function (key, mesh) {
    let props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return set(_ref => {
      let {
        canvasChildren
      } = _ref;

      // check if already mounted
      if (Object.getOwnPropertyDescriptor(canvasChildren, key)) {
        // increase usage count
        canvasChildren[key].instances += 1;
        canvasChildren[key].props.inactive = false;
        return {
          canvasChildren
        };
      } else {
        // otherwise mount it
        const obj = { ...canvasChildren,
          [key]: {
            mesh,
            props,
            instances: 1
          }
        };
        return {
          canvasChildren: obj
        };
      }
    });
  },
  // pass new props to a canvas component
  updateCanvas: (key, newProps) => // @ts-ignore
  set(_ref2 => {
    let {
      canvasChildren
    } = _ref2;
    if (!canvasChildren[key]) return;
    const {
      [key]: {
        mesh,
        props,
        instances
      }
    } = canvasChildren;
    const obj = { ...canvasChildren,
      [key]: {
        mesh,
        props: { ...props,
          ...newProps
        },
        instances
      }
    }; // console.log('updateCanvas', key, { ...props, ...newProps })

    return {
      canvasChildren: obj
    };
  }),
  // remove component from canvas
  removeFromCanvas: function (key) {
    let dispose = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    return set(_ref3 => {
      var _canvasChildren$key;

      let {
        canvasChildren
      } = _ref3;

      // check if remove or reduce instances
      if (((_canvasChildren$key = canvasChildren[key]) === null || _canvasChildren$key === void 0 ? void 0 : _canvasChildren$key.instances) > 1) {
        // reduce usage count
        canvasChildren[key].instances -= 1;
        return {
          canvasChildren
        };
      } else {
        if (dispose) {
          // unmount since no longer used
          const {
            [key]: _omit,
            ...obj
          } = canvasChildren; // make a separate copy of the obj and omit

          return {
            canvasChildren: obj
          };
        } else {
          // or tell it to "act" hidden
          canvasChildren[key].instances = 0;
          canvasChildren[key].props.inactive = true;
          return {
            canvasChildren
          };
        }
      }
    });
  },
  // Used to ask components to re-calculate their positions after a layout reflow
  pageReflow: 0,
  requestReflow: () => {
    set(state => {
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
  scrollTo: target => window.scrollTo(0, target),
  onScroll: () => () => {}
}));
var useCanvasStore$1 = useCanvasStore;

/**
 * Public interface for ScrollRig
 */
const useScrollbar = () => {
  const hasSmoothScrollbar = useCanvasStore(state => state.hasSmoothScrollbar);
  const scroll = useCanvasStore(state => state.scroll);
  const scrollTo = useCanvasStore(state => state.scrollTo);
  const onScroll = useCanvasStore(state => state.onScroll);
  return {
    enabled: hasSmoothScrollbar,
    scroll,
    scrollTo,
    onScroll
  };
};

const EASE_EXP_OUT = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // https://easings.net/


function LenisScrollbar(_ref, ref) {
  let {
    children,
    duration = 1,
    easing = EASE_EXP_OUT,
    smooth = true,
    direction = 'vertical',
    config,
    ...props
  } = _ref;
  const lenisImpl = useRef(); // Expose lenis imperative API

  useImperativeHandle(ref, () => ({
    start: () => {
      var _lenisImpl$current;

      return (_lenisImpl$current = lenisImpl.current) === null || _lenisImpl$current === void 0 ? void 0 : _lenisImpl$current.start();
    },
    stop: () => {
      var _lenisImpl$current2;

      return (_lenisImpl$current2 = lenisImpl.current) === null || _lenisImpl$current2 === void 0 ? void 0 : _lenisImpl$current2.stop();
    },
    on: (event, cb) => {
      var _lenisImpl$current3;

      return (_lenisImpl$current3 = lenisImpl.current) === null || _lenisImpl$current3 === void 0 ? void 0 : _lenisImpl$current3.on(event, cb);
    },
    once: (event, cb) => {
      var _lenisImpl$current4;

      return (_lenisImpl$current4 = lenisImpl.current) === null || _lenisImpl$current4 === void 0 ? void 0 : _lenisImpl$current4.once(event, cb);
    },
    off: (event, cb) => {
      var _lenisImpl$current5;

      return (_lenisImpl$current5 = lenisImpl.current) === null || _lenisImpl$current5 === void 0 ? void 0 : _lenisImpl$current5.off(event, cb);
    },
    scrollTo: (target, props) => {
      var _lenisImpl$current6;

      return (_lenisImpl$current6 = lenisImpl.current) === null || _lenisImpl$current6 === void 0 ? void 0 : _lenisImpl$current6.scrollTo(target, props);
    },
    raf: time => {
      var _lenisImpl$current7;

      return (_lenisImpl$current7 = lenisImpl.current) === null || _lenisImpl$current7 === void 0 ? void 0 : _lenisImpl$current7.raf(time);
    }
  }));
  useEffect(function initLenis() {
    const lenis = lenisImpl.current = new Lenis({
      duration,
      easing,
      smooth,
      direction,
      ...config
    }); // cleanup on unmount

    return () => {
      lenis.destroy();
    };
  }, [duration, easing, smooth, direction]); // Support a render function as child

  return children && children(props);
}
var LenisScrollbar$1 = /*#__PURE__*/forwardRef(LenisScrollbar);

const SmoothScrollbar = _ref => {
  let {
    children,
    enabled = true,
    locked = false,
    scrollRestoration = 'auto',
    disablePointerOnScroll = true,
    horizontal = false,
    config
  } = _ref;
  const ref = useRef();
  const lenis = useRef();
  const preventPointer = useRef(false);
  const scrollState = useCanvasStore$1(state => state.scroll); // disable pointer events while scrolling to avoid slow event handlers

  const preventPointerEvents = prevent => {
    if (!disablePointerOnScroll) return;

    if (ref.current && preventPointer.current !== prevent) {
      preventPointer.current = prevent;
      ref.current.style.pointerEvents = prevent ? 'none' : 'auto';
    }
  }; // reset pointer events when moving mouse


  const onMouseMove = useCallback(() => {
    preventPointerEvents(false);
  }, []); // function to bind to scroll event
  // return function that will unbind same callback

  const onScroll = useCallback(cb => {
    var _lenis$current;

    (_lenis$current = lenis.current) === null || _lenis$current === void 0 ? void 0 : _lenis$current.on('scroll', cb);
    return () => {
      var _lenis$current2;

      return (_lenis$current2 = lenis.current) === null || _lenis$current2 === void 0 ? void 0 : _lenis$current2.off('scroll', cb);
    };
  }, []);
  useEffect(() => {
    var _lenis$current4, _lenis$current5;

    // let r3f drive the frameloop
    const removeEffect = addEffect(time => {
      var _lenis$current3;

      return (_lenis$current3 = lenis.current) === null || _lenis$current3 === void 0 ? void 0 : _lenis$current3.raf(time);
    }); // update global scroll store

    (_lenis$current4 = lenis.current) === null || _lenis$current4 === void 0 ? void 0 : _lenis$current4.on('scroll', _ref2 => {
      let {
        scroll,
        limit,
        velocity,
        direction,
        progress
      } = _ref2;
      scrollState.y = direction === 'vertical' ? scroll : 0;
      scrollState.x = direction === 'horizontal' ? scroll : 0;
      scrollState.limit = limit;
      scrollState.velocity = velocity;
      scrollState.direction = direction;
      scrollState.progress = progress; // disable pointer logic

      const disablePointer = debounce(() => preventPointerEvents(true), 100, true);

      if (Math.abs(velocity) > 1.4) {
        disablePointer();
      } else {
        preventPointerEvents(false);
      }

      invalidate();
    }); // expose global scrollTo function
    // @ts-ignore

    useCanvasStore$1.setState({
      scrollTo: (_lenis$current5 = lenis.current) === null || _lenis$current5 === void 0 ? void 0 : _lenis$current5.scrollTo
    }); // expose global onScroll function to subscribe to scroll events
    // @ts-ignore

    useCanvasStore$1.setState({
      onScroll
    }); // set initial scroll direction

    scrollState.direction = horizontal ? 'horizontal' : 'vertical'; // Set active

    document.documentElement.classList.toggle('js-has-smooth-scrollbar', enabled);
    useCanvasStore$1.setState({
      hasSmoothScrollbar: enabled
    }); // make sure R3F loop is invalidated when scrolling

    const invalidateOnWheelEvent = () => invalidate();

    window.addEventListener('pointermove', onMouseMove);
    window.addEventListener('wheel', invalidateOnWheelEvent);
    return () => {
      removeEffect();
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('wheel', invalidateOnWheelEvent);
    };
  }, [enabled]);
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = scrollRestoration;
    }
  }, []);
  useEffect(() => {
    var _lenis$current6, _lenis$current7;

    locked ? (_lenis$current6 = lenis.current) === null || _lenis$current6 === void 0 ? void 0 : _lenis$current6.stop() : (_lenis$current7 = lenis.current) === null || _lenis$current7 === void 0 ? void 0 : _lenis$current7.start();
  }, [locked]);
  return /*#__PURE__*/jsx(LenisScrollbar$1, {
    ref: lenis,
    smooth: enabled,
    direction: horizontal ? 'horizontal' : 'vertical',
    config: config,
    children: bind => children({ ...bind,
      ref
    })
  });
};

// Linear mapping from range <a1, a2> to range <b1, b2>
function mapLinear(x, a1, a2, b1, b2) {
  return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
}

function isElementProps(obj) {
  return typeof obj === 'object' && 'track' in obj;
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

const defaultArgs = {
  rootMargin: '50%',
  threshold: 0,
  autoUpdate: true
};
/**
 * Returns the current Scene position of the DOM element
 * based on initial getBoundingClientRect and scroll delta from start
 */

function useTracker(args) {
  let deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  const size = useWindowSize();
  const {
    scroll,
    onScroll
  } = useScrollbar();
  const scaleMultiplier = useCanvasStore(state => state.scaleMultiplier);
  const pageReflow = useCanvasStore(state => state.pageReflow); // scrollState setup based on scroll direction

  const isVertical = scroll.direction === 'vertical';
  const sizeProp = isVertical ? 'height' : 'width';
  const startProp = isVertical ? 'top' : 'left';
  const {
    track,
    rootMargin,
    threshold,
    autoUpdate
  } = isElementProps(args) ? { ...defaultArgs,
    ...args
  } : { ...defaultArgs,
    track: args
  }; // check if element is in viewport

  const {
    ref,
    inView: inViewport
  } = useInView({
    rootMargin,
    threshold
  }); // bind useInView ref to current tracking element

  useLayoutEffect(() => {
    ref(track.current);
  }, [track]); // Using state so it's reactive

  const [scale, setScale] = useState(); // Using ref because

  const scrollState = useRef({
    inViewport: false,
    progress: -1,
    visibility: -1,
    viewport: -1
  }).current; // DOM rect (initial position in pixels offset by scroll value on page load)
  // Using ref so we can calculate bounds & position without a re-render

  const rect = useRef({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0
  }).current; // expose internal ref as a reactive state as well

  const [reactiveRect, setReactiveRect] = useState(rect); // bounding rect in pixels - updated by scroll

  const bounds = useRef({
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

  const position = useRef(vec3(0, 0, 0)).current; // Calculate bounding Rect as soon as it's available

  useLayoutEffect(() => {
    var _track$current;

    const _rect = (_track$current = track.current) === null || _track$current === void 0 ? void 0 : _track$current.getBoundingClientRect();

    rect.top = _rect.top + window.scrollY;
    rect.bottom = _rect.bottom + window.scrollY;
    rect.left = _rect.left + window.scrollX;
    rect.right = _rect.right + window.scrollX;
    rect.width = _rect.width;
    rect.height = _rect.height;
    rect.x = rect.left + _rect.width * 0.5;
    rect.y = rect.top + _rect.height * 0.5;
    setReactiveRect({ ...rect
    });
    setScale(vec3((rect === null || rect === void 0 ? void 0 : rect.width) * scaleMultiplier, (rect === null || rect === void 0 ? void 0 : rect.height) * scaleMultiplier, 1));
  }, [track, size, pageReflow, scaleMultiplier, ...deps]);
  const update = useCallback(function () {
    let {
      onlyUpdateInViewport = true
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!track.current || onlyUpdateInViewport && !scrollState.inViewport) {
      return;
    }

    updateBounds(bounds, rect, scroll, size);
    updatePosition(position, bounds, scaleMultiplier); // calculate progress of passing through viewport (0 = just entered, 1 = just exited)

    const pxInside = size[sizeProp] - bounds[startProp];
    scrollState.progress = mapLinear(pxInside, 0, size[sizeProp] + bounds[sizeProp], 0, 1); // percent of total visible distance

    scrollState.visibility = mapLinear(pxInside, 0, bounds[sizeProp], 0, 1); // percent of item height in view

    scrollState.viewport = mapLinear(pxInside, 0, size[sizeProp], 0, 1); // percent of window height scrolled since visible
  }, [track, size, scaleMultiplier, scroll]); // update scrollState in viewport

  useLayoutEffect(() => {
    scrollState.inViewport = inViewport; // update once more in case it went out of view

    update({
      onlyUpdateInViewport: false
    });
  }, [inViewport]); // re-run if the callback updated

  useLayoutEffect(() => {
    update({
      onlyUpdateInViewport: false
    });
  }, [update]); // auto-update on scroll

  useEffect(() => {
    if (autoUpdate) return onScroll(_scroll => update());
  }, [autoUpdate, update, onScroll]);
  return {
    rect: reactiveRect,
    // Dom rect - doesn't change on scroll - not - reactive
    bounds,
    // scrolled bounding rect in pixels - not reactive
    scale,
    // reactive scene scale - includes z-axis so it can be spread onto mesh directly
    position,
    // scrolled element position in viewport units - not reactive
    scrollState,
    // scroll progress stats - not reactive
    inViewport,
    // reactive prop for when inside viewport
    update: () => update({
      onlyUpdateInViewport: false
    }) // optional manual update

  };
}

function useHideElementWhileMounted(el) {
  let deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  let {
    debug,
    style = {
      opacity: '0'
    },
    className
  } = arguments.length > 2 ? arguments[2] : undefined;
  // Hide DOM element
  useLayoutEffect(() => {
    // hide image - leave in DOM to measure and get events
    if (!(el !== null && el !== void 0 && el.current)) return;

    if (debug) {
      el.current.style.opacity = '0.5';
    } else {
      className && el.current.classList.add(className);
      Object.assign(el.current.style, { ...style
      });
    }

    return () => {
      if (!(el !== null && el !== void 0 && el.current)) return; // @ts-ignore

      Object.keys(style).forEach(key => el.current.style[key] = '');
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
  let {
    style,
    className
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const isCanvasAvailable = useCanvasStore(s => s.isCanvasAvailable);
  const debug = useCanvasStore(s => s.debug);
  const ref = useRef(null); // Apply hidden styles/classname to DOM element

  useHideElementWhileMounted(ref, [isCanvasAvailable], {
    debug,
    style,
    className
  });
  return ref;
}

export { SmoothScrollbar, useCanvasRef, useScrollbar, useTracker };
