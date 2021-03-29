'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('@babel/runtime/helpers/extends'));
var _objectWithoutPropertiesLoose = _interopDefault(require('@babel/runtime/helpers/objectWithoutPropertiesLoose'));
var React = require('react');
var React__default = _interopDefault(React);
var reactThreeFiber = require('react-three-fiber');
var three = require('three');
var resizeObserver = require('@juggle/resize-observer');
var queryString = _interopDefault(require('query-string'));
var StatsImpl = _interopDefault(require('three/examples/js/libs/stats.min'));
var create = _interopDefault(require('zustand'));
var windowSize = require('@react-hook/window-size');
var mergeRefs = _interopDefault(require('react-merge-refs'));
var r3fScrollRig = require('@14islands/r3f-scroll-rig');
var _inheritsLoose = _interopDefault(require('@babel/runtime/helpers/inheritsLoose'));
var PropTypes = _interopDefault(require('prop-types'));
var shaderMaterial = require('@react-three/drei/core/shaderMaterial');
var ReactDOM = _interopDefault(require('react-dom'));

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

  obj.children.forEach(function (child) {
    return setAllCulled(child, overrideCulled);
  });
}

var utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  setAllCulled: setAllCulled
});

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
  globalRender: false,
  preloadQueue: [],
  hasVirtualScrollbar: false,
  hasGlobalCanvas: false
};

/* Copied from drei - no need to import just for this */

function Stats(_ref) {
  var _ref$showPanel = _ref.showPanel,
      showPanel = _ref$showPanel === void 0 ? 0 : _ref$showPanel,
      className = _ref.className,
      parent = _ref.parent;

  var _useState = React.useState(new StatsImpl()),
      stats = _useState[0];

  React.useEffect(function () {
    if (stats) {
      var node = parent && parent.current || document.body;
      stats.showPanel(showPanel);
      node.appendChild(stats.dom);
      if (className) stats.dom.classList.add(className);
      var begin = reactThreeFiber.addEffect(function () {
        return stats.begin();
      });
      var end = reactThreeFiber.addAfterEffect(function () {
        return stats.end();
      });
      return function () {
        node.removeChild(stats.dom);
        begin();
        end();
      };
    }
  }, [parent, stats, className, showPanel]);
  return null;
}

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
var cancelIdleCallback = function cancelIdleCallback(id) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
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
    pageReflowRequested: 0,
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
}),
    useCanvasStore = _create[0],
    canvasStoreApi = _create[1];

var viewportSize = new three.Vector2(); // Flag that we need global rendering (full screen)

var requestRender = function requestRender(layers) {
  if (layers === void 0) {
    layers = [0];
  }

  config.globalRender = config.globalRender || [0];
  config.globalRender = [].concat(config.globalRender, layers);
};
var renderScissor = function renderScissor(_ref) {
  var gl = _ref.gl,
      scene = _ref.scene,
      camera = _ref.camera,
      left = _ref.left,
      top = _ref.top,
      width = _ref.width,
      height = _ref.height,
      _ref$layer = _ref.layer,
      layer = _ref$layer === void 0 ? 0 : _ref$layer,
      _ref$autoClear = _ref.autoClear,
      autoClear = _ref$autoClear === void 0 ? false : _ref$autoClear,
      _ref$clearDepth = _ref.clearDepth,
      clearDepth = _ref$clearDepth === void 0 ? true : _ref$clearDepth;
  if (!scene || !camera) return;
  gl.autoClear = autoClear;
  gl.setScissor(left, top, width, height);
  gl.setScissorTest(true);
  camera.layers.set(layer);
  clearDepth && gl.clearDepth();
  gl.render(scene, camera);
  gl.setScissorTest(false);
};
var renderViewport = function renderViewport(_ref2) {
  var gl = _ref2.gl,
      scene = _ref2.scene,
      camera = _ref2.camera,
      left = _ref2.left,
      top = _ref2.top,
      width = _ref2.width,
      height = _ref2.height,
      _ref2$layer = _ref2.layer,
      layer = _ref2$layer === void 0 ? 0 : _ref2$layer,
      _ref2$autoClear = _ref2.autoClear,
      autoClear = _ref2$autoClear === void 0 ? false : _ref2$autoClear,
      _ref2$clearDepth = _ref2.clearDepth,
      clearDepth = _ref2$clearDepth === void 0 ? true : _ref2$clearDepth;
  if (!scene || !camera) return;
  gl.getSize(viewportSize);
  gl.autoClear = autoClear;
  gl.setViewport(left, top, width, height);
  gl.setScissor(left, top, width, height);
  gl.setScissorTest(true);
  camera.layers.set(layer);
  clearDepth && gl.clearDepth();
  gl.render(scene, camera);
  gl.setScissorTest(false);
  gl.setViewport(0, 0, viewportSize.x, viewportSize.y);
};
var preloadScene = function preloadScene(scene, camera, layer, callback) {
  if (layer === void 0) {
    layer = 0;
  }

  if (!scene || !camera) return;
  config.preloadQueue.push(function (gl) {
    gl.setScissorTest(false);
    setAllCulled(scene, false);
    camera.layers.set(layer);
    gl.render(scene, camera);
    setAllCulled(scene, true);
    callback && callback();
  });
};

/**
 * Public interface for ScrollRig
 */

var useScrollRig = function useScrollRig() {
  var isCanvasAvailable = useCanvasStore(function (state) {
    return state.isCanvasAvailable;
  });
  var hasVirtualScrollbar = useCanvasStore(function (state) {
    return state.hasVirtualScrollbar;
  });
  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  });
  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  });
  var pixelRatio = useCanvasStore(function (state) {
    return state.pixelRatio;
  });
  return {
    isCanvasAvailable: isCanvasAvailable,
    hasVirtualScrollbar: hasVirtualScrollbar,
    pixelRatio: pixelRatio,
    invalidate: reactThreeFiber.invalidate,
    preloadScene: preloadScene,
    requestRender: requestRender,
    renderScissor: renderScissor,
    renderViewport: renderViewport,
    reflow: requestReflow,
    reflowCompleted: pageReflowCompleted
  };
};

/**
 * Global render loop to avoid double renders on the same frame
 */

var GlobalRenderer = function GlobalRenderer(_ref) {
  var children = _ref.children;
  var scene = React.useRef();

  var _useThree = reactThreeFiber.useThree(),
      gl = _useThree.gl;

  var canvasChildren = useCanvasStore(function (state) {
    return state.canvasChildren;
  });
  var scrollRig = useScrollRig();
  React.useLayoutEffect(function () {
    gl.debug.checkShaderErrors = config.debug;
  }, []); // PRELOAD RENDER LOOP

  reactThreeFiber.useFrame(function (_ref2) {
    var camera = _ref2.camera,
        scene = _ref2.scene;
    gl.autoClear = false; // Render preload frames first and clear directly

    config.preloadQueue.forEach(function (render) {
      return render(gl);
    });
    if (config.preloadQueue.length) gl.clear(); // cleanup

    config.preloadQueue = [];
  }, config.PRIORITY_PRELOAD); // GLOBAL RENDER LOOP

  reactThreeFiber.useFrame(function (_ref3) {
    var camera = _ref3.camera,
        scene = _ref3.scene;

    // Global render pass
    if (config.globalRender) {
      gl.autoClear = false; // will fail in VR
      // render default layer, scene, camera

      camera.layers.disableAll();
      config.globalRender.forEach(function (layer) {
        camera.layers.enable(layer);
      });
      gl.clearDepth(); // render as HUD over any other renders

      gl.render(scene, camera); // cleanup for next frame

      config.globalRender = false;
      gl.autoClear = true;
    }
  }, config.PRIORITY_GLOBAL); // Take over rendering

  config.debug && console.log('GlobalRenderer', Object.keys(canvasChildren).length);
  return /*#__PURE__*/React__default.createElement("scene", {
    ref: scene
  }, /*#__PURE__*/React__default.createElement(React.Suspense, {
    fallback: null
  }, Object.keys(canvasChildren).map(function (key, i) {
    var _canvasChildren$key = canvasChildren[key],
        mesh = _canvasChildren$key.mesh,
        props = _canvasChildren$key.props;

    if (typeof mesh === 'function') {
      return /*#__PURE__*/React__default.createElement(React.Fragment, {
        key: key
      }, mesh(_extends({
        key: key
      }, scrollRig, props)));
    }

    return /*#__PURE__*/React__default.cloneElement(mesh, _extends({
      key: key
    }, props));
  }), children));
};

var PerformanceMonitor = function PerformanceMonitor() {
  var _useThree = reactThreeFiber.useThree(),
      size = _useThree.size;

  var setPixelRatio = useCanvasStore(function (state) {
    return state.setPixelRatio;
  });
  React.useEffect(function () {
    var devicePixelRatio = window.devicePixelRatio || 1;

    if (devicePixelRatio > 1) {
      var MAX_PIXEL_RATIO = 2.5; // TODO Can we allow better resolution on more powerful computers somehow?
      // Calculate avg frame rate and lower pixelRatio on demand?
      // scale down when scrolling fast?

      var scale;
      scale = size.width > 1500 ? 0.9 : 1.0;
      scale = size.width > 1900 ? 0.8 : scale;
      var pixelRatio = Math.max(1.0, Math.min(MAX_PIXEL_RATIO, devicePixelRatio * scale));
      config.debug && console.info('PerformanceMonitor', 'Set pixelRatio', pixelRatio);
      setPixelRatio(pixelRatio);
    }
  }, [size]);
  return null;
};

var StatsDebug = function StatsDebug(_ref) {
  var _ref$render = _ref.render,
      render = _ref$render === void 0 ? true : _ref$render,
      _ref$memory = _ref.memory,
      memory = _ref$memory === void 0 ? true : _ref$memory;
  var stats = React.useRef({
    calls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0
  }).current;
  reactThreeFiber.useFrame(function (_ref2) {
    var gl = _ref2.gl,
        clock = _ref2.clock;
    gl.info.autoReset = false;
    var _calls = gl.info.render.calls;
    var _triangles = gl.info.render.triangles;
    var _geometries = gl.info.memory.geometries;
    var _textures = gl.info.memory.textures;

    if (render) {
      if (_calls !== stats.calls || _triangles !== stats.triangles) {
        requestIdleCallback(function () {
          return console.info('Draw calls: ', _calls, ' Triangles: ', _triangles);
        });
        stats.calls = _calls;
        stats.triangles = _triangles;
      }
    }

    if (memory) {
      if (_geometries !== stats.geometries || _textures !== stats.textures) {
        requestIdleCallback(function () {
          return console.info('Geometries: ', _geometries, 'Textures: ', _textures);
        });
        stats.geometries = _geometries;
        stats.textures = _textures;
      }
    }

    gl.info.reset();
  });
  return null;
};

/**
 * Manages Scroll rig resize events by trigger a reflow instead of individual resize listeners in each component
 * The order is carefully scripted:
 *  1. reflow() will cause VirtualScrollbar to recalculate positions
 *  2. VirtualScrollbar triggers `pageReflowCompleted`
 *  3. Canvas scroll components listen to  `pageReflowCompleted` and recalc positions
 */

var ResizeManager = function ResizeManager(_ref) {
  var reflow = _ref.reflow,
      _ref$resizeOnHeight = _ref.resizeOnHeight,
      resizeOnHeight = _ref$resizeOnHeight === void 0 ? true : _ref$resizeOnHeight,
      _ref$resizeOnWebFontL = _ref.resizeOnWebFontLoaded,
      resizeOnWebFontLoaded = _ref$resizeOnWebFontL === void 0 ? true : _ref$resizeOnWebFontL;
  var mounted = React.useRef(false); // must be debounced more than the GlobalCanvas so all components have the correct value from useThree({ size })

  var _useWindowSize = windowSize.useWindowSize({
    wait: 300
  }),
      windowWidth = _useWindowSize[0],
      windowHeight = _useWindowSize[1]; // The reason for not resizing on height on "mobile" is because the height changes when the URL bar disapears in the browser chrome
  // Can we base this on something better - or is there another way to avoid?


  var height = resizeOnHeight ? windowHeight : null; // Detect only resize events

  React.useEffect(function () {
    if (mounted.current) {
      config.debug && console.log('ResizeManager', 'reflow()');
      reflow();
    } else {
      mounted.current = true;
    }
  }, [windowWidth, height]); // reflow on webfont loaded to prevent misalignments

  React.useEffect(function () {
    if (!resizeOnWebFontLoaded) return;
    var fallbackTimer;

    if ('fonts' in document) {
      document.fonts.onloadingdone = reflow;
    } else {
      fallbackTimer = setTimeout(reflow, 1000);
    }

    return function () {
      if ('fonts' in document) {
        document.fonts.onloadingdone = null;
      } else {
        clearTimeout(fallbackTimer);
      }
    };
  }, []);
  return null;
};

var PerspectiveCamera = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var _ref$makeDefault = _ref.makeDefault,
      makeDefault = _ref$makeDefault === void 0 ? false : _ref$makeDefault,
      _ref$scaleMultiplier = _ref.scaleMultiplier,
      scaleMultiplier = _ref$scaleMultiplier === void 0 ? r3fScrollRig.config.scaleMultiplier : _ref$scaleMultiplier,
      props = _objectWithoutPropertiesLoose(_ref, ["makeDefault", "scaleMultiplier"]);

  var _useThree = reactThreeFiber.useThree(),
      setDefaultCamera = _useThree.setDefaultCamera,
      camera = _useThree.camera,
      size = _useThree.size;

  var _useScrollRig = r3fScrollRig.useScrollRig(),
      reflowCompleted = _useScrollRig.reflowCompleted;

  var distance = React.useMemo(function () {
    var width = size.width * scaleMultiplier;
    var height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, reflowCompleted, scaleMultiplier]);
  var cameraRef = reactThreeFiber.useUpdate(function (cam) {
    var width = size.width * scaleMultiplier;
    var height = size.height * scaleMultiplier;
    cam.aspect = width / height;
    cam.near = 0.1;
    cam.far = distance * 2;
    cam.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance));
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix(); // https://github.com/react-spring/react-three-fiber/issues/178
    // Update matrix world since the renderer is a frame late

    cam.updateMatrixWorld();
  }, [distance, size]);
  React.useLayoutEffect(function () {
    if (makeDefault && cameraRef.current) {
      var oldCam = camera;
      setDefaultCamera(cameraRef.current);
      return function () {
        return setDefaultCamera(oldCam);
      };
    }
  }, [camera, cameraRef, makeDefault, setDefaultCamera]);
  return /*#__PURE__*/React__default.createElement("perspectiveCamera", _extends({
    ref: mergeRefs([cameraRef, ref]),
    position: [0, 0, distance],
    onUpdate: function onUpdate(self) {
      return self.updateProjectionMatrix();
    }
  }, props));
});
PerspectiveCamera.displayName = 'PerspectiveCamera';

var OrthographicCamera = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var _ref$makeDefault = _ref.makeDefault,
      makeDefault = _ref$makeDefault === void 0 ? false : _ref$makeDefault,
      _ref$scaleMultiplier = _ref.scaleMultiplier,
      scaleMultiplier = _ref$scaleMultiplier === void 0 ? r3fScrollRig.config.scaleMultiplier : _ref$scaleMultiplier,
      props = _objectWithoutPropertiesLoose(_ref, ["makeDefault", "scaleMultiplier"]);

  var _useThree = reactThreeFiber.useThree(),
      setDefaultCamera = _useThree.setDefaultCamera,
      camera = _useThree.camera,
      size = _useThree.size;

  var _useScrollRig = r3fScrollRig.useScrollRig(),
      reflowCompleted = _useScrollRig.reflowCompleted;

  var distance = React.useMemo(function () {
    var width = size.width * scaleMultiplier;
    var height = size.height * scaleMultiplier;
    return Math.max(width, height);
  }, [size, reflowCompleted, scaleMultiplier]);
  var cameraRef = reactThreeFiber.useUpdate(function (cam) {
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix(); // https://github.com/react-spring/react-three-fiber/issues/178
    // Update matrix world since the renderer is a frame late

    cam.updateMatrixWorld();
  }, [distance, size]);
  React.useLayoutEffect(function () {
    if (makeDefault && cameraRef.current) {
      var oldCam = camera;
      setDefaultCamera(cameraRef.current);
      return function () {
        return setDefaultCamera(oldCam);
      };
    }
  }, [camera, cameraRef, makeDefault, setDefaultCamera]);
  return /*#__PURE__*/React__default.createElement("orthographicCamera", _extends({
    left: size.width * scaleMultiplier / -2,
    right: size.width * scaleMultiplier / 2,
    top: size.height * scaleMultiplier / 2,
    bottom: size.height * scaleMultiplier / -2,
    far: distance * 2,
    position: [0, 0, distance],
    near: 0.001,
    ref: mergeRefs([cameraRef, ref]),
    onUpdate: function onUpdate(self) {
      return self.updateProjectionMatrix();
    }
  }, props));
});
OrthographicCamera.displayName = 'OrthographicCamera';

var DefaultScrollTracker = function DefaultScrollTracker() {
  var hasVirtualScrollbar = useCanvasStore(function (state) {
    return state.hasVirtualScrollbar;
  });
  var setScrollY = useCanvasStore(function (state) {
    return state.setScrollY;
  });
  var setScroll = React.useCallback(function () {
    setScrollY(window.pageYOffset);
  }, [setScrollY]);
  React.useEffect(function () {
    if (!hasVirtualScrollbar) {
      window.addEventListener('scroll', setScroll);
    }

    return function () {
      return window.removeEventListener('scroll', setScroll);
    };
  }, [hasVirtualScrollbar]);
  return null;
};

var CanvasErrorBoundary = /*#__PURE__*/function (_React$Component) {
  _inheritsLoose(CanvasErrorBoundary, _React$Component);

  function CanvasErrorBoundary(props) {
    var _this;

    _this = _React$Component.call(this, props) || this;
    _this.state = {
      error: false
    };
    _this.props = props;
    return _this;
  }

  CanvasErrorBoundary.getDerivedStateFromError = function getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return {
      error: error
    };
  } // componentDidCatch(error, errorInfo) {
  //   // You can also log the error to an error reporting service
  //   // logErrorToMyService(error, errorInfo)
  // }
  ;

  var _proto = CanvasErrorBoundary.prototype;

  _proto.render = function render() {
    if (this.state.error) {
      this.props.onError && this.props.onError(this.state.error);
      return null;
    }

    return this.props.children;
  };

  return CanvasErrorBoundary;
}(React__default.Component);

var GlobalCanvas = function GlobalCanvas(_ref) {
  var _ref$as = _ref.as,
      as = _ref$as === void 0 ? reactThreeFiber.Canvas : _ref$as,
      children = _ref.children,
      gl = _ref.gl,
      resizeOnHeight = _ref.resizeOnHeight,
      orthographic = _ref.orthographic,
      _ref$noEvents = _ref.noEvents,
      noEvents = _ref$noEvents === void 0 ? true : _ref$noEvents,
      confOverrides = _ref.config,
      props = _objectWithoutPropertiesLoose(_ref, ["as", "children", "gl", "resizeOnHeight", "orthographic", "noEvents", "config"]);

  var pixelRatio = useCanvasStore(function (state) {
    return state.pixelRatio;
  });
  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  }); // override config

  React.useMemo(function () {
    Object.assign(config, confOverrides);
  }, [confOverrides]); // flag that global canvas is active

  React.useEffect(function () {
    config.hasGlobalCanvas = true;
    return function () {
      config.hasGlobalCanvas = false;
    };
  }, []);
  React.useEffect(function () {
    var qs = queryString.parse(window.location.search); // show FPS counter on request

    if (typeof qs.fps !== 'undefined') {
      config.fps = true;
    } // show debug statements


    if (typeof qs.debug !== 'undefined') {
      config.debug = true;
    }
  }, []);
  var CanvasElement = as;
  return /*#__PURE__*/React__default.createElement(CanvasElement, _extends({
    className: "ScrollRigCanvas",
    invalidateFrameloop: true,
    gl: _extends({
      antialias: true,
      alpha: true,
      depth: true,
      powerPreference: 'high-performance',
      // https://blog.tojicode.com/2013/12/failifmajorperformancecaveat-with-great.html
      failIfMajorPerformanceCaveat: true
    }, gl),
    colorManagement: true // ACESFilmic seems incorrect for non-HDR settings - images get weird color
    ,
    noEvents: noEvents,
    resize: {
      scroll: false,
      debounce: 0,
      polyfill: resizeObserver.ResizeObserver
    } // concurrent // zustand (state mngr) is not compatible with concurrent mode yet
    ,
    pixelRatio: pixelRatio,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '100vh',
      // use 100vh to avoid resize on iOS when url bar goes away
      zIndex: 1,
      // to sit on top of the page-transition-links styles
      pointerEvents: noEvents ? 'none' : 'auto',
      transform: 'translateZ(0)'
    } // use our own default camera
    ,
    camera: null,
    updateDefaultCamera: false,
    onCreated: function onCreated(_ref2) {
      var gl = _ref2.gl;
      gl.toneMapping = three.NoToneMapping; // turn off tonemapping by default to provide better hex matching
    } // allow to override anything of the above

  }, props), /*#__PURE__*/React__default.createElement(GlobalRenderer, null, children), !orthographic && /*#__PURE__*/React__default.createElement(PerspectiveCamera, {
    makeDefault: true
  }), orthographic && /*#__PURE__*/React__default.createElement(OrthographicCamera, {
    makeDefault: true
  }), config.debug && /*#__PURE__*/React__default.createElement(StatsDebug, null), config.fps && /*#__PURE__*/React__default.createElement(Stats, null), config.autoPixelRatio && /*#__PURE__*/React__default.createElement(PerformanceMonitor, null), /*#__PURE__*/React__default.createElement(ResizeManager, {
    reflow: requestReflow,
    resizeOnHeight: resizeOnHeight
  }), /*#__PURE__*/React__default.createElement(DefaultScrollTracker, null));
};

var GlobalCanvasIfSupported = function GlobalCanvasIfSupported(_ref3) {
  var _onError = _ref3.onError,
      props = _objectWithoutPropertiesLoose(_ref3, ["onError"]);

  var setCanvasAvailable = useCanvasStore(function (state) {
    return state.setCanvasAvailable;
  });
  React.useLayoutEffect(function () {
    document.documentElement.classList.add('js-has-global-canvas');
  }, []);
  return /*#__PURE__*/React__default.createElement(CanvasErrorBoundary, {
    onError: function onError(err) {
      _onError && _onError(err);
      setCanvasAvailable(false);
      /* WebGL failed to init */

      document.documentElement.classList.remove('js-has-global-canvas');
      document.documentElement.classList.add('js-global-canvas-error');
    }
  }, /*#__PURE__*/React__default.createElement(GlobalCanvas, props));
};

var DebugMaterial = shaderMaterial.shaderMaterial({
  color: new three.Color(1.0, 0.0, 0.0),
  opacity: 1
}, // vertex shader
" varying vec2 vUv;\n    void main() {\n      vUv = uv;\n      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  }", // fragment shader
"\n    uniform vec3 color;\n    uniform float opacity;\n    varying vec2 vUv;\n    void main() {\n      gl_FragColor.rgba = vec4(color, opacity);\n    }\n  ");
reactThreeFiber.extend({
  DebugMaterial: DebugMaterial
});
var DebugMesh = function DebugMesh(_ref) {
  var scale = _ref.scale;
  return /*#__PURE__*/React__default.createElement("mesh", null, /*#__PURE__*/React__default.createElement("planeBufferGeometry", {
    attach: "geometry",
    args: [scale.width, scale.height, 1, 1]
  }), /*#__PURE__*/React__default.createElement("debugMaterial", {
    color: "hotpink",
    attach: "material",
    transparent: true,
    opacity: 0.5
  }));
};

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned and scaled exactly above DOM element
 *
 * @author david@14islands.com
 */

exports.ScrollScene = function ScrollScene(_ref) {
  var el = _ref.el,
      lerp = _ref.lerp,
      _ref$lerpOffset = _ref.lerpOffset,
      lerpOffset = _ref$lerpOffset === void 0 ? 0 : _ref$lerpOffset,
      children = _ref.children,
      _ref$renderOrder = _ref.renderOrder,
      renderOrder = _ref$renderOrder === void 0 ? 1 : _ref$renderOrder,
      _ref$priority = _ref.priority,
      priority = _ref$priority === void 0 ? config.PRIORITY_SCISSORS : _ref$priority,
      _ref$margin = _ref.margin,
      margin = _ref$margin === void 0 ? 14 : _ref$margin,
      inViewportMargin = _ref.inViewportMargin,
      _ref$visible = _ref.visible,
      visible = _ref$visible === void 0 ? true : _ref$visible,
      _ref$scissor = _ref.scissor,
      scissor = _ref$scissor === void 0 ? false : _ref$scissor,
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? false : _ref$debug,
      _ref$setInViewportPro = _ref.setInViewportProp,
      setInViewportProp = _ref$setInViewportPro === void 0 ? false : _ref$setInViewportPro,
      _ref$updateLayout = _ref.updateLayout,
      updateLayout = _ref$updateLayout === void 0 ? 0 : _ref$updateLayout,
      _ref$positionFixed = _ref.positionFixed,
      positionFixed = _ref$positionFixed === void 0 ? false : _ref$positionFixed,
      _ref$hiddenStyle = _ref.hiddenStyle,
      hiddenStyle = _ref$hiddenStyle === void 0 ? {
    opacity: 0
  } : _ref$hiddenStyle,
      props = _objectWithoutPropertiesLoose(_ref, ["el", "lerp", "lerpOffset", "children", "renderOrder", "priority", "margin", "inViewportMargin", "visible", "scissor", "debug", "setInViewportProp", "updateLayout", "positionFixed", "hiddenStyle"]);

  var inlineSceneRef = React.useCallback(function (node) {
    if (node !== null) {
      setScene(node);
    }
  }, []);
  var group = React.useRef();

  var _useState = React.useState(scissor ? new three.Scene() : null),
      scene = _useState[0],
      setScene = _useState[1];

  var _useState2 = React.useState(false),
      inViewport = _useState2[0],
      setInViewport = _useState2[1];

  var _useState3 = React.useState(null),
      scale = _useState3[0],
      setScale = _useState3[1];

  var _useThree = reactThreeFiber.useThree(),
      size = _useThree.size;

  var _useScrollRig = useScrollRig(),
      invalidate = _useScrollRig.invalidate,
      requestRender = _useScrollRig.requestRender,
      renderScissor = _useScrollRig.renderScissor;

  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  }); // get initial scrollY and listen for transient updates

  var scrollY = React.useRef(useCanvasStore.getState().scrollY);
  React.useEffect(function () {
    return useCanvasStore.subscribe(function (y) {
      scrollY.current = y;
      invalidate(); // Trigger render on scroll
    }, function (state) {
      return state.scrollY;
    });
  }, []); // non-reactive state

  var _transient = React.useRef({
    mounted: false,
    isFirstRender: true,
    bounds: {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      centerOffset: -1,
      x: 0,
      inViewport: false,
      progress: 0,
      viewport: 0,
      visibility: 0
    },
    prevBounds: {
      y: 0
    }
  }).current;
  React.useEffect(function () {
    _transient.mounted = true;
    return function () {
      return _transient.mounted = false;
    };
  }, []);
  React.useLayoutEffect(function () {
    // hide image - leave in DOM to measure and get events
    if (!(el == null ? void 0 : el.current)) return;

    if (debug) {
      el.current.style.opacity = 0.5;
    } else {
      Object.assign(el.current.style, _extends({}, hiddenStyle));
    }

    return function () {
      if (!(el == null ? void 0 : el.current)) return;
      Object.keys(hiddenStyle).forEach(function (key) {
        return el.current.style[key] = '';
      });
    };
  }, [el.current]);

  var updateSizeAndPosition = function updateSizeAndPosition() {
    if (!el || !el.current || !scene) {
      return;
    }

    var bounds = _transient.bounds,
        prevBounds = _transient.prevBounds;

    var _el$current$getBoundi = el.current.getBoundingClientRect(),
        top = _el$current$getBoundi.top,
        left = _el$current$getBoundi.left,
        width = _el$current$getBoundi.width,
        height = _el$current$getBoundi.height; // pixel bounds


    bounds.top = top + window.pageYOffset;
    bounds.left = left;
    bounds.width = width;
    bounds.height = height;
    bounds.centerOffset = size.height * 0.5 - height * 0.5; // scale in viewport units and pixel

    setScale({
      width: width * config.scaleMultiplier,
      height: height * config.scaleMultiplier,
      multiplier: config.scaleMultiplier,
      pixelWidth: width,
      pixelHeight: height,
      viewportWidth: size.width * config.scaleMultiplier,
      viewportHeight: size.height * config.scaleMultiplier
    }); // place horizontally

    bounds.x = left - size.width * 0.5 + width * 0.5;
    scene.position.x = bounds.x * config.scaleMultiplier; // prevents ghost lerp on first render

    if (_transient.isFirstRender) {
      prevBounds.y = top - bounds.centerOffset;
      _transient.isFirstRender = false;
    }

    invalidate(); // trigger render
  }; // Find bounding box & scale mesh on resize


  React.useLayoutEffect(function () {
    config.debug && console.log('ScrollScene', 'trigger updateSizeAndPosition()', scene);
    updateSizeAndPosition();
  }, [pageReflowCompleted, updateLayout, scene]); // RENDER FRAME

  reactThreeFiber.useFrame(function (_ref2) {
    var gl = _ref2.gl,
        camera = _ref2.camera,
        clock = _ref2.clock;
    if (!scene || !scale) return;
    var bounds = _transient.bounds,
        prevBounds = _transient.prevBounds; // Find new Y based on cached position and scroll

    var initialPos = config.subpixelScrolling ? bounds.top - bounds.centerOffset : Math.floor(bounds.top - bounds.centerOffset);
    var y = initialPos - scrollY.current; // if previously hidden and now visible, update previous position to not get ghost easing when made visible

    if (scene.visible && !bounds.inViewport) {
      prevBounds.y = y;
    } // frame delta


    var delta = Math.abs(prevBounds.y - y); // Lerp the distance to simulate easing

    var lerpY = three.MathUtils.lerp(prevBounds.y, y, (lerp || config.scrollLerp) + lerpOffset);
    var newY = config.subpixelScrolling ? lerpY : Math.floor(lerpY); // Abort if element not in screen

    var scrollMargin = inViewportMargin || size.height * 0.33;
    var isOffscreen = newY + size.height * 0.5 + scale.pixelHeight * 0.5 < -scrollMargin || newY + size.height * 0.5 - scale.pixelHeight * 0.5 > size.height + scrollMargin; // store top value for next frame

    bounds.inViewport = !isOffscreen;
    setInViewportProp && requestIdleCallback(function () {
      return _transient.mounted && setInViewport(!isOffscreen);
    });
    prevBounds.y = lerpY; // hide/show scene

    if (isOffscreen && scene.visible) {
      scene.visible = false;
    } else if (!isOffscreen && !scene.visible) {
      scene.visible = visible;
    }

    if (scene.visible) {
      // move scene
      if (!positionFixed) {
        scene.position.y = -newY * config.scaleMultiplier;
      }

      var positiveYUpBottom = size.height * 0.5 - (newY + scale.pixelHeight * 0.5); // inverse Y

      if (scissor) {
        renderScissor({
          gl: gl,
          scene: scene,
          camera: camera,
          left: bounds.left - margin,
          top: positiveYUpBottom - margin,
          width: bounds.width + margin * 2,
          height: bounds.height + margin * 2
        });
      } else {
        requestRender();
      } // calculate progress of passing through viewport (0 = just entered, 1 = just exited)


      var pxInside = bounds.top - newY - bounds.top + size.height - bounds.centerOffset;
      bounds.progress = three.MathUtils.mapLinear(pxInside, 0, size.height + scale.pixelHeight, 0, 1); // percent of total visible distance

      bounds.visibility = three.MathUtils.mapLinear(pxInside, 0, scale.pixelHeight, 0, 1); // percent of item height in view

      bounds.viewport = three.MathUtils.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
    } // render another frame if delta is large enough


    if (!isOffscreen && delta > config.scrollRestDelta) {
      invalidate();
    }
  }, priority);
  var content = /*#__PURE__*/React__default.createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && scale && /*#__PURE__*/React__default.createElement(DebugMesh, {
    scale: scale
  }), children && scene && scale && children(_extends({
    // inherited props
    el: el,
    lerp: lerp || config.scrollLerp,
    lerpOffset: lerpOffset,
    margin: margin,
    visible: visible,
    renderOrder: renderOrder,
    // new props
    scale: scale,
    state: _transient,
    // @deprecated
    scrollState: _transient.bounds,
    scene: scene,
    inViewport: inViewport,
    // useFrame render priority (in case children need to run after)
    priority: config.PRIORITY_SCISSORS + renderOrder
  }, props))); // portal if scissor or inline nested scene

  return scissor ? reactThreeFiber.createPortal(content, scene) : /*#__PURE__*/React__default.createElement("scene", {
    ref: inlineSceneRef
  }, content);
};

exports.ScrollScene = /*#__PURE__*/React__default.memo(exports.ScrollScene);
exports.ScrollScene.childPropTypes = _extends({}, exports.ScrollScene.propTypes, {
  scale: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  }),
  state: PropTypes.shape({
    bounds: PropTypes.shape({
      left: PropTypes.number,
      top: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
      inViewport: PropTypes.bool,
      progress: PropTypes.number,
      visibility: PropTypes.number,
      viewport: PropTypes.number
    })
  }),
  scene: PropTypes.object,
  // Parent scene,
  inViewport: PropTypes.bool // {x,y} to scale

});
exports.ScrollScene.priority = config.PRIORITY_SCISSORS;

var LAYOUT_LERP = 0.1;
/**
 * Render child element in portal and move using useFrame so we can and match the lerp of the VirtualScrollbar
 * TThe original el used for position
 * @author david@14islands.com
 */

var ScrollDomPortal = /*#__PURE__*/React.forwardRef(function (_ref, ref) {
  var el = _ref.el,
      portalEl = _ref.portalEl,
      _ref$lerp = _ref.lerp,
      lerp = _ref$lerp === void 0 ? config.scrollLerp : _ref$lerp,
      _ref$lerpOffset = _ref.lerpOffset,
      lerpOffset = _ref$lerpOffset === void 0 ? 0 : _ref$lerpOffset,
      children = _ref.children,
      _ref$zIndex = _ref.zIndex,
      zIndex = _ref$zIndex === void 0 ? 0 : _ref$zIndex,
      _ref$getOffset = _ref.getOffset,
      getOffset = _ref$getOffset === void 0 ? function () {} : _ref$getOffset,
      _ref$live = _ref.live,
      live = _ref$live === void 0 ? false : _ref$live,
      _ref$layoutLerp = _ref.layoutLerp,
      layoutLerp = _ref$layoutLerp === void 0 ? LAYOUT_LERP : _ref$layoutLerp,
      style = _ref.style;
  var copyEl = React.useRef();
  var local = React.useRef({
    needUpdate: false,
    offsetY: 0,
    offsetX: 0,
    raf: -1
  }).current;
  var bounds = React.useRef({
    top: 0,
    left: 0,
    width: 0,
    height: 0
  }).current;
  var prevBounds = React.useRef({
    top: 0,
    wasOffscreen: false
  }).current;
  var viewportHeight = windowSize.useWindowHeight();
  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  });

  var invalidate = function invalidate() {
    window.cancelAnimationFrame(local.raf);
    local.raf = window.requestAnimationFrame(frame);
  }; // get initial scrollY and listen for transient updates


  var scrollY = React.useRef(useCanvasStore.getState().scrollY);
  React.useEffect(function () {
    return useCanvasStore.subscribe(function (y) {
      scrollY.current = y;
      invalidate(); // Trigger render on scroll
    }, function (state) {
      return state.scrollY;
    });
  }, []); // Find initial position of proxy element on mount

  React.useEffect(function () {
    if (!el || !el.current) return;

    var _el$current$getBoundi = el.current.getBoundingClientRect(),
        top = _el$current$getBoundi.top,
        left = _el$current$getBoundi.left,
        width = _el$current$getBoundi.width,
        height = _el$current$getBoundi.height;

    bounds.top = top + window.pageYOffset;
    bounds.left = left;
    bounds.width = width;
    bounds.height = height;
    prevBounds.top = -window.pageYOffset;
    prevBounds.left = 0;
    prevBounds.x = 0;
    prevBounds.y = 0;
    copyEl.current.style.top = bounds.top + 'px';
    copyEl.current.style.left = left + 'px';
    copyEl.current.style.width = width + 'px';
    copyEl.current.style.height = height + 'px';
    copyEl.current.style.zIndex = zIndex;
    copyEl.current.style.position = 'fixed'; // trigger render

    local.needUpdate = true;
    invalidate();
  }, [el]); // TODO: decide if react to size.height to avoid mobile viewport scroll bugs
  // Update position on window resize or if `live` flag changes

  React.useEffect(function () {
    if (!el || !el.current) return;
    var id = requestIdleCallback(function () {
      if (!el || !el.current) return;
      var top = bounds.top,
          left = bounds.left;

      var _el$current$getBoundi2 = el.current.getBoundingClientRect(),
          newTop = _el$current$getBoundi2.top,
          newLeft = _el$current$getBoundi2.left,
          newHeight = _el$current$getBoundi2.height,
          newWidth = _el$current$getBoundi2.width;

      if (bounds.height !== newHeight) {
        copyEl.current.style.height = newHeight + 'px';
      }

      if (bounds.width !== newWidth) {
        copyEl.current.style.width = newWidth + 'px'; // TODO adjust left position if floating from right. possible to detect?
      }

      local.offsetY = newTop - top + window.pageYOffset;
      local.offsetX = newLeft - left;
      bounds.height = newHeight;
      bounds.width = newWidth;
      prevBounds.top = -window.pageYOffset; // trigger render

      local.needUpdate = true;
      invalidate();
    }, {
      timeout: 100
    });
    return function () {
      return cancelIdleCallback(id);
    };
  }, [live, pageReflowCompleted]); // RENDER FRAME

  var frame = function frame(_ref2) {
    var _getOffset, _getOffset2;

    var gl = _ref2.gl;
    var top = bounds.top,
        height = bounds.height; // get offset from resizing window + offset from callback function from parent

    var offsetX = local.offsetX + (live && ((_getOffset = getOffset()) == null ? void 0 : _getOffset.x) || 0);
    var offsetY = local.offsetY + (live && ((_getOffset2 = getOffset()) == null ? void 0 : _getOffset2.y) || 0); // add scroll value to bounds to get current position

    var scrollTop = -scrollY.current; // frame delta

    var deltaScroll = prevBounds.top - scrollTop;
    var delta = Math.abs(deltaScroll) + Math.abs(prevBounds.x - offsetX) + Math.abs(prevBounds.y - offsetY);

    if (!local.needUpdate && delta < config.scrollRestDelta) {
      // abort if no delta change
      return;
    } // Lerp the distance


    var lerpScroll = three.MathUtils.lerp(prevBounds.top, scrollTop, lerp + lerpOffset);
    var lerpX = three.MathUtils.lerp(prevBounds.x, offsetX, layoutLerp);
    var lerpY = three.MathUtils.lerp(prevBounds.y, offsetY, layoutLerp); // Abort if element not in screen

    var elTop = top + lerpScroll + lerpY;
    var isOffscreen = elTop + height < -100 || elTop > viewportHeight + 100; // Update DOM element position if in view, or if was in view last frame

    if (!isOffscreen) {
      if (copyEl.current) {
        Object.assign(copyEl.current.style, _extends({
          visibility: ''
        }, style, {
          transform: "translate3d(" + lerpX + "px, " + (lerpScroll + lerpY) + "px, 0)"
        }));
      }
    } else {
      if (copyEl.current) {
        copyEl.current.style.visibility = 'hidden';
      }
    } // store values for next frame


    prevBounds.top = lerpScroll;
    prevBounds.wasOffscreen = isOffscreen;
    prevBounds.x = lerpX;
    prevBounds.y = lerpY;
    local.needUpdate = false; // render another frame if delta is large enough

    if (!isOffscreen && delta > config.scrollRestDelta) {
      invalidate();
      local.needUpdate = true;
    }
  };

  if (!children) {
    return null;
  }

  var child = React__default.Children.only( /*#__PURE__*/React__default.cloneElement(children, {
    ref: copyEl
  }));

  if (portalEl) {
    return /*#__PURE__*/ReactDOM.createPortal(child, portalEl);
  }

  return child;
});
ScrollDomPortal.displayName = 'ScrollDomPortal';
ScrollDomPortal.propTypes = {
  el: PropTypes.object,
  // DOM element to track,
  portalEl: PropTypes.object,
  // DOM element to portal into,
  lerp: PropTypes.number,
  // Base lerp ratio
  lerpOffset: PropTypes.number,
  // Offset applied to `lerp`
  zIndex: PropTypes.number,
  // z-index to apply to the cloned element
  getOffset: PropTypes.func,
  // called for every frame to get {x,y} translation offset
  live: PropTypes.bool,
  layoutLerp: PropTypes.number,
  style: PropTypes.object
};

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted
 * @param {object} object THREE.js object3d
 */

var useCanvas = function useCanvas(object, deps, key) {
  if (deps === void 0) {
    deps = [];
  }

  var updateCanvas = useCanvasStore(function (state) {
    return state.updateCanvas;
  });
  var renderToCanvas = useCanvasStore(function (state) {
    return state.renderToCanvas;
  });
  var removeFromCanvas = useCanvasStore(function (state) {
    return state.removeFromCanvas;
  }); // auto generate uuid v4 key

  var uniqueKey = React.useMemo(function () {
    return key || three.MathUtils.generateUUID();
  }, []);
  React.useLayoutEffect(function () {
    renderToCanvas(uniqueKey, object);
    return function () {
      return removeFromCanvas(uniqueKey);
    };
  }, deps); // return function that can set new props on the canvas component

  var set = function set(props) {
    requestIdleCallback(function () {
      return updateCanvas(uniqueKey, props);
    }, {
      timeout: 100
    });
  };

  return set;
};

/**
 *  Reasons for why this exists:
 *
 *  - Make sure we don't load image twice - <img> tag already loads image, we need to make sure we get a cache hit
 *
 *  - Get responsive image size using currentSrc/src from the <img/> if available
 *
 *  - Consistent image loading across major browsers
 *    - Safari doesnt support createImageBitmap
 *    - Firefox createImageBitmap doesn't accept 2nd parameter for flipping
 *    - Firefox createImageBitmap seems to flip powerOf2 images by default - Chrome doesn't
 *
 */
// only use ImageBitmapLoader if supported and not FF for now

var supportsImageBitmap = typeof createImageBitmap !== 'undefined' && /Firefox/.test(navigator.userAgent) === false; // Override fetch to prefer cached images by default

if (typeof window !== 'undefined') {
  var realFetch = window.fetch;

  window.fetch = function (url, options) {
    if (options === void 0) {
      options = {
        cache: 'force-cache'
      };
    }

    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    return realFetch.apply(void 0, [url, options].concat(args));
  };
}

var useTextureLoader = function useTextureLoader(url, _temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$disableMipmaps = _ref.disableMipmaps,
      disableMipmaps = _ref$disableMipmaps === void 0 ? false : _ref$disableMipmaps;

  var _useState = React.useState(),
      texture = _useState[0],
      setTexture = _useState[1];

  var _useState2 = React.useState(),
      imageBitmap = _useState2[0],
      setImageBitmap = _useState2[1];

  var _useThree = reactThreeFiber.useThree(),
      gl = _useThree.gl;

  var isWebGL2 = gl.capabilities.isWebGL2;
  var useImageBitmap = isWebGL2 && supportsImageBitmap; // webgl2 supports NPOT images so we have less flipY logic

  if (typeof window !== 'undefined') {
    window._useImageBitmap = useImageBitmap;
  }

  var disposeBitmap = React.useCallback(function () {
    if (imageBitmap && imageBitmap.close) {
      imageBitmap.close();
      setImageBitmap(null);
    }
  }, [imageBitmap]);

  var loadTexture = function loadTexture(url) {
    var loader;

    if (useImageBitmap) {
      loader = new three.ImageBitmapLoader(); // Flip if texture

      loader.setOptions({
        imageOrientation: 'flipY',
        premultiplyAlpha: 'none'
      });
    } else {
      loader = new three.TextureLoader();
    }

    loader.setCrossOrigin('anonymous');
    loader.load(url, function (texture) {
      if (useImageBitmap) {
        setImageBitmap(imageBitmap);
        texture = new three.CanvasTexture(texture);
      } // max quality


      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      texture.encoding = three.sRGBEncoding;

      if (disableMipmaps) {
        texture.minFilter = three.LinearFilter;
        texture.generateMipmaps = false;
      } // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
      // eslint-disable-next-line no-useless-escape


      var isJPEG = url.search(/\.jpe?g($|\?)/i) > 0 || url.search(/^data\:image\/jpeg/) === 0;
      texture.format = isJPEG ? three.RGBFormat : three.RGBAFormat;
      setTexture(texture);
    }, null, function (err) {
      console.error('err', err);
    });
  };

  React.useEffect(function () {
    if (url) {
      loadTexture(url);
    }
  }, [url]);
  return [texture, disposeBitmap];
};
var useImgTagAsTexture = function useImgTagAsTexture(imgEl, opts) {
  var _useState3 = React.useState(null),
      url = _useState3[0],
      setUrl = _useState3[1];

  var _useTextureLoader = useTextureLoader(url, opts),
      texture = _useTextureLoader[0],
      disposeBitmap = _useTextureLoader[1];

  var loadTexture = function loadTexture() {
    imgEl.removeEventListener('load', loadTexture);
    setUrl(imgEl.currentSrc || imgEl.src);
  };

  React.useEffect(function () {
    // Wait for DOM <img> to finish loading so we get a cache hit from our upcoming fetch API request
    if (imgEl) {
      imgEl.addEventListener('load', loadTexture); // check if image was loaded from browser cache

      if (imgEl.complete) {
        loadTexture();
      }
    }
  }, [imgEl]);
  return [texture, disposeBitmap];
};

/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is rendered into a GL viewport matching the DOM position for better performance
 *
 * Adapted to react-three-fiber from https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html
 * @author david@14islands.com
 */

exports.ViewportScrollScene = function ViewportScrollScene(_ref) {
  var el = _ref.el,
      lerp = _ref.lerp,
      _ref$lerpOffset = _ref.lerpOffset,
      lerpOffset = _ref$lerpOffset === void 0 ? 0 : _ref$lerpOffset,
      children = _ref.children,
      _ref$margin = _ref.margin,
      margin = _ref$margin === void 0 ? 0 : _ref$margin,
      _ref$visible = _ref.visible,
      visible = _ref$visible === void 0 ? true : _ref$visible,
      renderOrder = _ref.renderOrder,
      _ref$priority = _ref.priority,
      priority = _ref$priority === void 0 ? config.PRIORITY_VIEWPORTS : _ref$priority,
      _ref$debug = _ref.debug,
      debug = _ref$debug === void 0 ? false : _ref$debug,
      _ref$setInViewportPro = _ref.setInViewportProp,
      setInViewportProp = _ref$setInViewportPro === void 0 ? false : _ref$setInViewportPro,
      _ref$renderOnTop = _ref.renderOnTop,
      renderOnTop = _ref$renderOnTop === void 0 ? false : _ref$renderOnTop,
      _ref$scaleMultiplier = _ref.scaleMultiplier,
      scaleMultiplier = _ref$scaleMultiplier === void 0 ? config.scaleMultiplier : _ref$scaleMultiplier,
      _ref$orthographic = _ref.orthographic,
      orthographic = _ref$orthographic === void 0 ? false : _ref$orthographic,
      _ref$hiddenStyle = _ref.hiddenStyle,
      hiddenStyle = _ref$hiddenStyle === void 0 ? {
    opacity: 0
  } : _ref$hiddenStyle,
      props = _objectWithoutPropertiesLoose(_ref, ["el", "lerp", "lerpOffset", "children", "margin", "visible", "renderOrder", "priority", "debug", "setInViewportProp", "renderOnTop", "scaleMultiplier", "orthographic", "hiddenStyle"]);

  var camera = React.useRef();

  var _useState = React.useState(function () {
    return new three.Scene();
  }),
      scene = _useState[0];

  var _useState2 = React.useState(false),
      inViewport = _useState2[0],
      setInViewport = _useState2[1];

  var _useState3 = React.useState(null),
      scale = _useState3[0],
      setScale = _useState3[1];

  var _useThree = reactThreeFiber.useThree(),
      size = _useThree.size;

  var _useScrollRig = useScrollRig(),
      invalidate = _useScrollRig.invalidate,
      renderViewport = _useScrollRig.renderViewport;

  var pageReflowCompleted = useCanvasStore(function (state) {
    return state.pageReflowCompleted;
  });

  var _useState4 = React.useState(0),
      cameraDistance = _useState4[0],
      setCameraDistance = _useState4[1]; // non-reactive state


  var _transient = React.useRef({
    mounted: false,
    bounds: {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      inViewport: false,
      progress: 0,
      viewport: 0,
      visibility: 0
    },
    prevBounds: {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    }
  }).current; // get initial scrollY and listen for transient updates

  var scrollY = React.useRef(useCanvasStore.getState().scrollY);
  React.useEffect(function () {
    return useCanvasStore.subscribe(function (y) {
      scrollY.current = y;
      invalidate(); // Trigger render on scroll
    }, function (state) {
      return state.scrollY;
    });
  }, []);
  React.useEffect(function () {
    _transient.mounted = true;
    return function () {
      _transient.mounted = false;
    };
  }, []); // El is rendered

  React.useLayoutEffect(function () {
    // hide image - leave in DOM to measure and get events
    if (!(el == null ? void 0 : el.current)) return;

    if (debug) {
      el.current.style.opacity = 0.5;
    } else {
      Object.assign(el.current.style, _extends({}, hiddenStyle));
    }

    return function () {
      if (!(el == null ? void 0 : el.current)) return;
      Object.keys(hiddenStyle).forEach(function (key) {
        return el.current.style[key] = '';
      });
    };
  }, [el.current]);

  var updateSizeAndPosition = function updateSizeAndPosition() {
    if (!el || !el.current) return;
    var bounds = _transient.bounds,
        prevBounds = _transient.prevBounds;

    var _el$current$getBoundi = el.current.getBoundingClientRect(),
        top = _el$current$getBoundi.top,
        left = _el$current$getBoundi.left,
        width = _el$current$getBoundi.width,
        height = _el$current$getBoundi.height; // pixel bounds


    bounds.top = top + window.pageYOffset;
    bounds.left = left;
    bounds.width = width;
    bounds.height = height;
    prevBounds.top = top;
    var viewportWidth = width * scaleMultiplier;
    var viewportHeight = height * scaleMultiplier; // scale in viewport units and pixel

    setScale({
      width: viewportWidth,
      height: viewportHeight,
      multiplier: scaleMultiplier,
      pixelWidth: width,
      pixelHeight: height,
      viewportWidth: size.width * scaleMultiplier,
      viewportHeight: size.height * scaleMultiplier
    });
    var cameraDistance = Math.max(viewportWidth, viewportHeight);
    setCameraDistance(cameraDistance);

    if (camera.current && !orthographic) {
      camera.current.aspect = (viewportWidth + margin * 2) / (viewportHeight + margin * 2);
      camera.current.fov = 2 * (180 / Math.PI) * Math.atan((viewportHeight + margin * 2) / (2 * cameraDistance));
      camera.current.updateProjectionMatrix(); // https://github.com/react-spring/react-three-fiber/issues/178
      // Update matrix world since the renderer is a frame late

      camera.current.updateMatrixWorld();
    }

    invalidate(); // trigger render
  }; // Find bounding box & scale mesh on resize


  React.useLayoutEffect(function () {
    updateSizeAndPosition();
  }, [pageReflowCompleted]); // RENDER FRAME

  reactThreeFiber.useFrame(function (_ref2) {
    var gl = _ref2.gl;
    if (!scene || !scale) return;
    var bounds = _transient.bounds,
        prevBounds = _transient.prevBounds; // add scroll value to bounds to get current position

    var initialPos = config.subpixelScrolling ? bounds.top : Math.floor(bounds.top);
    var topY = initialPos - scrollY.current; // frame delta

    var delta = Math.abs(prevBounds.top - topY); // Lerp the distance to simulate easing

    var lerpTop = three.MathUtils.lerp(prevBounds.top, topY, (lerp || config.scrollLerp) + lerpOffset);
    var newTop = config.subpixelScrolling ? lerpTop : Math.floor(lerpTop); // Abort if element not in screen

    var isOffscreen = newTop + bounds.height < -100 || newTop > size.height + 100; // store top value for next frame

    bounds.inViewport = !isOffscreen;
    setInViewportProp && requestIdleCallback(function () {
      return _transient.mounted && setInViewport(!isOffscreen);
    });
    prevBounds.top = lerpTop; // hide/show scene

    if (isOffscreen && scene.visible) {
      scene.visible = false;
    } else if (!isOffscreen && !scene.visible) {
      scene.visible = visible;
    } // Render scene to viewport using local camera and limit updates using scissor test
    // Performance improvement - faster than always rendering full canvas


    if (scene.visible) {
      var positiveYUpBottom = size.height - (newTop + bounds.height); // inverse Y

      renderViewport({
        gl: gl,
        scene: scene,
        camera: camera.current,
        left: bounds.left - margin,
        top: positiveYUpBottom - margin,
        width: bounds.width + margin * 2,
        height: bounds.height + margin * 2,
        renderOnTop: renderOnTop
      }); // calculate progress of passing through viewport (0 = just entered, 1 = just exited)

      var pxInside = bounds.top - newTop - bounds.top + size.height;
      bounds.progress = three.MathUtils.mapLinear(pxInside, 0, size.height + bounds.height, 0, 1); // percent of total visible distance

      bounds.visibility = three.MathUtils.mapLinear(pxInside, 0, bounds.height, 0, 1); // percent of item height in view

      bounds.viewport = three.MathUtils.mapLinear(pxInside, 0, size.height, 0, 1); // percent of window height scrolled since visible
    } // render another frame if delta is large enough


    if (!isOffscreen && delta > config.scrollRestDelta) {
      invalidate();
    }
  }, priority);
  return reactThreeFiber.createPortal( /*#__PURE__*/React__default.createElement(React__default.Fragment, null, !orthographic && /*#__PURE__*/React__default.createElement("perspectiveCamera", {
    ref: camera,
    position: [0, 0, cameraDistance],
    onUpdate: function onUpdate(self) {
      return self.updateProjectionMatrix();
    }
  }), orthographic && /*#__PURE__*/React__default.createElement("orthographicCamera", {
    ref: camera,
    position: [0, 0, cameraDistance],
    onUpdate: function onUpdate(self) {
      return self.updateProjectionMatrix();
    },
    left: scale.width / -2,
    right: scale.width / 2,
    top: scale.height / 2,
    bottom: scale.height / -2,
    far: cameraDistance * 2,
    near: 0.001
  }), /*#__PURE__*/React__default.createElement("group", {
    renderOrder: renderOrder
  }, (!children || debug) && scale && /*#__PURE__*/React__default.createElement(DebugMesh, {
    scale: scale
  }), children && scene && scale && children(_extends({
    // inherited props
    el: el,
    lerp: lerp || config.scrollLerp,
    lerpOffset: lerpOffset,
    margin: margin,
    visible: visible,
    renderOrder: renderOrder,
    // new props
    scale: scale,
    state: _transient,
    // @deprecated
    scrollState: _transient.bounds,
    "transient": _transient,
    scene: scene,
    camera: camera.current,
    inViewport: inViewport,
    // useFrame render priority (in case children need to run after)
    priority: config.PRIORITY_VIEWPORTS + renderOrder
  }, props)))), scene);
};

exports.ViewportScrollScene = /*#__PURE__*/React__default.memo(exports.ViewportScrollScene);
exports.ViewportScrollScene.childPropTypes = _extends({}, exports.ViewportScrollScene.propTypes, {
  scale: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  }),
  state: PropTypes.shape({
    bounds: PropTypes.shape({
      left: PropTypes.number,
      top: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
      inViewport: PropTypes.bool,
      progress: PropTypes.number
    })
  }),
  scene: PropTypes.object,
  // Parent scene,
  inViewport: PropTypes.bool // {x,y} to scale

});

var useDelayedEffect = function useDelayedEffect(fn, deps, ms) {
  if (ms === void 0) {
    ms = 0;
  }

  var timer;
  React.useEffect(function () {
    timer = setTimeout(fn, ms);
    return function () {
      return clearTimeout(timer);
    };
  }, deps);
};

/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted after initial delay (ms)
 * @param {object} object THREE.js object3d
 */

var useDelayedCanvas = function useDelayedCanvas(object, ms, deps, key) {
  if (deps === void 0) {
    deps = [];
  }

  var updateCanvas = useCanvasStore(function (state) {
    return state.updateCanvas;
  });
  var renderToCanvas = useCanvasStore(function (state) {
    return state.renderToCanvas;
  });
  var removeFromCanvas = useCanvasStore(function (state) {
    return state.removeFromCanvas;
  }); // auto generate uuid v4 key

  var uniqueKey = React.useMemo(function () {
    return key || three.MathUtils.generateUUID();
  }, []); // remove on unmount

  React.useLayoutEffect(function () {
    return function () {
      return removeFromCanvas(uniqueKey);
    };
  }, []);
  useDelayedEffect(function () {
    renderToCanvas(uniqueKey, object);
  }, deps, ms); // return function that can set new props on the canvas component

  var set = function set(props) {
    requestIdleCallback(function () {
      return updateCanvas(uniqueKey, props);
    }, {
      timeout: 100
    });
  };

  return set;
};

// if r3f frameloop should be used, pass these props:
// const R3F_HijackedScrollbar = props => {
//   return <HijackedScrollbar {...props} useFrameLoop={addEffect} invalidate={invalidate} />
// }

function map_range(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function _lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
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
      invalidate = _ref.invalidate,
      _ref$subpixelScrollin = _ref.subpixelScrolling,
      subpixelScrolling = _ref$subpixelScrollin === void 0 ? false : _ref$subpixelScrollin;
  var setVirtualScrollbar = useCanvasStore(function (state) {
    return state.setVirtualScrollbar;
  });
  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  });
  var pageReflowRequested = useCanvasStore(function (state) {
    return state.pageReflowRequested;
  });
  var setScrollY = useCanvasStore(function (state) {
    return state.setScrollY;
  });
  var y = React.useRef({
    current: 0,
    target: 0
  }).current;
  var roundedY = React.useRef(0);
  var scrolling = React.useRef(false);
  var documentHeight = React.useRef(0);
  var delta = React.useRef(0);
  var originalLerp = React.useRef(lerp || config.scrollLerp).current;

  var animate = function animate(ts) {
    if (!scrolling.current) return; // use internal target with floating point precision to make sure lerp is smooth

    var newTarget = _lerp(y.current, y.target, config.scrollLerp);

    delta.current = Math.abs(y.current - newTarget);
    y.current = newTarget; // round for scrollbar

    roundedY.current = config.subpixelScrolling ? y.current : Math.floor(y.current); // if (!useFrameLoop) {

    setScrollPosition(); // }
  };

  var scrollTo = function scrollTo(newY, lerp) {
    if (lerp === void 0) {
      lerp = originalLerp;
    }

    config.scrollLerp = lerp;
    y.target = Math.min(Math.max(newY, 0), documentHeight.current);

    if (!scrolling.current) {
      scrolling.current = true;
      invalidate ? invalidate() : window.requestAnimationFrame(animate);
    }

    setScrollY(y.target);
  }; // override window.scrollTo(0, targetY)


  React.useEffect(function () {
    window.__origScrollTo = window.scrollTo;
    window.__origScroll = window.scroll;

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
  }, [pageReflowRequested, location]);

  var setScrollPosition = function setScrollPosition() {
    if (!scrolling.current) return;

    window.__origScrollTo(0, roundedY.current); // Trigger optional callback here


    onUpdate && onUpdate(y); // TODO set scrolling.current = false here instead to avoid trailing scroll event

    if (delta.current <= (restDelta || config.scrollRestDelta)) {
      scrolling.current = false;
    } else {
      invalidate ? invalidate() : window.requestAnimationFrame(animate);
    }
  }; // update scroll position last
  // useEffect(() => {
  //   if (useFrameLoop) {
  //     return addAfterEffect(setScrollPosition)
  //   }
  // }, [])
  // disable subpixelScrolling for better visual sync with canvas


  React.useEffect(function () {
    var ssBefore = config.subpixelScrolling;
    config.subpixelScrolling = subpixelScrolling;
    return function () {
      config.subpixelScrolling = ssBefore;
    };
  }, []); // reset scroll on mount/unmount FIX history?!

  React.useEffect(function () {
    setScrollY(window.pageYOffset);
    return function () {
      setScrollY(window.pageYOffset);
    };
  }, []); // Check if we are using an external frame loop
  // useEffect(() => {
  //   if (useFrameLoop) {
  //     // update scroll target before everything else
  //     return useFrameLoop(animate)
  //   }
  // }, [useFrameLoop])

  var onScrollEvent = function onScrollEvent(e) {
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


  React.useEffect(function () {
    requestIdleCallback(function () {
      documentHeight.current = document.body.clientHeight - window.innerHeight;
    });
  }, [pageReflowRequested, location]);

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
    return function () {
      window.removeEventListener('wheel', onWheelEvent, {
        passive: false
      });
      window.removeEventListener('scroll', onScrollEvent);
      window.removeEventListener('touchstart', onTouchStart, {
        passive: false
      });
    };
  }, [disabled]);
  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, children({}), !config.hasGlobalCanvas && /*#__PURE__*/React__default.createElement(ResizeManager, {
    reflow: requestReflow
  }));
};

function _lerp$1(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

var FakeScroller = function FakeScroller(_ref) {
  var el = _ref.el,
      _ref$lerp = _ref.lerp,
      lerp = _ref$lerp === void 0 ? config.scrollLerp : _ref$lerp,
      _ref$restDelta = _ref.restDelta,
      restDelta = _ref$restDelta === void 0 ? config.scrollRestDelta : _ref$restDelta,
      onUpdate = _ref.onUpdate,
      _ref$threshold = _ref.threshold,
      threshold = _ref$threshold === void 0 ? 100 : _ref$threshold;
  var pageReflowRequested = useCanvasStore(function (state) {
    return state.pageReflowRequested;
  });
  var triggerReflowCompleted = useCanvasStore(function (state) {
    return state.triggerReflowCompleted;
  });
  var setScrollY = useCanvasStore(function (state) {
    return state.setScrollY;
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
      scrollHeight: 0
    },
    isResizing: false,
    sectionEls: null,
    sections: null
  }).current; // ANIMATION LOOP

  var run = function run() {
    state.frame = window.requestAnimationFrame(run);
    var scroll = state.scroll;
    scroll.current = _lerp$1(scroll.current, scroll.target, scroll.lerp);
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
    var height = state.bounds.height;
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
    state.scroll.target = window.pageYOffset;
    setScrollY(state.scroll.target); // restart animation loop if needed

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
    window.addEventListener('scroll', onScroll);
    return function () {
      return window.removeEventListener('scroll', onScroll);
    };
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
  }, [pageReflowRequested]);
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
      resizeOnHeight = _ref4.resizeOnHeight,
      children = _ref4.children,
      _ref4$scrollToTop = _ref4.scrollToTop,
      scrollToTop = _ref4$scrollToTop === void 0 ? false : _ref4$scrollToTop,
      rest = _objectWithoutPropertiesLoose(_ref4, ["disabled", "resizeOnHeight", "children", "scrollToTop"]);

  var ref = React.useRef();

  var _useState2 = React.useState(false),
      active = _useState2[0],
      setActive = _useState2[1]; // FakeScroller wont trigger resize without touching the store here..
  // due to code splitting maybe? two instances of the store?


  var requestReflow = useCanvasStore(function (state) {
    return state.requestReflow;
  });
  var setVirtualScrollbar = useCanvasStore(function (state) {
    return state.setVirtualScrollbar;
  }); // Optional: scroll to top when scrollbar mounts

  React.useLayoutEffect(function () {
    if (!scrollToTop) return; // __tl_back_button_pressed is set by `gatsby-plugin-transition-link`

    if (!window.__tl_back_button_pressed) {
      // make sure we start at top if scrollbar is active (transition)
      !disabled && window.scrollTo(0, 0);
    }
  }, [scrollToTop, disabled]);
  React.useEffect(function () {
    document.documentElement.classList.toggle('js-has-virtual-scrollbar', !disabled);
    setVirtualScrollbar(!disabled); // allow webgl components to find positions first on page load

    var timer = setTimeout(function () {
      setActive(!disabled); // tell GlobalCanvas that VirtualScrollbar is active

      config.hasVirtualScrollbar = !disabled;
    }, 0);
    return function () {
      clearTimeout(timer);
      config.hasVirtualScrollbar = false;
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
  }, rest)), !config.hasGlobalCanvas && /*#__PURE__*/React__default.createElement(ResizeManager, {
    reflow: requestReflow,
    resizeOnHeight: resizeOnHeight
  }));
};

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

exports.GlobalCanvas = GlobalCanvasIfSupported;
exports.HijackedScrollbar = HijackedScrollbar;
exports.PerspectiveCameraScene = exports.ViewportScrollScene;
exports.ScrollDomPortal = ScrollDomPortal;
exports.VirtualScrollbar = VirtualScrollbar;
exports.canvasStoreApi = canvasStoreApi;
exports.config = config;
exports.useCanvas = useCanvas;
exports.useCanvasStore = useCanvasStore;
exports.useDelayedCanvas = useDelayedCanvas;
exports.useImgTagAsTexture = useImgTagAsTexture;
exports.useScrollRig = useScrollRig;
exports.useScrollbar = useScrollbar;
exports.useTextureLoader = useTextureLoader;
exports.utils = utils;
