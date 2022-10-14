import { useThree, invalidate, useFrame, Canvas, createPortal, useLoader, addEffect } from '@react-three/fiber';
import { ResizeObserver } from '@juggle/resize-observer';
import { parse } from 'query-string';
import React, { useLayoutEffect as useLayoutEffect$1, useEffect, forwardRef, useMemo, useRef, Fragment as Fragment$1, cloneElement, useState, useCallback, useImperativeHandle } from 'react';
import create from 'zustand';
import mergeRefs from 'react-merge-refs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { Vector2, Color, Scene, MathUtils, DefaultLoadingManager, TextureLoader, ImageBitmapLoader, Texture, CanvasTexture } from 'three';
import { useInView } from 'react-intersection-observer';
import { useWindowSize } from 'react-use';
import { vec3 } from 'vecn';
import { suspend } from 'suspend-react';
import supportsWebP from 'supports-webp';
import equal from 'fast-deep-equal';
import Lenis from '@studio-freight/lenis';

const isBrowser = typeof window !== 'undefined';
const useLayoutEffect = isBrowser ? useLayoutEffect$1 : useEffect;

// Global config
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
          // or tell it that it is "inactive"
          canvasChildren[key].instances = 0;
          canvasChildren[key].props.inactive = true;
          return {
            canvasChildren: { ...canvasChildren
            }
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

/**
 * Trigger reflow when WebFonts loaded
 */

const ResizeManager = () => {
  const requestReflow = useCanvasStore(state => state.requestReflow); // reflow on webfont loaded to prevent misalignments

  useEffect(() => {
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        requestIdleCallback$1(requestReflow);
      });
    }
  }, []);
  return null;
};

var ResizeManager$1 = ResizeManager;

const PerspectiveCamera = /*#__PURE__*/forwardRef((_ref, ref) => {
  let {
    makeDefault = false,
    ...props
  } = _ref;
  const set = useThree(state => state.set);
  const camera = useThree(state => state.camera);
  const size = useThree(state => state.size);
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const scaleMultiplier = useCanvasStore(state => state.scaleMultiplier);
  const distance = useMemo(() => {
    const width = size.width * scaleMultiplier;
    const height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, pageReflow, scaleMultiplier]);
  const cameraRef = useRef();
  useLayoutEffect(() => {
    const width = size.width * scaleMultiplier;
    const height = size.height * scaleMultiplier; // const radToDeg = (radians) => radians * (180 / Math.PI)
    // const degToRad = (degrees) => degrees * (Math.PI / 180)

    cameraRef.current.aspect = width / height;
    cameraRef.current.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * cameraRef.current.position.z)); // cameraRef.current.fov = props.fov
    // const vFOV = props.fov * (Math.PI / 180)
    // const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * cameraRef.current.aspect)
    // cameraRef.current.position.z = cameraRef.current.getFilmHeight() / cameraRef.current.getFocalLength()
    // cameraRef.current.position.z = Math.tan(((hFOV / 2.0) * Math.PI) / 180.0) * 2.0

    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
    // Update matrix world since the renderer is a frame late

    cameraRef.current.updateMatrixWorld();
  }, [distance, size, scaleMultiplier]);
  useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera;
      set({
        camera: cameraRef.current
      });
      return () => set({
        camera: oldCam
      });
    }
  }, [camera, cameraRef, makeDefault, set]);
  return /*#__PURE__*/jsx("perspectiveCamera", {
    ref: mergeRefs([cameraRef, ref]),
    position: [0, 0, distance],
    onUpdate: self => self.updateProjectionMatrix(),
    near: 0.1,
    far: distance * 2,
    ...props
  });
});
PerspectiveCamera.displayName = 'PerspectiveCamera';
var PerspectiveCamera$1 = PerspectiveCamera;

const OrthographicCamera = /*#__PURE__*/forwardRef((_ref, ref) => {
  let {
    makeDefault = false,
    ...props
  } = _ref;
  const set = useThree(state => state.set);
  const camera = useThree(state => state.camera);
  const size = useThree(state => state.size);
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const scaleMultiplier = useCanvasStore(state => state.scaleMultiplier);
  const distance = useMemo(() => {
    const width = size.width * scaleMultiplier;
    const height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, pageReflow, scaleMultiplier]);
  const cameraRef = useRef();
  useLayoutEffect(() => {
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
    // Update matrix world since the renderer is a frame late

    cameraRef.current.updateMatrixWorld();
  }, [distance, size]);
  useLayoutEffect(() => {
    if (makeDefault && cameraRef.current) {
      const oldCam = camera;
      set({
        camera: cameraRef.current
      });
      return () => set({
        camera: oldCam
      });
    }
  }, [camera, cameraRef, makeDefault, set]);
  return /*#__PURE__*/jsx("orthographicCamera", {
    left: size.width * scaleMultiplier / -2,
    right: size.width * scaleMultiplier / 2,
    top: size.height * scaleMultiplier / 2,
    bottom: size.height * scaleMultiplier / -2,
    far: distance * 2,
    position: [0, 0, distance],
    near: 0.001,
    ref: mergeRefs([cameraRef, ref]),
    onUpdate: self => self.updateProjectionMatrix(),
    ...props
  });
});
OrthographicCamera.displayName = 'OrthographicCamera';
var OrthographicCamera$1 = OrthographicCamera;

// Use to override Frustum temporarily to pre-upload textures to GPU
function setAllCulled(obj, overrideCulled) {
  if (!obj) return;

  if (overrideCulled === false) {
    obj.wasFrustumCulled = obj.frustumCulled;
    obj.wasVisible = obj.visible;
    obj.visible = true;
    obj.frustumCulled = false;
  } else {
    obj.visible = obj.wasVisible;
    obj.frustumCulled = obj.wasFrustumCulled;
  }

  obj.children.forEach(child => setAllCulled(child, overrideCulled));
}

const viewportSize = new Vector2(); // Flag that we need global rendering (full screen)

const requestRender = function () {
  let layers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [0];
  useCanvasStore.getState().globalRenderQueue = useCanvasStore.getState().globalRenderQueue || [0];
  useCanvasStore.getState().globalRenderQueue = [...useCanvasStore.getState().globalRenderQueue, ...layers];
};
const renderScissor = _ref => {
  let {
    gl,
    scene,
    camera,
    left,
    top,
    width,
    height,
    layer = 0,
    autoClear = false,
    clearDepth = true
  } = _ref;
  if (!scene || !camera) return;
  const _autoClear = gl.autoClear;
  gl.autoClear = autoClear;
  gl.setScissor(left, top, width, height);
  gl.setScissorTest(true);
  camera.layers.set(layer);
  clearDepth && gl.clearDepth();
  gl.render(scene, camera);
  gl.setScissorTest(false);
  gl.autoClear = _autoClear;
};
const renderViewport = _ref2 => {
  let {
    gl,
    scene,
    camera,
    left,
    top,
    width,
    height,
    layer = 0,
    scissor = true,
    autoClear = false,
    clearDepth = true
  } = _ref2;
  if (!scene || !camera) return;
  const _autoClear = gl.autoClear;
  gl.getSize(viewportSize);
  gl.autoClear = autoClear;
  gl.setViewport(left, top, width, height);
  gl.setScissor(left, top, width, height);
  gl.setScissorTest(scissor);
  camera.layers.set(layer);
  clearDepth && gl.clearDepth();
  gl.render(scene, camera);
  gl.setScissorTest(false);
  gl.setViewport(0, 0, viewportSize.x, viewportSize.y);
  gl.autoClear = _autoClear;
};
const preloadScene = function (scene, camera) {
  let layer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  let callback = arguments.length > 3 ? arguments[3] : undefined;
  if (!scene || !camera) return;
  config$1.preloadQueue.push(gl => {
    gl.setScissorTest(false);
    setAllCulled(scene, false);
    camera.layers.set(layer);
    gl.render(scene, camera);
    setAllCulled(scene, true);
    callback && callback();
  }); // auto trigger a new frame for the preload

  invalidate();
};

/**
 * Public interface for ScrollRig
 */
const useScrollRig = () => {
  const isCanvasAvailable = useCanvasStore(state => state.isCanvasAvailable);
  const hasSmoothScrollbar = useCanvasStore(state => state.hasSmoothScrollbar);
  const requestReflow = useCanvasStore(state => state.requestReflow);
  const debug = useCanvasStore(state => state.debug);
  const scaleMultiplier = useCanvasStore(state => state.scaleMultiplier);
  useEffect(() => {
    if (debug) {
      // @ts-ignore
      window._scrollRig = window._scrollRig || {}; // @ts-ignore

      window._scrollRig.reflow = requestReflow;
    }
  }, []);
  return {
    // boolean state
    debug,
    isCanvasAvailable,
    hasSmoothScrollbar,
    // scale
    scaleMultiplier,
    // render API
    preloadScene,
    requestRender,
    renderScissor,
    renderViewport,
    // recalc all tracker positions
    reflow: requestReflow
  };
};

const GlobalChildren = _ref => {
  let {
    children
  } = _ref;
  const canvasChildren = useCanvasStore(state => state.canvasChildren);
  const scrollRig = useScrollRig();
  useEffect(() => {
    // render empty canvas automatically if all children were removed
    if (!Object.keys(canvasChildren).length) {
      scrollRig.debug && console.log('GlobalRenderer', 'auto render empty canvas');
      scrollRig.requestRender();
      invalidate();
    }
  }, [canvasChildren]);
  scrollRig.debug && console.log('GlobalChildren', Object.keys(canvasChildren).length);
  return /*#__PURE__*/jsxs(Fragment, {
    children: [children, Object.keys(canvasChildren).map(key => {
      const {
        mesh,
        props
      } = canvasChildren[key];

      if (typeof mesh === 'function') {
        return /*#__PURE__*/jsx(Fragment$1, {
          children: mesh({
            key,
            ...scrollRig,
            ...props
          })
        }, key);
      }

      return /*#__PURE__*/cloneElement(mesh, {
        key,
        ...props
      });
    })]
  });
};

var GlobalChildren$1 = GlobalChildren;

/**
 * Global render loop to avoid double renders on the same frame
 */

const GlobalRenderer = () => {
  const gl = useThree(s => s.gl);
  const frameloop = useThree(s => s.frameloop);
  const globalClearDepth = useCanvasStore(state => state.globalClearDepth);
  const globalAutoClear = useCanvasStore(state => state.globalAutoClear);
  const globalPriority = useCanvasStore(state => state.globalPriority);
  const scrollRig = useScrollRig(); // https://threejs.org/docs/#api/en/renderers/WebGLRenderer.debug

  useLayoutEffect(() => {
    gl.debug.checkShaderErrors = scrollRig.debug;
  }, [scrollRig.debug]); // PRELOAD RENDER LOOP

  useFrame(() => {
    if (!config$1.preloadQueue.length) return;
    gl.autoClear = false; // Render preload frames first and clear directly
    // @ts-ignore

    config$1.preloadQueue.forEach(render => render(gl)); // cleanup

    gl.clear();
    config$1.preloadQueue = [];
    gl.autoClear = true; // trigger new frame to get correct visual state after all preloads

    scrollRig.debug && console.log('GlobalRenderer', 'preload complete. trigger global render');
    scrollRig.requestRender();
    invalidate();
  }, config$1.PRIORITY_PRELOAD); // GLOBAL RENDER LOOP

  useFrame(_ref => {
    let {
      camera,
      scene
    } = _ref;
    const globalRenderQueue = useCanvasStore.getState().globalRenderQueue; // Render if requested or if always on

    if (frameloop === 'always' || globalRenderQueue) {
      gl.autoClear = globalAutoClear; // false will fail in Oculus Quest VR
      // render default layer, scene, camera

      camera.layers.disableAll();

      if (globalRenderQueue) {
        // @ts-ignore
        globalRenderQueue.forEach(layer => {
          camera.layers.enable(layer);
        });
      } else {
        camera.layers.enable(0);
      } // render as HUD over any other renders by default


      globalClearDepth && gl.clearDepth();
      gl.render(scene, camera);
      gl.autoClear = true;
    } // cleanup for next frame


    useCanvasStore.getState().clearGlobalRenderQueue();
  }, globalPriority); // Take over rendering

  return null;
};

var GlobalRenderer$1 = GlobalRenderer;

// @ts-nocheck

class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: false
    };
    this.props = props;
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return {
      error
    };
  } // componentDidCatch(error, errorInfo) {
  //   // You can also log the error to an error reporting service
  //   // logErrorToMyService(error, errorInfo)
  // }


  render() {
    if (this.state.error) {
      this.props.onError && this.props.onError(this.state.error);
      return null;
    }

    return this.props.children;
  }

}

var CanvasErrorBoundary$1 = CanvasErrorBoundary;

const GlobalCanvas = _ref => {
  let {
    as = Canvas,
    children,
    gl,
    style,
    orthographic,
    camera,
    debug,
    scaleMultiplier = config$1.DEFAULT_SCALE_MULTIPLIER,
    globalRender = true,
    globalPriority = config$1.PRIORITY_GLOBAL,
    globalAutoClear = false,
    // don't clear viewports
    globalClearDepth = true,
    ...props
  } = _ref;
  const globalRenderState = useCanvasStore(state => state.globalRender); // enable debug mode

  useLayoutEffect(() => {
    // Querystring overrides
    const qs = parse(window.location.search); // show debug statements

    if (debug || typeof qs.debug !== 'undefined') {
      useCanvasStore.setState({
        debug: true
      });
    }
  }, [debug]); // update state

  useLayoutEffect(() => {
    useCanvasStore.setState({
      scaleMultiplier,
      globalRender,
      globalPriority,
      globalAutoClear,
      globalClearDepth
    });
  }, [scaleMultiplier, globalPriority, globalRender, globalAutoClear, globalClearDepth]);
  const CanvasElement = as;
  return /*#__PURE__*/jsxs(CanvasElement, {
    id: "ScrollRig-canvas" // use our own default camera
    ,
    camera: null // Some sane defaults
    ,
    gl: {
      // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
      failIfMajorPerformanceCaveat: true,
      // skip webgl if slow device
      ...gl
    } // polyfill old iOS safari
    ,
    resize: {
      scroll: false,
      debounce: 0,
      polyfill: ResizeObserver
    } // default styles
    ,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '100vh',
      // use 100vh to avoid resize on iOS when url bar goes away
      ...style
    } // allow to override anything of the above
    ,
    ...props,
    children: [typeof children === 'function' ? children( /*#__PURE__*/jsx(GlobalChildren$1, {})) : /*#__PURE__*/jsx(GlobalChildren$1, {
      children: children
    }), globalRenderState && /*#__PURE__*/jsx(GlobalRenderer$1, {}), !orthographic && /*#__PURE__*/jsx(PerspectiveCamera$1, {
      makeDefault: true,
      ...camera
    }), orthographic && /*#__PURE__*/jsx(OrthographicCamera$1, {
      makeDefault: true,
      ...camera
    }), /*#__PURE__*/jsx(ResizeManager$1, {})]
  });
};

const GlobalCanvasIfSupported = _ref2 => {
  let {
    children,
    onError,
    ...props
  } = _ref2;
  useLayoutEffect(() => {
    document.documentElement.classList.add('js-has-global-canvas');
  }, []);
  return (
    /*#__PURE__*/
    // @ts-ignore
    jsxs(CanvasErrorBoundary$1, {
      onError: err => {
        onError && onError(err);
        useCanvasStore.setState({
          isCanvasAvailable: false
        });
        /* WebGL failed to init */

        document.documentElement.classList.remove('js-has-global-canvas');
        document.documentElement.classList.add('js-global-canvas-error');
      },
      children: [/*#__PURE__*/jsx(GlobalCanvas, { ...props,
        children: children
      }), /*#__PURE__*/jsx("noscript", {
        children: /*#__PURE__*/jsx("style", {
          children: `
          .ScrollRig-visibilityHidden,
          .ScrollRig-transparentColor {
            visibility: unset;
            color: unset;
          }
          `
        })
      })]
    })
  );
};

var GlobalCanvasIfSupported$1 = GlobalCanvasIfSupported;

const DebugMesh = _ref => {
  let {
    scale
  } = _ref;
  return /*#__PURE__*/jsxs("mesh", {
    scale: scale,
    children: [/*#__PURE__*/jsx("planeGeometry", {}), /*#__PURE__*/jsx("shaderMaterial", {
      args: [{
        uniforms: {
          color: {
            value: new Color('hotpink')
          }
        },
        vertexShader: `
            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
        fragmentShader: `
            uniform vec3 color;
            uniform float opacity;
            void main() {
              gl_FragColor.rgba = vec4(color, .5);
            }
          `
      }],
      transparent: true
    })]
  });
};
var DebugMesh$1 = DebugMesh;

// Linear mapping from range <a1, a2> to range <b1, b2>
function mapLinear(x, a1, a2, b1, b2) {
  return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
}

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

function useTracker(track, options) {
  const size = useWindowSize();
  const {
    scroll,
    onScroll
  } = useScrollbar();
  const scaleMultiplier = useCanvasStore(state => state.scaleMultiplier);
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const {
    rootMargin,
    threshold,
    autoUpdate
  } = { ...defaultArgs,
    ...options
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
  }, [track, size, pageReflow, scaleMultiplier]);
  const update = useCallback(function () {
    let {
      onlyUpdateInViewport = true
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!track.current || onlyUpdateInViewport && !scrollState.inViewport) {
      return;
    }

    updateBounds(bounds, rect, scroll, size);
    updatePosition(position, bounds, scaleMultiplier); // scrollState setup based on scroll direction

    const isHorizontal = scroll.direction === 'horizontal';
    const sizeProp = isHorizontal ? 'width' : 'height';
    const startProp = isHorizontal ? 'left' : 'top'; // calculate progress of passing through viewport (0 = just entered, 1 = just exited)

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

let ScrollScene = _ref => {
  let {
    track,
    children,
    margin = 0,
    // Margin outside scissor to avoid clipping vertex displacement (px)
    inViewportMargin,
    inViewportThreshold,
    visible = true,
    hideOffscreen = true,
    scissor = false,
    debug = false,
    as = 'scene',
    renderOrder = 1,
    priority = config$1.PRIORITY_SCISSORS,
    ...props
  } = _ref;
  const inlineSceneRef = useCallback(node => {
    if (node !== null) {
      setScene(node);
    }
  }, []);
  const [scene, setScene] = useState(scissor ? new Scene() : null);
  const {
    requestRender,
    renderScissor
  } = useScrollRig();
  const globalRender = useCanvasStore(state => state.globalRender);
  const {
    bounds,
    scale,
    position,
    scrollState,
    inViewport
  } = useTracker(track, {
    rootMargin: inViewportMargin,
    threshold: inViewportThreshold
  }); // Hide scene when outside of viewport if `hideOffscreen` or set to `visible` prop

  useLayoutEffect(() => {
    if (scene) scene.visible = hideOffscreen ? inViewport && visible : visible;
  }, [scene, inViewport, hideOffscreen, visible]); // RENDER FRAME

  useFrame(_ref2 => {
    let {
      gl,
      camera
    } = _ref2;
    if (!scene || !scale) return;

    if (scene.visible) {
      // move scene
      scene.position.y = position.y;
      scene.position.x = position.x;

      if (scissor) {
        renderScissor({
          gl,
          scene,
          camera,
          left: bounds.left - margin,
          top: bounds.positiveYUpBottom - margin,
          width: bounds.width + margin * 2,
          height: bounds.height + margin * 2
        });
      } else {
        requestRender();
      }
    }
  }, globalRender ? priority : undefined);

  const content = /*#__PURE__*/jsxs("group", {
    renderOrder: renderOrder,
    children: [(!children || debug) && scale && /*#__PURE__*/jsx(DebugMesh$1, {
      scale: scale
    }), children && scene && scale && children({
      // inherited props
      track,
      margin,
      renderOrder,
      // new props
      scale,
      scrollState,
      inViewport,
      scene,
      // useFrame render priority (in case children need to run after)
      priority: priority + renderOrder,
      // tunnel the rest
      ...props
    })]
  }); // portal if scissor or inline nested scene


  const InlineElement = as;
  return scissor ? createPortal(content, scene) : /*#__PURE__*/jsx(InlineElement, {
    ref: inlineSceneRef,
    children: content
  });
};

ScrollScene = /*#__PURE__*/React.memo(ScrollScene);

let ViewportScrollScene = _ref => {
  let {
    track,
    children,
    margin = 0,
    // Margin outside viewport to avoid clipping vertex displacement (px)
    inViewportMargin,
    inViewportThreshold,
    visible = true,
    hideOffscreen = true,
    debug = false,
    orthographic = false,
    renderOrder = 1,
    priority = config$1.PRIORITY_VIEWPORTS,
    ...props
  } = _ref;
  const camera = useRef();
  const [scene] = useState(() => new Scene()); // const get = useThree((state) => state.get)
  // const setEvents = useThree((state) => state.setEvents)

  const {
    renderViewport
  } = useScrollRig();
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const scaleMultiplier = useCanvasStore(state => state.scaleMultiplier);
  const {
    rect,
    bounds,
    scale,
    position,
    scrollState,
    inViewport
  } = useTracker(track, {
    rootMargin: inViewportMargin,
    threshold: inViewportThreshold
  }); // Hide scene when outside of viewport if `hideOffscreen` or set to `visible` prop

  useLayoutEffect(() => {
    scene.visible = hideOffscreen ? inViewport && visible : visible;
  }, [inViewport, hideOffscreen, visible]);
  const [cameraDistance, setCameraDistance] = useState(0); // Find bounding box & scale mesh on resize

  useLayoutEffect(() => {
    const viewportWidth = rect.width * scaleMultiplier;
    const viewportHeight = rect.height * scaleMultiplier;
    const cameraDistance = Math.max(viewportWidth, viewportHeight);
    setCameraDistance(cameraDistance); // Calculate FOV to match the DOM rect for this camera distance

    if (camera.current && !orthographic) {
      camera.current.aspect = (viewportWidth + margin * 2 * scaleMultiplier) / (viewportHeight + margin * 2 * scaleMultiplier);
      camera.current.fov = 2 * (180 / Math.PI) * Math.atan((viewportHeight + margin * 2 * scaleMultiplier) / (2 * cameraDistance));
      camera.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
      // Update matrix world since the renderer is a frame late

      camera.current.updateMatrixWorld();
    } // trigger a frame


    invalidate();
  }, [track, pageReflow, rect, scaleMultiplier]);
  const compute = React.useCallback((event, state) => {
    // limit events to DOM element bounds
    if (track.current && event.target === track.current) {
      const {
        width,
        height,
        left,
        top
      } = bounds;
      const mWidth = width + margin * 2;
      const mHeight = height + margin * 2;
      const x = event.clientX - left + margin;
      const y = event.clientY - top + margin;
      state.pointer.set(x / mWidth * 2 - 1, -(y / mHeight) * 2 + 1);
      state.raycaster.setFromCamera(state.pointer, camera.current);
    }
  }, [bounds, position]); // Not needed?
  // from: https://github.com/pmndrs/drei/blob/d22fe0f58fd596c7bfb60a7a543cf6c80da87624/src/web/View.tsx#L80
  // but seems to work without it
  // useEffect(() => {
  //   // Connect the event layer to the tracking element
  //   const old = get().events.connected
  //   setEvents({ connected: track.current })
  //   return () => setEvents({ connected: old })
  // }, [])
  // RENDER FRAME

  useFrame(_ref2 => {
    let {
      gl
    } = _ref2;
    if (!scene || !scale) return; // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas

    if (scene.visible) {
      renderViewport({
        gl,
        scene,
        camera: camera.current,
        left: bounds.left - margin,
        top: bounds.positiveYUpBottom - margin,
        width: bounds.width + margin * 2,
        height: bounds.height + margin * 2
      });
    }
  }, priority);
  return bounds && createPortal( /*#__PURE__*/jsxs(Fragment, {
    children: [!orthographic && /*#__PURE__*/jsx("perspectiveCamera", {
      ref: camera,
      position: [0, 0, cameraDistance],
      onUpdate: self => self.updateProjectionMatrix()
    }), orthographic && /*#__PURE__*/jsx("orthographicCamera", {
      ref: camera,
      position: [0, 0, cameraDistance],
      onUpdate: self => self.updateProjectionMatrix(),
      left: scale[0] / -2,
      right: scale[0] / 2,
      top: scale[1] / 2,
      bottom: scale[1] / -2,
      far: cameraDistance * 2,
      near: 0.001
    }), /*#__PURE__*/jsxs("group", {
      renderOrder: renderOrder,
      children: [(!children || debug) && scale && /*#__PURE__*/jsx(DebugMesh$1, {
        scale: scale
      }), children && scene && scale && children({
        // inherited props
        track,
        margin,
        renderOrder,
        // new props
        scale,
        scrollState,
        inViewport,
        scene,
        camera: camera.current,
        // useFrame render priority (in case children need to run after)
        priority: priority + renderOrder,
        // tunnel the rest
        ...props
      })]
    })]
  }), scene, {
    events: {
      compute,
      priority
    },
    size: {
      width: rect.width,
      height: rect.height
    }
  });
};

ViewportScrollScene = /*#__PURE__*/React.memo(ViewportScrollScene);

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted
 * @param {object} object THREE.js object3d
 */
function useCanvas(object) {
  let deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  let {
    key,
    dispose = true
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const updateCanvas = useCanvasStore(state => state.updateCanvas);
  const renderToCanvas = useCanvasStore(state => state.renderToCanvas);
  const removeFromCanvas = useCanvasStore(state => state.removeFromCanvas); // auto generate uuid v4 key

  const uniqueKey = useMemo(() => key || MathUtils.generateUUID(), []); // render to canvas if not mounted already

  useLayoutEffect(() => {
    renderToCanvas(uniqueKey, object, {
      inactive: false
    });
  }, [uniqueKey]); // remove from canvas if no usage (after render so new users have time to register)

  useEffect(() => {
    return () => {
      removeFromCanvas(uniqueKey, dispose);
    };
  }, [uniqueKey]); // return function that can set new props on the canvas component

  const set = useCallback(props => {
    updateCanvas(uniqueKey, props);
  }, [updateCanvas, uniqueKey]); // auto update props when deps change

  useEffect(() => {
    set(deps);
  }, [...Object.values(deps)]);
  return set;
}

const UseCanvas = /*#__PURE__*/forwardRef((_ref, ref) => {
  let {
    children,
    id,
    ...props
  } = _ref;
  // auto update canvas with all props
  useCanvas(children, { ...props,
    ref
  }, {
    key: id
  });
  return null;
});

/**
 *  Create Threejs Texture from DOM image tag
 *
 *  - Supports <picture> and `srcset` - uses `currentSrc` to get the responsive image source
 *
 *  - Supports lazy-loading image - suspends until first load event. Warning: the GPU upload can cause jank
 *
 *  - Relies on browser cache to avoid loading image twice. We let the <img> tag load the image and suspend until it's ready.
 *
 *  - NOTE: You must add the `crossOrigin` attribute
 *     <img src="" alt="" crossOrigin="anonymous"/>
 */

let hasWebpSupport = false; // this test is fast - "should" run before first image is requested

supportsWebP.then(supported => {
  hasWebpSupport = supported;
});

function useTextureLoader() {
  // Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
  // expensive work of uploading a texture to the GPU off the main thread.
  // Copied from: github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/GLTFLoader.js#L2424
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) === true;
  const isFirefox = navigator.userAgent.indexOf('Firefox') > -1; // @ts-ignore

  const firefoxVersion = isFirefox ? navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1] : -1;
  return typeof createImageBitmap === 'undefined' || isSafari || isFirefox && firefoxVersion < 98;
}

function useImageAsTexture(imgRef) {
  let {
    initTexture = true,
    premultiplyAlpha = 'default'
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const gl = useThree(s => s.gl);
  const size = useThree(s => s.size);
  const debug = useCanvasStore(state => state.debug); // suspend until we have currentSrc for this `size`

  const currentSrc = suspend(() => {
    DefaultLoadingManager.itemStart('waiting for DOM image');
    return new Promise(resolve => {
      const el = imgRef.current;

      function returnResolve() {
        resolve(el === null || el === void 0 ? void 0 : el.currentSrc);
      } // respond to all future load events (resizing might load another image)


      el === null || el === void 0 ? void 0 : el.addEventListener('load', returnResolve, {
        once: true
      }); // detect if loaded from browser cache

      if (el !== null && el !== void 0 && el.complete) {
        el === null || el === void 0 ? void 0 : el.removeEventListener('load', returnResolve);
        returnResolve();
      }
    });
  }, [imgRef, size], {
    equal
  } // use deep-equal since size ref seems to update on route change
  );
  const LoaderProto = useTextureLoader() ? TextureLoader : ImageBitmapLoader; // @ts-ignore

  const result = useLoader(LoaderProto, currentSrc, loader => {
    if (loader instanceof ImageBitmapLoader) {
      loader.setOptions({
        colorSpaceConversion: 'none',
        premultiplyAlpha,
        // "none" increases blocking time in lighthouse
        imageOrientation: 'flipY'
      }); // Add webp to Accept header if supported
      // TODO: add check for AVIF

      loader.setRequestHeader({
        Accept: `${hasWebpSupport ? 'image/webp,' : ''}*/*`
      });
    }
  });
  const texture = useMemo(() => {
    if (result instanceof Texture) {
      return result;
    }

    if (result instanceof ImageBitmap) {
      return new CanvasTexture(result);
    }
  }, [result]); // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render

  useEffect(function uploadTextureToGPU() {
    initTexture && gl.initTexture(texture);
    DefaultLoadingManager.itemEnd('waiting for DOM image');
    debug && console.log('useImageAsTexture', 'initTexture()');
  }, [gl, texture, initTexture]);
  return texture;
}

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
    // @ts-ignore
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

const debounce = require('debounce');

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
  const globalScrollState = useCanvasStore(state => state.scroll); // set initial scroll direction
  // need to be updated before children render

  globalScrollState.direction = horizontal ? 'horizontal' : 'vertical'; // disable pointer events while scrolling to avoid slow event handlers

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
  }, []); // apply chosen scroll restoration

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = scrollRestoration;
    }
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
      globalScrollState.y = direction === 'vertical' ? scroll : 0;
      globalScrollState.x = direction === 'horizontal' ? scroll : 0;
      globalScrollState.limit = limit;
      globalScrollState.velocity = velocity;
      globalScrollState.direction = direction;
      globalScrollState.progress = progress; // disable pointer logic

      const disablePointer = debounce(() => preventPointerEvents(true), 100, true);

      if (Math.abs(velocity) > 1.4) {
        disablePointer();
      } else {
        preventPointerEvents(false);
      }

      invalidate();
    }); // expose global scrollTo function
    // @ts-ignore

    useCanvasStore.setState({
      scrollTo: (_lenis$current5 = lenis.current) === null || _lenis$current5 === void 0 ? void 0 : _lenis$current5.scrollTo
    }); // expose global onScroll function to subscribe to scroll events
    // @ts-ignore

    useCanvasStore.setState({
      onScroll
    }); // Set current scroll position on load in case reloaded further down

    useCanvasStore.getState().scroll.y = window.scrollY;
    useCanvasStore.getState().scroll.x = window.scrollX; // Set active

    document.documentElement.classList.toggle('js-smooth-scrollbar-enabled', enabled);
    document.documentElement.classList.toggle('js-smooth-scrollbar-disabled', !enabled);
    useCanvasStore.setState({
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

// Components
// Matching css styles can be imported from @14islands/r3f-scrollr-rig/css

const styles = {
  hidden: 'ScrollRig-visibilityHidden',
  hiddenWhenSmooth: 'ScrollRig-visibilityHidden ScrollRig-hiddenIfSmooth',
  transparentColor: 'ScrollRig-transparentColor',
  transparentColorWhenSmooth: 'ScrollRig-transparentColor ScrollRig-hiddenIfSmooth'
}; // Private-ish

export { GlobalCanvasIfSupported$1 as GlobalCanvas, ScrollScene, SmoothScrollbar, UseCanvas, ViewportScrollScene, styles, useCanvas, useCanvasStore, useImageAsTexture, useScrollRig, useScrollbar, useTracker };
