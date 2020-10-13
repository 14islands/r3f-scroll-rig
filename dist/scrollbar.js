import _extends from '@babel/runtime/helpers/esm/extends';
import _objectWithoutPropertiesLoose from '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose';
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import create from 'zustand';

// Transient shared state for canvas components
// usContext() causes re-rendering which can drop frames
const config = {
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

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const [useCanvasStore, canvasStoreApi] = create(set => ({
  // //////////////////////////////////////////////////////////////////////////
  // GLOBAL ScrollRig STATE
  // //////////////////////////////////////////////////////////////////////////
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
  // global render loop is suspended internally (NOT USED)
  suspended: false,
  setSuspended: suspended => set(state => ({
    suspended
  })),
  // global render loop is paused by user action
  paused: false,
  setPaused: paused => set(state => ({
    paused
  })),
  // map of all components to render on the global canvas
  canvasChildren: {},
  // add component to canvas
  renderToCanvas: (key, mesh, props = {}) => set(({
    canvasChildren
  }) => {
    const obj = _extends({}, canvasChildren, {
      [key]: {
        mesh,
        props
      }
    });

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

    const obj = _extends({}, canvasChildren, {
      [key]: {
        mesh,
        props: _extends({}, props, newProps)
      }
    });

    return {
      canvasChildren: obj
    };
  }),
  // remove component from canvas
  removeFromCanvas: key => set(({
    canvasChildren
  }) => {
    const obj = _objectWithoutPropertiesLoose(canvasChildren, [key].map(_toPropertyKey)); // make a separate copy of the obj and omit


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
  pageReflow: 0,
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
        pageReflow: state.pageReflow + 1
      };
    });
  },
  triggerReflowCompleted: () => {
    set(state => ({
      pageReflowCompleted: state.pageReflowCompleted + 1
    }));
  }
}));

const DEFAULT_LERP = 0.1;

function _lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

const FakeScroller = ({
  el,
  lerp = DEFAULT_LERP,
  restDelta = 1,
  scrollY = null
}) => {
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const triggerReflowCompleted = useCanvasStore(state => state.triggerReflowCompleted);
  const heightEl = useRef();
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
      scrollHeight: 0,
      threshold: 100
    },
    isResizing: false,
    sectionEls: null,
    sections: null
  }).current; // ANIMATION LOOP

  const run = () => {
    state.frame = window.requestAnimationFrame(run);
    const {
      scroll
    } = state;
    scroll.current = _lerp(scroll.current, scroll.target, scroll.lerp);
    const delta = scroll.current - scroll.target;
    scroll.velocity = Math.abs(delta);
    scroll.direction = Math.sign(delta);
    transformSections(); // stop animation if delta is low

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
    const translate = "translate3d(0, " + -scroll.current + "px, 0)";
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
      height,
      threshold
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
    state.scroll.target = scrollY ? val : window.pageYOffset; // restart animation loop if needed

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
    if (scrollY) {
      return scrollY.onChange(onScroll);
    } else {
      window.addEventListener('scroll', onScroll);
      return () => window.removeEventListener('scroll', onScroll);
    }
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

    setFakeHeight(bounds.scrollHeight + "px");
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
  }, [pageReflow]);
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
const VirtualScrollbar = (_ref) => {
  let {
    disabled,
    children
  } = _ref,
      rest = _objectWithoutPropertiesLoose(_ref, ["disabled", "children"]);

  const ref = useRef();
  const [active, setActive] = useState(false); // FakeScroller wont trigger resize without this here.. whyyyy?
  // eslint-disable-next-line no-unused-vars

  const pageReflow = useCanvasStore(state => state.pageReflow);
  const setVirtualScrollbar = useCanvasStore(state => state.setVirtualScrollbar); // NOT SURE THIS IS NEEDED ANY LONGER
  // Make sure we are scrolled to top before measuring stuff
  // `gatsby-plugin-transition-link` scrolls back to top in a `setTimeout()` which makes it delayed

  useLayoutEffect(() => {
    // __tl_back_button_pressed is set by `gatsby-plugin-transition-link`
    if (!window.__tl_back_button_pressed) {
      // make sure we start at top if scrollbar is active (transition)
      !disabled && window.scrollTo(0, 0);
    }
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('js-has-virtual-scrollbar', !disabled);
    setVirtualScrollbar(!disabled); // allow webgl components to find positions first on page load

    const timer = setTimeout(() => {
      setActive(!disabled); // tell GlobalCanvas that VirtualScrollbar is active

      config.hasVirtualScrollbar = !disabled;
    }, 0);
    return () => clearTimeout(timer);
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
  }, rest)));
};

export { VirtualScrollbar };
