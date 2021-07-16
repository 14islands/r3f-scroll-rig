import create from 'zustand';
import _extends from '@babel/runtime/helpers/esm/extends';
import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import _lerp from '@14islands/lerp';
import { useWindowSize } from '@react-hook/window-size';

/**
 * runtime check for requestIdleCallback
 */
const requestIdleCallback = (callback, {
  timeout = 100
} = {}) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, {
      timeout
    });
  } else {
    setTimeout(callback, 0);
  }
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
  hasVirtualScrollbar: false,
  hasGlobalCanvas: false,
  disableAutoClear: true,
  clearDepth: true
};

const useCanvasStore = create(set => ({
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
  renderToCanvas: (key, mesh, props = {}) => set(({
    canvasChildren
  }) => {
    const obj = { ...canvasChildren,
      [key]: {
        mesh,
        props
      }
    };
    return {
      canvasChildren: obj
    };
  }),
  // pass new props to a canvas component
  updateCanvas: (key, newProps) => set(({
    canvasChildren
  }) => {
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
  removeFromCanvas: key => set(({
    canvasChildren
  }) => {
    const {
      [key]: omit,
      ...obj
    } = canvasChildren; // make a separate copy of the obj and omit

    return {
      canvasChildren: obj
    };
  }),
  // current pixel ratio
  pixelRatio: 1,
  setPixelRatio: pixelRatio => set(state => ({
    pixelRatio
  })),
  // Used to ask components to re-calculate their positions after a layout reflow
  pageReflowRequested: 0,
  pageReflowCompleted: 0,
  requestReflow: () => {
    set(state => {
      // if VirtualScrollbar is active, it triggers `triggerReflowCompleted` instead
      if (!config.hasVirtualScrollbar) {
        requestIdleCallback(state.triggerReflowCompleted, {
          timeout: 100
        });
      }

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
}));

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

/**
 * Manages Scroll rig resize events by trigger a reflow instead of individual resize listeners in each component
 * The order is carefully scripted:
 *  1. reflow() will cause VirtualScrollbar to recalculate positions
 *  2. VirtualScrollbar triggers `pageReflowCompleted`
 *  3. Canvas scroll components listen to  `pageReflowCompleted` and recalc positions
 */

const ResizeManager = ({
  reflow,
  resizeOnHeight = true,
  resizeOnWebFontLoaded = true
}) => {
  const mounted = useRef(false); // must be debounced more than the GlobalCanvas so all components have the correct value from useThree({ size })

  const [windowWidth, windowHeight] = useWindowSize({
    wait: 300
  }); // The reason for not resizing on height on "mobile" is because the height changes when the URL bar disapears in the browser chrome
  // Can we base this on something better - or is there another way to avoid?

  const height = resizeOnHeight ? windowHeight : null; // Detect only resize events

  useEffect(() => {
    if (mounted.current) {
      reflow();
    } else {
      mounted.current = true;
    }
  }, [windowWidth, height]); // reflow on webfont loaded to prevent misalignments

  useEffect(() => {
    if (!resizeOnWebFontLoaded) return;
    let fallbackTimer;

    if ('fonts' in document) {
      document.fonts.onloadingdone = reflow;
    } else {
      fallbackTimer = setTimeout(reflow, 1000);
    }

    return () => {
      if ('fonts' in document) {
        document.fonts.onloadingdone = null;
      } else {
        clearTimeout(fallbackTimer);
      }
    };
  }, []);
  return null;
};

const FakeScroller = ({
  el,
  lerp = config.scrollLerp,
  restDelta = config.scrollRestDelta,
  onUpdate,
  threshold = 100
}) => {
  const pageReflowRequested = useCanvasStore(state => state.pageReflowRequested);
  const triggerReflowCompleted = useCanvasStore(state => state.triggerReflowCompleted);
  const setScrollY = useCanvasStore(state => state.setScrollY);
  const heightEl = useRef();
  const lastFrame = useRef(0);
  const [fakeHeight, setFakeHeight] = useState();
  const state = useRef({
    preventPointer: false,
    total: 0,
    scroll: {
      target: 0,
      current: 0,
      lerp,
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

  const run = ts => {
    const frameDelta = ts - lastFrame.current;
    lastFrame.current = ts;
    state.frame = window.requestAnimationFrame(run);
    const {
      scroll
    } = state;
    scroll.current = _lerp(scroll.current, scroll.target, scroll.lerp, frameDelta);
    const delta = scroll.current - scroll.target;
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

  const transformSections = () => {
    const {
      total,
      isResizing,
      scroll,
      sections
    } = state;
    const translate = `translate3d(0, ${-scroll.current}px, 0)`;
    if (!sections) return;

    for (let i = 0; i < total; i++) {
      const data = sections[i];
      const {
        el,
        bounds
      } = data;

      if (isVisible(bounds) || isResizing) {
        Object.assign(data, {
          out: false
        });
        el.style.transform = translate;
      } else if (!data.out) {
        Object.assign(data, {
          out: true
        });
        el.style.transform = translate;
      }
    }
  };

  const isVisible = bounds => {
    const {
      height
    } = state.bounds;
    const {
      current
    } = state.scroll;
    const {
      top,
      bottom
    } = bounds;
    const start = top - current;
    const end = bottom - current;
    const isVisible = start < threshold + height && end > -threshold;
    return isVisible;
  };

  const getSections = () => {
    if (!state.sectionEls) return;
    state.sections = [];
    state.sectionEls.forEach(el => {
      el.style.transform = 'translate3d(0, 0, 0)'; // FF complains that we exceed the budget for willChange and will ignore the rest
      // Testing to remove this to see if it speeds up other things
      // el.style.willChange = 'transform'

      const {
        top,
        bottom
      } = el.getBoundingClientRect();
      state.sections.push({
        el,
        bounds: {
          top,
          bottom
        },
        out: true
      });
    });
  }; // disable pointer events while scrolling to avoid slow event handlers


  const preventPointerEvents = prevent => {
    if (el.current) {
      el.current.style.pointerEvents = prevent ? 'none' : '';
    }

    state.preventPointer = prevent;
  };

  const onScroll = val => {
    // check if use with scroll wrapper or native scroll event
    state.scroll.target = window.pageYOffset;
    setScrollY(state.scroll.target); // restart animation loop if needed

    if (!state.frame && !state.isResizing) {
      state.frame = window.requestAnimationFrame(run);
    }

    if (!state.preventPointer && state.scroll.velocity > 100) {
      setTimeout(() => {
        // el.current && el.current.classList.add('is-scrolling')
        state.preventPointer = true;
        preventPointerEvents(true);
      }, 0);
    }
  }; // reset pointer events when moving mouse


  const onMouseMove = () => {
    if (state.preventPointer) {
      preventPointerEvents(false);
    }
  }; // Bind mouse event


  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []); // Bind scroll event

  useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (el.current) {
      state.sectionEls = Array.from(el.current.children);
      state.total = state.sectionEls.length;
      getSections();
    } // reset on umount


    return () => {
      const {
        sections
      } = state;

      if (sections) {
        sections.forEach(({
          el,
          bounds
        }) => {
          el.style.transform = '';
        });
        state.sections = null;
      }
    };
  }, [el.current]); // RESIZE calculate fake height and move elemnts into place

  const handleResize = () => {
    const {
      total,
      bounds,
      sections,
      scroll
    } = state;
    state.isResizing = true;
    bounds.height = window.innerHeight; // move els back into place and measure their offset

    if (sections) {
      sections.forEach(({
        el,
        bounds
      }) => {
        el.style.transform = 'translate3d(0, 0, 0)';
        const {
          top,
          bottom
        } = el.getBoundingClientRect();
        bounds.top = top;
        bounds.bottom = bottom;
      });
    } // set viewport height and fake document height


    const {
      bottom
    } = state.sectionEls[total - 1].getBoundingClientRect();
    bounds.scrollHeight = bottom; // update fake height

    setFakeHeight(`${bounds.scrollHeight}px`);
    setTimeout(() => {
      // get new scroll position (changes if window height became smaller)
      scroll.current = window.pageYOffset; // move all items into place

      transformSections(); // notify canvas components to refresh positions

      triggerReflowCompleted();
      state.isResizing = false;
    }, 0);
  };

  useEffect(() => {
    handleResize();
  }, [pageReflowRequested]);
  return /*#__PURE__*/React.createElement("div", {
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
const VirtualScrollbar = ({
  disabled,
  resizeOnHeight,
  children,
  scrollToTop = false,
  ...rest
}) => {
  const ref = useRef();
  const [active, setActive] = useState(false); // FakeScroller wont trigger resize without touching the store here..
  // due to code splitting maybe? two instances of the store?

  const requestReflow = useCanvasStore(state => state.requestReflow);
  const setVirtualScrollbar = useCanvasStore(state => state.setVirtualScrollbar); // Optional: scroll to top when scrollbar mounts

  useLayoutEffect(() => {
    if (!scrollToTop) return; // __tl_back_button_pressed is set by `gatsby-plugin-transition-link`

    if (!window.__tl_back_button_pressed) {
      // make sure we start at top if scrollbar is active (transition)
      !disabled && window.scrollTo(0, 0);
    }
  }, [scrollToTop, disabled]);
  useEffect(() => {
    document.documentElement.classList.toggle('js-has-virtual-scrollbar', !disabled);
    setVirtualScrollbar(!disabled); // allow webgl components to find positions first on page load

    const timer = setTimeout(() => {
      setActive(!disabled); // tell GlobalCanvas that VirtualScrollbar is active

      config.hasVirtualScrollbar = !disabled;
    }, 0);
    return () => {
      clearTimeout(timer);
      config.hasVirtualScrollbar = false;
    };
  }, [disabled]);
  const activeStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%' // overflow: 'hidden',  // prevents tabbing to links in Chrome

  };
  const style = active ? activeStyle : {};
  return /*#__PURE__*/React.createElement(React.Fragment, null, children({
    ref,
    style
  }), active && /*#__PURE__*/React.createElement(FakeScroller, _extends({
    el: ref
  }, rest)), /*#__PURE__*/React.createElement(ResizeManager, {
    reflow: requestReflow,
    resizeOnHeight: resizeOnHeight
  }));
};

// if r3f frameloop should be used, pass these props:
// const R3F_HijackedScrollbar = props => {
//   return <HijackedScrollbar {...props} useUpdateLoop={addEffect} useRenderLoop={addEffect}  invalidate={invalidate} />
// }

function map_range(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

const DRAG_ACTIVE_LERP = 0.3;
const DRAG_INERTIA_LERP = 0.05;
const HijackedScrollbar = ({
  children,
  disabled,
  onUpdate,
  speed = 1,
  lerp,
  restDelta,
  location,
  useUpdateLoop,
  // external loop for updating positions
  useRenderLoop,
  // external loop for rendering the new scroll position
  invalidate,
  // invalidate external update/render loop
  subpixelScrolling = false
}) => {
  const setVirtualScrollbar = useCanvasStore(state => state.setVirtualScrollbar);
  const requestReflow = useCanvasStore(state => state.requestReflow);
  const pageReflowRequested = useCanvasStore(state => state.pageReflowRequested);
  const setScrollY = useCanvasStore(state => state.setScrollY);
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
  const originalLerp = useRef(lerp || config.scrollLerp).current;

  const setScrollPosition = () => {
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

  const animate = ts => {
    const frameDelta = ts - lastFrame.current;
    lastFrame.current = ts;
    if (!scrolling.current) return; // use internal target with floating point precision to make sure lerp is smooth

    const newTarget = _lerp(y.current, y.target, config.scrollLerp, frameDelta);

    delta.current = Math.abs(y.current - newTarget);
    y.current = newTarget; // round for scrollbar

    roundedY.current = config.subpixelScrolling ? y.current : Math.floor(y.current);

    if (!useRenderLoop) {
      setScrollPosition();
    }
  };

  const scrollTo = (newY, lerp = originalLerp) => {
    config.scrollLerp = lerp;
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
  }; // disable pointer events while scrolling to avoid slow event handlers


  const preventPointerEvents = prevent => {
    if (ref.current) {
      ref.current.style.pointerEvents = prevent ? 'none' : '';
    }

    preventPointer.current = prevent;
  }; // reset pointer events when moving mouse


  const onMouseMove = () => {
    if (preventPointer.current) {
      preventPointerEvents(false);
    }
  }; // Bind mouse event


  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []); // override window.scrollTo(0, targetY)

  useEffect(() => {
    window.__origScrollTo = window.scrollTo;
    window.__origScroll = window.scroll;

    window.scrollTo = (x, y, lerp) => scrollTo(y, lerp);

    window.scroll = (x, y, lerp) => scrollTo(y, lerp);

    return () => {
      window.scrollTo = window.__origScrollTo;
      window.scroll = window.__origScroll;
    };
  }, [pageReflowRequested, location]); // disable subpixelScrolling for better visual sync with canvas

  useEffect(() => {
    const ssBefore = config.subpixelScrolling;
    config.subpixelScrolling = subpixelScrolling;
    return () => {
      config.subpixelScrolling = ssBefore;
    };
  }, []); // reset scroll on mount/unmount FIX history?!

  useEffect(() => {
    setScrollY(window.pageYOffset);
    return () => {
      setScrollY(window.pageYOffset);
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

  const onScrollEvent = e => {
    e.preventDefault(); // Scroll manually using keys or drag scrollbars

    if (!scrolling.current) {
      y.current = window.scrollY;
      y.target = window.scrollY; // set lerp to 1 temporarily so stuff moves immediately
      // if (!config._scrollLerp) {
      //   config._scrollLerp = config.scrollLerp
      // }
      // config.scrollLerp = 1

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
    requestIdleCallback(() => {
      documentHeight.current = document.body.clientHeight - window.innerHeight;
    });
  }, [pageReflowRequested, location]);

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
    return () => {
      window.removeEventListener('wheel', onWheelEvent, {
        passive: false
      });
      window.removeEventListener('scroll', onScrollEvent);
      window.removeEventListener('touchstart', onTouchStart, {
        passive: false
      });
    };
  }, [disabled]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, children({
    ref
  }), /*#__PURE__*/React.createElement(ResizeManager, {
    reflow: requestReflow
  }));
};

export { HijackedScrollbar, VirtualScrollbar, useScrollbar };
