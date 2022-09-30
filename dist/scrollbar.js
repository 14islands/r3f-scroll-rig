import create from 'zustand';
import { useRef, useImperativeHandle, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

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

export { LenisScrollbar, useScrollbar };
