import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import React, { useRef, useMemo, useLayoutEffect, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import _lerp from '@14islands/lerp';
import { useWindowSize } from '@react-hook/window-size';

/**
 * runtime check for requestIdleCallback
 */
const requestIdleCallback = function (callback) {
  let {
    timeout = 100
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, {
      timeout
    });
  } else {
    setTimeout(callback, 0);
  }
};
var requestIdleCallback$1 = requestIdleCallback;

const useCanvasStore = create(subscribeWithSelector(set => ({
  // //////////////////////////////////////////////////////////////////////////
  // GLOBAL ScrollRig STATE
  // //////////////////////////////////////////////////////////////////////////
  globalRenderQueue: false,
  clearGlobalRenderQueue: () => set(state => ({
    globalRenderQueue: false
  })),
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
  renderToCanvas: function (key, mesh) {
    let props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return set(_ref => {
      let {
        canvasChildren
      } = _ref;
      const obj = { ...canvasChildren,
        [key]: {
          mesh,
          props
        }
      };
      return {
        canvasChildren: obj
      };
    });
  },
  // pass new props to a canvas component
  updateCanvas: (key, newProps) => set(_ref2 => {
    let {
      canvasChildren
    } = _ref2;
    if (!canvasChildren[key]) return;
    const {
      [key]: {
        mesh,
        props
      }
    } = canvasChildren;
    const obj = { ...canvasChildren,
      [key]: {
        mesh,
        props: { ...props,
          ...newProps
        }
      }
    };
    return {
      canvasChildren: obj
    };
  }),
  // remove component from canvas
  removeFromCanvas: key => set(_ref3 => {
    let {
      canvasChildren
    } = _ref3;
    const {
      [key]: omit,
      ...obj
    } = canvasChildren; // make a separate copy of the obj and omit

    return {
      canvasChildren: obj
    };
  }),
  // Used to ask components to re-calculate their positions after a layout reflow
  pageReflowRequested: 0,
  pageReflowCompleted: 0,
  requestReflow: () => {
    set(state => {
      requestIdleCallback(state.triggerReflowCompleted, {
        timeout: 100
      });
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
})));
var useCanvasStore$1 = useCanvasStore;

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

const DRAG_ACTIVE_LERP = 0.3;
const DRAG_INERTIA_LERP = 0.05;
const HijackedScrollbar = _ref => {
  let {
    children,
    disabled,
    onUpdate,
    speed = 1,
    // scroll speed
    lerp,
    // smoothness - default = 0.14
    restDelta,
    location,
    useUpdateLoop,
    // external loop for updating positions
    useRenderLoop,
    // external loop for rendering the new scroll position
    invalidate,
    // invalidate external update/render loop
    subpixelScrolling = false
  } = _ref;
  const setVirtualScrollbar = useCanvasStore$1(state => state.setVirtualScrollbar);
  const requestReflow = useCanvasStore$1(state => state.requestReflow);
  const pageReflowRequested = useCanvasStore$1(state => state.pageReflowRequested);
  const setScrollY = useCanvasStore$1(state => state.setScrollY);
  const [width, height] = useWindowSize();
  const ref = useRef();
  const y = useRef({
    current: 0,
    target: 0
  }).current;
  const roundedY = useRef(0);
  const scrolling = useRef(false);
  const preventPointer = useRef(false);
  const documentHeight = useRef(0);
  const delta = useRef(0);
  const lastFrame = useRef(0);
  const originalLerp = useMemo(() => lerp || config$1.scrollLerp, [lerp]); // reflow on webfont loaded to prevent misalignments

  useLayoutEffect(() => {
    if ('fonts' in document) {
      document.fonts.onloadingdone = requestReflow;
    }

    return () => {
      if ('fonts' in document) {
        document.fonts.onloadingdone = null;
      }
    };
  }, []);

  const setScrollPosition = () => {
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

  const animate = ts => {
    const frameDelta = ts - lastFrame.current;
    lastFrame.current = ts;
    if (!scrolling.current) return; // use internal target with floating point precision to make sure lerp is smooth

    const newTarget = _lerp(y.current, y.target, config$1.scrollLerp, frameDelta * 0.001);

    delta.current = Math.abs(y.current - newTarget);
    y.current = newTarget; // round for scrollbar

    roundedY.current = config$1.subpixelScrolling ? y.current : Math.floor(y.current);

    if (!useRenderLoop) {
      setScrollPosition();
    }
  };

  const scrollTo = useCallback(function (newY) {
    let lerp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : originalLerp;
    config$1.scrollLerp = lerp;
    y.target = Math.min(Math.max(newY, 0), documentHeight.current);

    if (!scrolling.current) {
      scrolling.current = true;
      invalidate ? invalidate() : window.requestAnimationFrame(animate);
      setTimeout(() => {
        preventPointerEvents(true);
        preventPointer.current = true;
      }, 0);
    }

    setScrollY(y.target);
  }, []); // disable pointer events while scrolling to avoid slow event handlers

  const preventPointerEvents = prevent => {
    if (ref.current) {
      ref.current.style.pointerEvents = prevent ? 'none' : '';
    }

    preventPointer.current = prevent;
  }; // reset pointer events when moving mouse


  const onMouseMove = useCallback(() => {
    if (preventPointer.current) {
      preventPointerEvents(false);
    }
  }, []); // override window.scrollTo(0, targetY) with our lerped version
  // Don't use useLayoutEffect as we want the native scrollTo to execute first and set the history position

  useEffect(() => {
    window.__origScrollTo = window.__origScrollTo || window.scrollTo;
    window.__origScroll = window.__origScroll || window.scroll;

    window.scrollTo = (x, y, lerp) => scrollTo(y, lerp);

    window.scroll = (x, y, lerp) => scrollTo(y, lerp);

    return () => {
      window.scrollTo = window.__origScrollTo;
      window.scroll = window.__origScroll;
    };
  }, [scrollTo]); // disable subpixelScrolling for better visual sync with canvas

  useLayoutEffect(() => {
    const ssBefore = config$1.subpixelScrolling;
    config$1.subpixelScrolling = subpixelScrolling;
    return () => {
      config$1.subpixelScrolling = ssBefore;
    };
  }, []); // Check if we are using an external update loop (like r3f)
  // update scroll target before everything else

  useEffect(() => {
    if (useUpdateLoop) {
      return useUpdateLoop(animate);
    }
  }, [useUpdateLoop]); // Check if we are using an external render loop (like r3f)
  // update scroll position last

  useEffect(() => {
    if (useRenderLoop) {
      return useRenderLoop(setScrollPosition);
    }
  }, [useRenderLoop]);
  /*
   * Called by each call to native window.scroll
   * Either as a scrollbar / key navigation event
   * Or as a result of the lerp animation
   */

  const onScrollEvent = e => {
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
    requestIdleCallback$1(() => {
      documentHeight.current = document.body.clientHeight - window.innerHeight;
    });
  }, [pageReflowRequested, width, height, location]);

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
    window.addEventListener('mousemove', onMouseMove);
    return () => {
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
  return /*#__PURE__*/React.createElement(React.Fragment, null, children({
    ref
  }));
};
HijackedScrollbar.propTypes = {
  disabled: PropTypes.bool,
  onUpdate: PropTypes.func,
  speed: PropTypes.number,
  lerp: PropTypes.number,
  restDelta: PropTypes.number,
  location: PropTypes.any,
  useUpdateLoop: PropTypes.func,
  useRenderLoop: PropTypes.func,
  invalidate: PropTypes.func,
  subpixelScrolling: PropTypes.bool
};

export { HijackedScrollbar, useScrollbar };
