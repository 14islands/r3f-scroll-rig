import React, { useEffect, forwardRef, useMemo, useRef, useLayoutEffect, Fragment as Fragment$1, Suspense, useCallback, useState, useImperativeHandle } from 'react';
import { useThree, invalidate, useFrame, Canvas, extend, createPortal, useLoader, addEffect } from '@react-three/fiber';
import { ResizeObserver } from '@juggle/resize-observer';
import { parse } from 'query-string';
import create from 'zustand';
import mergeRefs from 'react-merge-refs';
import { jsx, Fragment, jsxs } from 'react/jsx-runtime';
import { Vector2, Color, MathUtils, Scene, ImageBitmapLoader, Texture, CanvasTexture, TextureLoader } from 'three';
import { shaderMaterial } from '@react-three/drei/core/shaderMaterial.js';
import { useInView } from 'react-intersection-observer';
import { suspend } from 'suspend-react';
import { debounce } from 'debounce';
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

const useCanvasStore = create(set => ({
  // //////////////////////////////////////////////////////////////////////////
  // GLOBAL ScrollRig STATE
  // //////////////////////////////////////////////////////////////////////////
  debug: false,
  scaleMultiplier: config.DEFAULT_SCALE_MULTIPLIER,
  globalRender: true,
  globalPriority: config.PRIORITY_GLOBAL,
  globalAutoClear: false,
  globalClearDepth: true,
  globalRenderQueue: false,
  clearGlobalRenderQueue: () => set(() => ({
    globalRenderQueue: false
  })),
  // true if WebGL initialized without errors
  isCanvasAvailable: true,
  // true if <VirtualScrollbar> is currently enabled
  hasVirtualScrollbar: false,
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
  config.preloadQueue.push(gl => {
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
  const hasVirtualScrollbar = useCanvasStore(state => state.hasVirtualScrollbar);
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
    hasVirtualScrollbar,
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

const col = new Color();
/**
 * Global render loop to avoid double renders on the same frame
 */

const GlobalRenderer = () => {
  const gl = useThree(s => s.gl);
  const frameloop = useThree(s => s.frameloop);
  const canvasChildren = useCanvasStore(state => state.canvasChildren);
  const globalRender = useCanvasStore(state => state.globalRender);
  const globalClearDepth = useCanvasStore(state => state.globalClearDepth);
  const globalAutoClear = useCanvasStore(state => state.globalAutoClear);
  const globalPriority = useCanvasStore(state => state.globalPriority);
  const scrollRig = useScrollRig(); // https://threejs.org/docs/#api/en/renderers/WebGLRenderer.debug

  useLayoutEffect(() => {
    gl.debug.checkShaderErrors = scrollRig.debug;
  }, [scrollRig.debug]);
  useEffect(() => {
    // clear canvas automatically if all children were removed
    if (!Object.keys(canvasChildren).length) {
      scrollRig.debug && console.log('GlobalRenderer', 'auto clear empty canvas');
      gl.getClearColor(col);
      gl.setClearColor(col, gl.getClearAlpha());
      gl.clear(true, true);
    }
  }, [canvasChildren]); // PRELOAD RENDER LOOP

  useFrame(() => {
    if (!config.preloadQueue.length) return;
    gl.autoClear = false; // Render preload frames first and clear directly

    config.preloadQueue.forEach(render => render(gl)); // cleanup

    gl.clear();
    config.preloadQueue = [];
    gl.autoClear = true; // trigger new frame to get correct visual state after all preloads

    scrollRig.debug && console.log('GlobalRenderer', 'preload complete. trigger global render');
    scrollRig.requestRender();
    invalidate();
  }, globalRender ? config.PRIORITY_PRELOAD : -1 //negative priority doesn't take over render loop
  ); // GLOBAL RENDER LOOP

  useFrame(_ref => {
    let {
      camera,
      scene
    } = _ref;
    const globalRenderQueue = useCanvasStore.getState().globalRenderQueue; // Render if requested or if always on

    if (globalRender && (frameloop === 'always' || globalRenderQueue)) {
      gl.autoClear = globalAutoClear; // false will fail in Oculus Quest VR
      // render default layer, scene, camera

      camera.layers.disableAll();

      if (globalRenderQueue) {
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
  }, globalRender ? globalPriority : undefined); // Take over rendering

  scrollRig.debug && console.log('GlobalRenderer', Object.keys(canvasChildren).length);
  return /*#__PURE__*/jsx(Fragment, {
    children: Object.keys(canvasChildren).map(key => {
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

      return /*#__PURE__*/React.cloneElement(mesh, {
        key,
        ...props
      });
    })
  });
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
    scaleMultiplier = config.DEFAULT_SCALE_MULTIPLIER,
    globalRender = true,
    globalPriority = config.PRIORITY_GLOBAL,
    globalAutoClear = false,
    // don't clear viewports
    globalClearDepth = true,
    loadingFallback,
    ...props
  } = _ref;
  // enable debug mode
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
  return /*#__PURE__*/jsxs(CanvasElement // use our own default camera
  , {
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
    children: [/*#__PURE__*/jsxs(Suspense, {
      fallback: loadingFallback,
      children: [children, /*#__PURE__*/jsx(GlobalRenderer$1, {})]
    }), !orthographic && /*#__PURE__*/jsx(PerspectiveCamera$1, {
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
    jsx(CanvasErrorBoundary$1, {
      onError: err => {
        onError && onError(err);
        useCanvasStore.setState({
          isCanvasAvailable: false
        });
        /* WebGL failed to init */

        document.documentElement.classList.remove('js-has-global-canvas');
        document.documentElement.classList.add('js-global-canvas-error');
      },
      children: /*#__PURE__*/jsx(GlobalCanvas, { ...props,
        children: children
      })
    })
  );
};

var GlobalCanvasIfSupported$1 = GlobalCanvasIfSupported;

const DebugMaterial = shaderMaterial({
  color: new Color(1.0, 0.0, 0.0),
  opacity: 1
}, // vertex shader
` varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`, // fragment shader
`
    uniform vec3 color;
    uniform float opacity;
    varying vec2 vUv;
    void main() {
      gl_FragColor.rgba = vec4(color, opacity);
    }
  `);
extend({
  DebugMaterial
});
const DebugMesh = _ref => {
  let {
    scale
  } = _ref;
  return /*#__PURE__*/jsxs("mesh", {
    scale: scale,
    children: [/*#__PURE__*/jsx("planeBufferGeometry", {}), /*#__PURE__*/jsx("debugMaterial", {
      color: "hotpink",
      transparent: true,
      opacity: 0.5
    })]
  });
};
var DebugMesh$1 = DebugMesh;

/**
 * Public interface for ScrollRig
 */

const useScrollbar = () => {
  const hasVirtualScrollbar = useCanvasStore(state => state.hasVirtualScrollbar);
  const scroll = useCanvasStore(state => state.scroll);
  const scrollTo = useCanvasStore(state => state.scrollTo);
  const onScroll = useCanvasStore(state => state.onScroll);
  return {
    enabled: hasVirtualScrollbar,
    scroll,
    scrollTo,
    onScroll
  };
};

function isElementProps(obj) {
  return typeof obj === 'object' && 'track' in obj;
}

const defaultArgs = {
  rootMargin: '50%'
};
/**
 * Returns the current Scene position of the DOM element
 * based on initial getBoundingClientRect and scroll delta from start
 */

function useTracker(args) {
  let deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  const size = useThree(s => s.size);
  const {
    scroll
  } = useScrollbar();
  const scaleMultiplier = useCanvasStore(state => state.scaleMultiplier);
  const {
    track,
    rootMargin
  } = isElementProps(args) ? { ...defaultArgs,
    ...args
  } : { ...defaultArgs,
    track: args
  }; // check if element is in viewport

  const {
    ref,
    inView: inViewport
  } = useInView({
    rootMargin
  }); // bind useInView ref to current tracking element

  useLayoutEffect(() => {
    ref(track.current);
  }, [track]); // cache the return object

  const position = useRef({
    x: 0,
    // exact position on page
    y: 0,
    // exact position on page
    top: 0,
    left: 0,
    positiveYUpBottom: 0
  }).current;
  const scrollState = useRef({
    inViewport: false,
    progress: -1,
    visibility: -1,
    viewport: -1
  }).current;
  useLayoutEffect(() => {
    scrollState.inViewport = inViewport;
  }, [inViewport]); // DOM rect bounds

  const bounds = useMemo(() => {
    var _track$current;

    const {
      top,
      bottom,
      left,
      right,
      width,
      height
    } = ((_track$current = track.current) === null || _track$current === void 0 ? void 0 : _track$current.getBoundingClientRect()) || {}; // Offset to Threejs scene which has 0,0 in the center of the screen

    const sceneOffset = {
      x: size.width * 0.5 - width * 0.5,
      y: size.height * 0.5 - height * 0.5
    };
    const bounds = {
      top: top + window.scrollY,
      bottom: bottom + window.scrollY,
      left: left + window.scrollX,
      right: right + window.scrollX,
      width,
      height,
      sceneOffset,
      x: left + window.scrollX - sceneOffset.x,
      // 0 middle of screen
      y: top + window.scrollY - sceneOffset.y // 0 middle of screen

    }; // update position

    position.x = ((bounds === null || bounds === void 0 ? void 0 : bounds.x) - window.scrollX) * scaleMultiplier; // exact position

    position.y = -1 * ((bounds === null || bounds === void 0 ? void 0 : bounds.y) - window.scrollY) * scaleMultiplier; // exact position

    position.top = position.y + bounds.sceneOffset.y;
    position.left = position.x + bounds.sceneOffset.x;
    position.positiveYUpBottom = 0;
    return bounds;
  }, [track, size, scaleMultiplier, ...deps]); // scale in viewport units and pixel

  const scale = useMemo(() => {
    return [(bounds === null || bounds === void 0 ? void 0 : bounds.width) * scaleMultiplier, (bounds === null || bounds === void 0 ? void 0 : bounds.height) * scaleMultiplier, 1];
  }, [track, size, ...deps]);
  const update = useCallback(() => {
    if (!track.current || !scrollState.inViewport) {
      return;
    }

    position.x = (bounds.x - scroll.x) * scaleMultiplier;
    position.y = -1 * (bounds.y - scroll.y) * scaleMultiplier;
    position.top = position.y + bounds.sceneOffset.y;
    position.left = position.x + bounds.sceneOffset.x;
    position.positiveYUpBottom = size.height * 0.5 + (position.y / scaleMultiplier - bounds.height * 0.5); // inverse Y
    // calculate progress of passing through viewport (0 = just entered, 1 = just exited)

    const pxInside = bounds.top + position.y - bounds.top + size.height - bounds.sceneOffset.y;
    scrollState.progress = MathUtils.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1); // percent of total visible distance

    scrollState.visibility = MathUtils.mapLinear(pxInside, 0, bounds.height, 0, 1); // percent of item height in view

    scrollState.viewport = MathUtils.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
  }, [bounds, track, size]);
  return {
    bounds,
    // HTML initial bounds
    scale,
    // Scene scale - includes z-axis so it can be spread onto mesh directly
    scrollState,
    position,
    // get current Scene position with scroll taken into account
    inViewport,
    update // call in rAF to update with latest scroll position

  };
}

let ScrollScene = _ref => {
  let {
    track,
    children,
    margin = 0,
    // Margin outside scissor to avoid clipping vertex displacement (px)
    inViewportMargin,
    visible = true,
    hideOffscreen = true,
    scissor = false,
    debug = false,
    as = 'scene',
    renderOrder = 1,
    priority = config.PRIORITY_SCISSORS,
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
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const globalRender = useCanvasStore(state => state.globalRender);
  const {
    update,
    bounds,
    scale,
    position,
    scrollState,
    inViewport
  } = useTracker({
    track,
    rootMargin: inViewportMargin
  }, [pageReflow, scene]); // Hide scene when outside of viewport if `hideOffscreen` or set to `visible` prop

  useLayoutEffect(() => {
    if (scene) scene.visible = hideOffscreen ? inViewport && visible : visible;
  }, [scene, inViewport, hideOffscreen, visible]); // RENDER FRAME

  useFrame(_ref2 => {
    let {
      gl,
      camera
    } = _ref2;
    if (!scene || !scale) return; // update element tracker

    update();

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
          top: position.positiveYUpBottom - margin,
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
    visible = true,
    hideOffscreen = true,
    debug = false,
    orthographic = false,
    renderOrder = 1,
    priority = config.PRIORITY_VIEWPORTS,
    ...props
  } = _ref;
  const camera = useRef();
  const [scene] = useState(() => new Scene()); // const get = useThree((state) => state.get)
  // const setEvents = useThree((state) => state.setEvents)

  const {
    renderViewport
  } = useScrollRig();
  const {
    scroll
  } = useScrollbar();
  const pageReflow = useCanvasStore(state => state.pageReflow);
  const scaleMultiplier = useCanvasStore(state => state.scaleMultiplier);
  const {
    update,
    bounds,
    scale,
    position,
    scrollState,
    inViewport
  } = useTracker({
    track,
    rootMargin: inViewportMargin
  }, [pageReflow, scene]); // Hide scene when outside of viewport if `hideOffscreen` or set to `visible` prop

  useLayoutEffect(() => {
    scene.visible = hideOffscreen ? inViewport && visible : visible;
  }, [inViewport, hideOffscreen, visible]);
  const [cameraDistance, setCameraDistance] = useState(0); // Find bounding box & scale mesh on resize

  useLayoutEffect(() => {
    const viewportWidth = bounds.width * scaleMultiplier;
    const viewportHeight = bounds.height * scaleMultiplier;
    const cameraDistance = Math.max(viewportWidth, viewportHeight);
    setCameraDistance(cameraDistance); // Calculate FOV to match the DOM bounds for this camera distance

    if (camera.current && !orthographic) {
      camera.current.aspect = (viewportWidth + margin * 2 * scaleMultiplier) / (viewportHeight + margin * 2 * scaleMultiplier);
      camera.current.fov = 2 * (180 / Math.PI) * Math.atan((viewportHeight + margin * 2 * scaleMultiplier) / (2 * cameraDistance));
      camera.current.updateProjectionMatrix(); // https://github.com/react-spring/@react-three/fiber/issues/178
      // Update matrix world since the renderer is a frame late

      camera.current.updateMatrixWorld();
    } // trigger a frame


    invalidate();
  }, [track, pageReflow, bounds, scaleMultiplier]);
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
      const x = event.clientX - left + margin + scroll.x;
      const y = event.clientY - top + margin + scroll.y;
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
    if (!scene || !scale) return; // update element tracker

    update(); // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas

    if (scene.visible) {
      renderViewport({
        gl,
        scene,
        camera: camera.current,
        left: bounds.left - margin,
        top: position.positiveYUpBottom - margin,
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
      width: bounds.width,
      height: bounds.height
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
// Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
// expensive work of uploading a texture to the GPU off the main thread.
// Copied from: github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/GLTFLoader.js#L2424

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) === true;
const isFirefox = navigator.userAgent.indexOf('Firefox') > -1; // @ts-ignore

const firefoxVersion = isFirefox ? navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1] : -1;
const useTextureLoader = typeof createImageBitmap === 'undefined' || isSafari || isFirefox && firefoxVersion < 98;

function useImageAsTexture(imgRef) {
  let {
    initTexture = true,
    premultiplyAlpha = 'default'
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const {
    gl
  } = useThree();
  const {
    size
  } = useThree();
  const currentSrc = suspend(() => {
    return new Promise(resolve => {
      const el = imgRef.current; // respond to all future load events (resizing might load another image)

      el === null || el === void 0 ? void 0 : el.addEventListener('load', () => resolve(el === null || el === void 0 ? void 0 : el.currentSrc), {
        once: true
      }); // detect if loaded from browser cache

      if (el !== null && el !== void 0 && el.complete) {
        resolve(el === null || el === void 0 ? void 0 : el.currentSrc);
      }
    });
  }, [imgRef, size]);
  const LoaderProto = useTextureLoader ? TextureLoader : ImageBitmapLoader; // @ts-ignore

  const result = useLoader(LoaderProto, currentSrc, loader => {
    if (loader instanceof ImageBitmapLoader) {
      loader.setOptions({
        colorSpaceConversion: 'none',
        premultiplyAlpha,
        // "none" increases blocking time in lighthouse
        imageOrientation: 'flipY'
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
    smooth = true,
    paused = false,
    scrollRestoration = 'auto',
    disablePointerOnScroll = true,
    config
  } = _ref;
  const ref = useRef();
  const lenis = useRef();
  const preventPointer = useRef(false);
  const scrollState = useCanvasStore(state => state.scroll); // disable pointer events while scrolling to avoid slow event handlers

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

    useCanvasStore.setState({
      scrollTo: (_lenis$current5 = lenis.current) === null || _lenis$current5 === void 0 ? void 0 : _lenis$current5.scrollTo
    }); // expose global onScroll function to subscribe to scroll events
    // @ts-ignore

    useCanvasStore.setState({
      onScroll
    }); // Set active

    document.documentElement.classList.toggle('js-has-smooth-scrollbar', smooth);
    useCanvasStore.setState({
      hasVirtualScrollbar: smooth
    }); // make sure R3F loop is invalidated when scrolling

    const invalidateOnWheelEvent = () => invalidate();

    window.addEventListener('pointermove', onMouseMove);
    window.addEventListener('wheel', invalidateOnWheelEvent);
    return () => {
      removeEffect();
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('wheel', invalidateOnWheelEvent);
    };
  }, [smooth]);
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = scrollRestoration;
    }
  }, []);
  useEffect(() => {
    var _lenis$current6, _lenis$current7;

    paused ? (_lenis$current6 = lenis.current) === null || _lenis$current6 === void 0 ? void 0 : _lenis$current6.stop() : (_lenis$current7 = lenis.current) === null || _lenis$current7 === void 0 ? void 0 : _lenis$current7.start();
  }, [paused]);
  return /*#__PURE__*/jsx(LenisScrollbar$1, {
    ref: lenis,
    smooth: smooth,
    config: config,
    children: bind => children({ ...bind,
      ref
    })
  });
};

export { GlobalCanvasIfSupported$1 as GlobalCanvas, ScrollScene, SmoothScrollbar, UseCanvas, ViewportScrollScene, config as _config, useCanvas, useCanvasRef, useCanvasStore, useImageAsTexture, useScrollRig, useScrollbar, useTracker };
