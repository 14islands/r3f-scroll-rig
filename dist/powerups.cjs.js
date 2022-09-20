'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var _objectWithoutProperties = require('@babel/runtime/helpers/objectWithoutProperties');
var React = require('react');
var three = require('three');
var fiber = require('@react-three/fiber');
var Text_js = require('@react-three/drei/core/Text.js');
var jsxRuntime = require('react/jsx-runtime');
var _typeof = require('@babel/runtime/helpers/typeof');
var create = require('zustand');
var _toConsumableArray = require('@babel/runtime/helpers/toConsumableArray');
var r3fScrollRig = require('@14islands/r3f-scroll-rig');
var mergeRefs = require('react-merge-refs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);
var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);
var create__default = /*#__PURE__*/_interopDefaultLegacy(create);
var _toConsumableArray__default = /*#__PURE__*/_interopDefaultLegacy(_toConsumableArray);
var mergeRefs__default = /*#__PURE__*/_interopDefaultLegacy(mergeRefs);

// Transient shared state for canvas components
// usContext() causes re-rendering which can drop frames
var config = {
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

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof__default["default"](key) === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (_typeof__default["default"](input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof__default["default"](res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

function ownKeys$4(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$4(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$4(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var useCanvasStore = create__default["default"](function (set) {
  return {
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
    clearGlobalRenderQueue: function clearGlobalRenderQueue() {
      return set(function () {
        return {
          globalRenderQueue: false
        };
      });
    },
    // true if WebGL initialized without errors
    isCanvasAvailable: true,
    // true if <VirtualScrollbar> is currently enabled
    hasVirtualScrollbar: false,
    // map of all components to render on the global canvas
    canvasChildren: {},
    // add component to canvas
    renderToCanvas: function renderToCanvas(key, mesh) {
      var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return set(function (_ref) {
        var canvasChildren = _ref.canvasChildren;

        // check if already mounted
        if (Object.getOwnPropertyDescriptor(canvasChildren, key)) {
          // increase usage count
          canvasChildren[key].instances += 1;
          canvasChildren[key].props.inactive = false;
          return {
            canvasChildren: canvasChildren
          };
        } else {
          // otherwise mount it
          var obj = _objectSpread$4(_objectSpread$4({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
            mesh: mesh,
            props: props,
            instances: 1
          }));

          return {
            canvasChildren: obj
          };
        }
      });
    },
    // pass new props to a canvas component
    updateCanvas: function updateCanvas(key, newProps) {
      return (// @ts-ignore
        set(function (_ref2) {
          var canvasChildren = _ref2.canvasChildren;
          if (!canvasChildren[key]) return;
          var _canvasChildren$key = canvasChildren[key],
              mesh = _canvasChildren$key.mesh,
              props = _canvasChildren$key.props,
              instances = _canvasChildren$key.instances;

          var obj = _objectSpread$4(_objectSpread$4({}, canvasChildren), {}, _defineProperty__default["default"]({}, key, {
            mesh: mesh,
            props: _objectSpread$4(_objectSpread$4({}, props), newProps),
            instances: instances
          })); // console.log('updateCanvas', key, { ...props, ...newProps })


          return {
            canvasChildren: obj
          };
        })
      );
    },
    // remove component from canvas
    removeFromCanvas: function removeFromCanvas(key) {
      var dispose = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      return set(function (_ref3) {
        var _canvasChildren$key2;

        var canvasChildren = _ref3.canvasChildren;

        // check if remove or reduce instances
        if (((_canvasChildren$key2 = canvasChildren[key]) === null || _canvasChildren$key2 === void 0 ? void 0 : _canvasChildren$key2.instances) > 1) {
          // reduce usage count
          canvasChildren[key].instances -= 1;
          return {
            canvasChildren: canvasChildren
          };
        } else {
          if (dispose) {
            // unmount since no longer used
            canvasChildren[key];
                var obj = _objectWithoutProperties__default["default"](canvasChildren, [key].map(_toPropertyKey)); // make a separate copy of the obj and omit


            return {
              canvasChildren: obj
            };
          } else {
            // or tell it to "act" hidden
            canvasChildren[key].instances = 0;
            canvasChildren[key].props.inactive = true;
            return {
              canvasChildren: canvasChildren
            };
          }
        }
      });
    },
    // Used to ask components to re-calculate their positions after a layout reflow
    pageReflow: 0,
    requestReflow: function requestReflow() {
      set(function (state) {
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
    scrollTo: function scrollTo(target) {
      return window.scrollTo(0, target);
    },
    onScroll: function onScroll() {
      return function () {};
    }
  };
});

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

var viewportSize = new three.Vector2(); // Flag that we need global rendering (full screen)

var requestRender = function requestRender() {
  var layers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [0];
  useCanvasStore.getState().globalRenderQueue = useCanvasStore.getState().globalRenderQueue || [0];
  useCanvasStore.getState().globalRenderQueue = [].concat(_toConsumableArray__default["default"](useCanvasStore.getState().globalRenderQueue), _toConsumableArray__default["default"](layers));
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
  var _autoClear = gl.autoClear;
  gl.autoClear = autoClear;
  gl.setScissor(left, top, width, height);
  gl.setScissorTest(true);
  camera.layers.set(layer);
  clearDepth && gl.clearDepth();
  gl.render(scene, camera);
  gl.setScissorTest(false);
  gl.autoClear = _autoClear;
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
      _ref2$scissor = _ref2.scissor,
      scissor = _ref2$scissor === void 0 ? true : _ref2$scissor,
      _ref2$autoClear = _ref2.autoClear,
      autoClear = _ref2$autoClear === void 0 ? false : _ref2$autoClear,
      _ref2$clearDepth = _ref2.clearDepth,
      clearDepth = _ref2$clearDepth === void 0 ? true : _ref2$clearDepth;
  if (!scene || !camera) return;
  var _autoClear = gl.autoClear;
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
var preloadScene = function preloadScene(scene, camera) {
  var layer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var callback = arguments.length > 3 ? arguments[3] : undefined;
  if (!scene || !camera) return;
  config$1.preloadQueue.push(function (gl) {
    gl.setScissorTest(false);
    setAllCulled(scene, false);
    camera.layers.set(layer);
    gl.render(scene, camera);
    setAllCulled(scene, true);
    callback && callback();
  }); // auto trigger a new frame for the preload

  fiber.invalidate();
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
  var debug = useCanvasStore(function (state) {
    return state.debug;
  });
  var scaleMultiplier = useCanvasStore(function (state) {
    return state.scaleMultiplier;
  });
  React.useEffect(function () {
    if (debug) {
      // @ts-ignore
      window._scrollRig = window._scrollRig || {}; // @ts-ignore

      window._scrollRig.reflow = requestReflow;
    }
  }, []);
  return {
    // boolean state
    debug: debug,
    isCanvasAvailable: isCanvasAvailable,
    hasVirtualScrollbar: hasVirtualScrollbar,
    // scale
    scaleMultiplier: scaleMultiplier,
    // render API
    preloadScene: preloadScene,
    requestRender: requestRender,
    renderScissor: renderScissor,
    renderViewport: renderViewport,
    // recalc all tracker positions
    reflow: requestReflow
  };
};

var _excluded$3 = ["el", "children", "material", "scale", "font", "fontOffsetY", "fontOffsetX", "overrideEmissive", "color"];

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$3(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var WebGLText = function WebGLText(_ref) {
  var el = _ref.el,
      children = _ref.children,
      material = _ref.material,
      scale = _ref.scale,
      font = _ref.font,
      _ref$fontOffsetY = _ref.fontOffsetY,
      fontOffsetY = _ref$fontOffsetY === void 0 ? 0 : _ref$fontOffsetY,
      _ref$fontOffsetX = _ref.fontOffsetX,
      fontOffsetX = _ref$fontOffsetX === void 0 ? 0 : _ref$fontOffsetX,
      _ref$overrideEmissive = _ref.overrideEmissive,
      overrideEmissive = _ref$overrideEmissive === void 0 ? false : _ref$overrideEmissive,
      color = _ref.color,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$3);

  var _useThree = fiber.useThree(),
      size = _useThree.size;

  var _useScrollRig = useScrollRig(),
      scaleMultiplier = _useScrollRig.scaleMultiplier;

  var _useMemo = React.useMemo(function () {
    if (!el.current) return {};
    var cs = window.getComputedStyle(el.current); // font size relative letter spacing

    var letterSpacing = (parseFloat(cs.letterSpacing) || 0) / parseFloat(cs.fontSize);
    var lineHeight = (parseFloat(cs.lineHeight) || 0) / parseFloat(cs.fontSize);
    var textColor = new three.Color(color || cs.color).convertSRGBToLinear();
    return {
      letterSpacing: letterSpacing,
      lineHeight: lineHeight,
      textColor: textColor,
      fontSize: parseFloat(cs.fontSize) * scaleMultiplier,
      textAlign: cs.textAlign
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, size, scale, color]),
      textColor = _useMemo.textColor,
      fontSize = _useMemo.fontSize,
      textAlign = _useMemo.textAlign,
      lineHeight = _useMemo.lineHeight,
      letterSpacing = _useMemo.letterSpacing; // recalc on resize


  React.useEffect(function () {
    if (material && overrideEmissive) {
      material.emissive = color;
    }
  }, [material, color, overrideEmissive]);
  var xOffset = 0;

  if (textAlign === 'left' || textAlign === 'start') {
    xOffset = scale[0] * -0.5;
  } else if (textAlign === 'right' || textAlign === 'end') {
    xOffset = scale[0] * 0.5;
  }

  var yOffset = scale ? scale[1] * 0.5 : size.height * 0.5;
  return /*#__PURE__*/jsxRuntime.jsx(Text_js.Text, _objectSpread$3(_objectSpread$3({
    fontSize: fontSize,
    maxWidth: scale ? scale[0] : size.width,
    lineHeight: lineHeight,
    textAlign: textAlign,
    letterSpacing: letterSpacing,
    overflowWrap: "break-word",
    font: font,
    color: textColor,
    anchorX: textAlign,
    anchorY: "top" // so text moves down if row breaks
    ,
    position: [xOffset + fontSize * fontOffsetX, yOffset + fontSize * fontOffsetY, 0] // font specific
    ,
    material: material
  }, props), {}, {
    children: children
  }));
};
var WebGLText$1 = WebGLText;

var _excluded$2 = ["el", "scale", "scrollState", "vertexShader", "fragmentShader", "invalidateFrameLoop", "widthSegments", "heightSegments"];

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$2(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var WebGLImage = function WebGLImage(_ref, ref) {
  var el = _ref.el,
      scale = _ref.scale,
      scrollState = _ref.scrollState,
      vertexShader = _ref.vertexShader,
      fragmentShader = _ref.fragmentShader,
      _ref$invalidateFrameL = _ref.invalidateFrameLoop,
      invalidateFrameLoop = _ref$invalidateFrameL === void 0 ? false : _ref$invalidateFrameL,
      _ref$widthSegments = _ref.widthSegments,
      widthSegments = _ref$widthSegments === void 0 ? 128 : _ref$widthSegments,
      _ref$heightSegments = _ref.heightSegments,
      heightSegments = _ref$heightSegments === void 0 ? 128 : _ref$heightSegments,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$2);

  var material = React.useRef();
  var mesh = React.useRef();

  var _useThree = fiber.useThree(),
      invalidate = _useThree.invalidate,
      gl = _useThree.gl,
      size = _useThree.size;

  var pixelRatio = fiber.useThree(function (s) {
    return s.viewport.dpr;
  });

  var _useScrollbar = r3fScrollRig.useScrollbar(),
      scroll = _useScrollbar.scroll;

  var _useScrollRig = r3fScrollRig.useScrollRig(),
      scaleMultiplier = _useScrollRig.scaleMultiplier;

  var texture = r3fScrollRig.useImageAsTexture(el);
  var uniforms = React.useMemo(function () {
    return {
      u_color: {
        value: new three.Color('black')
      },
      u_time: {
        value: 0
      },
      u_pixelRatio: {
        value: pixelRatio
      },
      u_progress: {
        value: 0
      },
      u_visibility: {
        value: 0
      },
      u_viewport: {
        value: 0
      },
      u_velocity: {
        value: 0
      },
      // scroll speed
      u_res: {
        value: new three.Vector2()
      },
      // screen dimensions
      u_rect: {
        value: new three.Vector2()
      },
      // DOM el dimensions
      u_size: {
        value: new three.Vector2()
      },
      // Texture dimensions
      u_texture: {
        value: null
      },
      u_loaded: {
        value: false
      },
      u_scaleMultiplier: {
        value: scaleMultiplier
      }
    };
  }, [pixelRatio]); // Fade in when texture loaded

  React.useEffect(function () {
    if (!texture) return;
    if (!material.current) return;
    material.current.uniforms.u_texture.value = texture;
    material.current.uniforms.u_size.value.set(texture.image.width, texture.image.height);
    material.current.uniforms.u_loaded.value = true;
  }, [texture, gl]);
  React.useEffect(function () {
    if (!material.current) return;
    material.current.uniforms.u_res.value.set(size.width, size.height);
    material.current.uniforms.u_rect.value.set(scale[0], scale[1]);
  }, [size, scale]);
  fiber.useFrame(function (_, delta) {
    if (!scrollState.inViewport || !mesh.current || !material.current) return;
    if (!material.current.uniforms.u_loaded.value) return;
    material.current.uniforms.u_time.value += delta; // update scale while animating too

    material.current.uniforms.u_rect.value.set(mesh.current.scale.x, mesh.current.scale.y); // px velocity

    material.current.uniforms.u_velocity.value = scroll.velocity; // percent of total visible distance that was scrolled (0 = just outside bottom of screen, 1 = just outside top of screen)

    material.current.uniforms.u_progress.value = scrollState.progress; // percent of item height in view

    material.current.uniforms.u_visibility.value = scrollState.visibility; // percent of window height scrolled since visible

    material.current.uniforms.u_viewport.value = scrollState.viewport;
    if (invalidateFrameLoop) invalidate();
  });
  var args = React.useMemo(function () {
    return [{
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    }];
  }, [vertexShader, fragmentShader]);
  return /*#__PURE__*/jsxRuntime.jsx(jsxRuntime.Fragment, {
    children: /*#__PURE__*/jsxRuntime.jsxs("mesh", _objectSpread$2(_objectSpread$2({
      ref: mergeRefs__default["default"]([mesh, ref])
    }, props), {}, {
      children: [/*#__PURE__*/jsxRuntime.jsx("planeGeometry", {
        attach: "geometry",
        args: [1, 1, widthSegments, heightSegments]
      }), /*#__PURE__*/jsxRuntime.jsx("shaderMaterial", {
        ref: material,
        args: args,
        transparent: true,
        uniforms: uniforms
      })]
    }))
  });
};

var WebGLImage$1 = /*#__PURE__*/React.forwardRef(WebGLImage);

var _excluded$1 = ["children", "speed"];

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var ParallaxGroup = function ParallaxGroup(_ref) {
  var children = _ref.children,
      scrollState = _ref.scrollState,
      parallax = _ref.parallax;
  var mesh = React.useRef();
  var size = fiber.useThree(function (s) {
    return s.size;
  });

  var _useScrollRig = r3fScrollRig.useScrollRig(),
      scaleMultiplier = _useScrollRig.scaleMultiplier;

  fiber.useFrame(function () {
    if (!scrollState.inViewport) return;
    var parallaxProgress = scrollState.progress * 2 - 1;
    mesh.current.position.y = parallax * parallaxProgress * scaleMultiplier * size.height;
  });
  return /*#__PURE__*/jsxRuntime.jsx("mesh", {
    ref: mesh,
    children: children
  });
};
/* Speed=1 is no parallax */

var ParallaxScrollScene = function ParallaxScrollScene(_ref2) {
  var _children = _ref2.children,
      _ref2$speed = _ref2.speed,
      speed = _ref2$speed === void 0 ? 1 : _ref2$speed,
      props = _objectWithoutProperties__default["default"](_ref2, _excluded$1);

  var extraMargin = 50; // add 50vh extra margin to avoid aggressive clipping

  var parallaxAmount = speed - 1;
  return /*#__PURE__*/jsxRuntime.jsx(r3fScrollRig.ScrollScene, _objectSpread$1(_objectSpread$1({
    scissor: false,
    inViewportMargin: "".concat(Math.max(0, 1 - 0.5) * 200 + extraMargin, "%")
  }, props), {}, {
    children: function children(props) {
      return /*#__PURE__*/jsxRuntime.jsx(ParallaxGroup, _objectSpread$1(_objectSpread$1({
        parallax: parallaxAmount
      }, props), {}, {
        children: _children(props)
      }));
    }
  }));
};
var ParallaxScrollScene$1 = ParallaxScrollScene;

var _excluded = ["scale"],
    _excluded2 = ["children", "stickyLerp", "scaleToViewport"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var StickyMesh = function StickyMesh(_ref) {
  var children = _ref.children,
      scrollState = _ref.scrollState,
      lerp = _ref.lerp,
      scale = _ref.scale,
      priority = _ref.priority,
      _ref$stickyLerp = _ref.stickyLerp,
      stickyLerp = _ref$stickyLerp === void 0 ? 1.0 : _ref$stickyLerp;
  var mesh = React.useRef();
  var local = React.useRef({
    lerp: 1
  }).current;
  fiber.useFrame(function () {
    if (!scrollState.inViewport) return; //  move to top of sticky area

    var yTop = scale[1] / 2 - scale.viewportHeight * 0.5;
    var yBottom = -scale[1] / 2 + scale.viewportHeight * 0.5;
    var ySticky = yTop - (scrollState.viewport - 1) * scale.viewportHeight;
    var y = mesh.current.position.y;
    var targetLerp; // enter

    if (scrollState.viewport < 1) {
      y = yTop;
      targetLerp = 1;
    } // sticky
    else if (scrollState.viewport > 1 && scrollState.visibility < 1) {
      y = ySticky;
      targetLerp = stickyLerp;
    } // exit
    else {
      y = yBottom; // TODO figure out soft limits
      // const f = Math.max(1, scrollState.visibility - 1)
      // y =  MathUtils.lerp(ySticky, yBottom, f)

      targetLerp = 1;
    }

    local.lerp = three.MathUtils.lerp(local.lerp, targetLerp, stickyLerp < 1 ? lerp : 1);
    mesh.current.position.y = three.MathUtils.lerp(mesh.current.position.y, y, local.lerp);
  }, priority + 1); // must happen after ScrollScene's useFrame to be buttery

  return /*#__PURE__*/jsxRuntime.jsx("mesh", {
    ref: mesh,
    children: children
  });
};
var renderAsSticky = function renderAsSticky(children, _ref2) {
  var stickyLerp = _ref2.stickyLerp,
      scaleToViewport = _ref2.scaleToViewport;
  return function (_ref3) {
    var scale = _ref3.scale,
        props = _objectWithoutProperties__default["default"](_ref3, _excluded);

    // set child's scale to 100vh/100vw instead of the full DOM el
    // the DOM el should be taller to indicate how far the scene stays sticky
    var childScale = scale;

    if (scaleToViewport) {
      childScale = _objectSpread(_objectSpread({}, scale), {}, {
        width: scale.viewportWidth,
        height: scale.viewportHeight
      });
    }

    return /*#__PURE__*/jsxRuntime.jsx(StickyMesh, _objectSpread(_objectSpread({
      scale: scale,
      stickyLerp: stickyLerp
    }, props), {}, {
      children: children(_objectSpread({
        scale: childScale
      }, props))
    }));
  };
};
var StickyScrollScene = function StickyScrollScene(_ref4) {
  var children = _ref4.children,
      stickyLerp = _ref4.stickyLerp,
      _ref4$scaleToViewport = _ref4.scaleToViewport,
      scaleToViewport = _ref4$scaleToViewport === void 0 ? true : _ref4$scaleToViewport,
      props = _objectWithoutProperties__default["default"](_ref4, _excluded2);

  return /*#__PURE__*/jsxRuntime.jsx(r3fScrollRig.ScrollScene, _objectSpread(_objectSpread({
    scissor: false
  }, props), {}, {
    children: renderAsSticky(children, {
      stickyLerp: stickyLerp,
      scaleToViewport: scaleToViewport
    })
  }));
};
var StickyScrollScene$1 = StickyScrollScene;

exports.ParallaxScrollScene = ParallaxScrollScene$1;
exports.StickyScrollScene = StickyScrollScene$1;
exports.WebGLImage = WebGLImage$1;
exports.WebGLText = WebGLText$1;
