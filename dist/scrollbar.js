import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useRef, useImperativeHandle, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { addEffect } from '@react-three/fiber';

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

const useCanvasStore = create(subscribeWithSelector(set => ({
  // //////////////////////////////////////////////////////////////////////////
  // GLOBAL ScrollRig STATE
  // //////////////////////////////////////////////////////////////////////////
  globalRenderQueue: false,
  clearGlobalRenderQueue: () => set(() => ({
    globalRenderQueue: false
  })),
  // true if WebGL initialized without errors
  isCanvasAvailable: true,
  setCanvasAvailable: isCanvasAvailable => set(() => ({
    isCanvasAvailable
  })),
  // true if <VirtualScrollbar> is currently enabled
  hasVirtualScrollbar: false,
  setVirtualScrollbar: hasVirtualScrollbar => set(() => ({
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
  updateCanvas: (key, newProps) => set(_ref2 => {
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
    config$1.debug && console.log('ScrollRig', 'reflow() requested');
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
  scrollTo: null,
  // (target) => window.scrollTo(0, target),
  setScrollTo: fn => {
    console.log('setScrollTo', fn);
    set(() => ({
      setScrollTo: fn
    }));
  }
})));

/**
 * Public interface for ScrollRig
 */

const useScrollbar = () => {
  const hasVirtualScrollbar = useCanvasStore(state => state.hasVirtualScrollbar);
  const scroll = useCanvasStore(state => state.scroll);
  const scrollTo = useCanvasStore(state => state.scrollTo);
  return {
    enabled: hasVirtualScrollbar,
    scroll,
    scrollTo
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
  const lenisImpl = useRef();
  useImperativeHandle(ref, () => ({
    start: () => {
      var _lenisImpl$current;

      return (_lenisImpl$current = lenisImpl.current) === null || _lenisImpl$current === void 0 ? void 0 : _lenisImpl$current.start();
    },
    stop: () => {
      var _lenisImpl$current2;

      return (_lenisImpl$current2 = lenisImpl.current) === null || _lenisImpl$current2 === void 0 ? void 0 : _lenisImpl$current2.stop();
    },
    onScroll: cb => {
      var _lenisImpl$current3;

      return (_lenisImpl$current3 = lenisImpl.current) === null || _lenisImpl$current3 === void 0 ? void 0 : _lenisImpl$current3.on('scroll', cb);
    },
    scrollTo: (target, props) => {
      var _lenisImpl$current4;

      return (_lenisImpl$current4 = lenisImpl.current) === null || _lenisImpl$current4 === void 0 ? void 0 : _lenisImpl$current4.scrollTo(target, props);
    }
  }));
  useEffect(() => {
    const lenis = lenisImpl.current = new Lenis({
      duration,
      easing,
      smooth,
      direction,
      ...config
    }); // let r3f drive the frameloop

    const removeEffect = addEffect(time => lenis.raf(time)); // cleanup on unmount

    return () => {
      removeEffect();
      lenis.destroy();
    };
  }, [smooth]);
  return children && children(props);
}

export { LenisScrollbar, useScrollbar };
