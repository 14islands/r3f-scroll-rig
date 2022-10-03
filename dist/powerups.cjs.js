'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var _objectWithoutProperties = require('@babel/runtime/helpers/objectWithoutProperties');
var react = require('react');
var three = require('three');
var fiber = require('@react-three/fiber');
var Text_js = require('@react-three/drei/core/Text.js');
var r3fScrollRig = require('@14islands/r3f-scroll-rig');
var jsxRuntime = require('react/jsx-runtime');
var mergeRefs = require('react-merge-refs');
var lerp = require('@14islands/lerp');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);
var mergeRefs__default = /*#__PURE__*/_interopDefaultLegacy(mergeRefs);
var lerp__default = /*#__PURE__*/_interopDefaultLegacy(lerp);

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

  var _useScrollRig = r3fScrollRig.useScrollRig(),
      scaleMultiplier = _useScrollRig.scaleMultiplier;

  var _useMemo = react.useMemo(function () {
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
  }, [el, size, scale, color, scaleMultiplier]),
      textColor = _useMemo.textColor,
      fontSize = _useMemo.fontSize,
      textAlign = _useMemo.textAlign,
      lineHeight = _useMemo.lineHeight,
      letterSpacing = _useMemo.letterSpacing; // recalc on resize


  react.useEffect(function () {
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

  var material = react.useRef();
  var mesh = react.useRef();

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
  var uniforms = react.useMemo(function () {
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

  react.useEffect(function () {
    if (!texture) return;
    if (!material.current) return;
    material.current.uniforms.u_texture.value = texture;
    material.current.uniforms.u_size.value.set(texture.image.width, texture.image.height);
    material.current.uniforms.u_loaded.value = true;
  }, [texture, gl]);
  react.useEffect(function () {
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
  var args = react.useMemo(function () {
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

var WebGLImage$1 = /*#__PURE__*/react.forwardRef(WebGLImage);

var _excluded$1 = ["children", "speed"];

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var ParallaxGroup = function ParallaxGroup(_ref) {
  var children = _ref.children,
      scrollState = _ref.scrollState,
      parallax = _ref.parallax;
  var mesh = react.useRef();
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
    _excluded2 = ["children", "track", "stickyLerp", "fillViewport"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var StickyChild = function StickyChild(_ref) {
  var children = _ref.children,
      childTop = _ref.childTop,
      childBottom = _ref.childBottom,
      scrollState = _ref.scrollState,
      parentScale = _ref.parentScale,
      childScale = _ref.childScale,
      priority = _ref.priority,
      _ref$stickyLerp = _ref.stickyLerp,
      stickyLerp = _ref$stickyLerp === void 0 ? 1.0 : _ref$stickyLerp;
  var group = react.useRef();
  var size = fiber.useThree(function (s) {
    return s.size;
  });
  fiber.useFrame(function (_, delta) {
    if (!scrollState.inViewport) return;
    var topOffset = childTop / size.height;
    var bottomOffset = childBottom / parentScale[1]; //  move to top of sticky area

    var yTop = parentScale[1] * 0.5 - childScale[1] * 0.5;
    var yBottom = -parentScale[1] * 0.5 + childScale[1] * 0.5;
    var ySticky = -childTop + yTop - (scrollState.viewport - 1) * size.height;
    var y = group.current.position.y; // enter

    if (scrollState.viewport + topOffset < 1) {
      y = yTop;
    } // sticky
    else if (scrollState.visibility - bottomOffset < 1) {
      y = ySticky;
    } // exit
    else {
      y = yBottom;
    }

    group.current.position.y = lerp__default["default"](group.current.position.y, y, stickyLerp, delta);
  }, priority); // must happen after ScrollScene's useFrame to be buttery

  return /*#__PURE__*/jsxRuntime.jsx("group", {
    ref: group,
    children: children
  });
};
var renderAsSticky = function renderAsSticky(children, size, childStyle, _ref2) {
  var stickyLerp = _ref2.stickyLerp,
      fillViewport = _ref2.fillViewport;
  return function (_ref3) {
    var scale = _ref3.scale,
        props = _objectWithoutProperties__default["default"](_ref3, _excluded);

    // set child's scale to 100vh/100vw instead of the full DOM el
    // the DOM el should be taller to indicate how far the scene stays sticky
    var childScale = [parseFloat(childStyle.width), parseFloat(childStyle.height), 1];
    var childTop = parseFloat(childStyle.top);
    var childBottom = size.height - childTop - childScale[1];

    if (fillViewport) {
      childScale = [size.width, size.height, 1];
      childTop = 0;
      childBottom = 0;
    }

    return /*#__PURE__*/jsxRuntime.jsx(StickyChild, _objectSpread(_objectSpread({
      parentScale: scale,
      childScale: childScale,
      stickyLerp: stickyLerp,
      childTop: childTop,
      childBottom: childBottom
    }, props), {}, {
      children: children(_objectSpread({
        scale: childScale
      }, props))
    }));
  };
};
var StickyScrollScene = function StickyScrollScene(_ref4) {
  var children = _ref4.children,
      track = _ref4.track,
      stickyLerp = _ref4.stickyLerp,
      fillViewport = _ref4.fillViewport,
      props = _objectWithoutProperties__default["default"](_ref4, _excluded2);

  var size = fiber.useThree(function (s) {
    return s.size;
  });
  var internalRef = react.useRef(track.current); // if tracked element is position:sticky, track the parent instead
  // we want to track the progress of the entire sticky area

  var childStyle = react.useMemo(function () {
    var style = getComputedStyle(track.current);

    if (style.position === 'sticky') {
      internalRef.current = track.current.parentElement;
    } else {
      console.error('StickyScrollScene: tracked element is not position:sticky');
    }

    return style;
  }, [track]);
  return /*#__PURE__*/jsxRuntime.jsx(r3fScrollRig.ScrollScene, _objectSpread(_objectSpread({
    track: internalRef
  }, props), {}, {
    children: renderAsSticky(children, size, childStyle, {
      stickyLerp: stickyLerp,
      fillViewport: fillViewport
    })
  }));
};
var StickyScrollScene$1 = StickyScrollScene;

exports.ParallaxScrollScene = ParallaxScrollScene$1;
exports.StickyScrollScene = StickyScrollScene$1;
exports.WebGLImage = WebGLImage$1;
exports.WebGLText = WebGLText$1;
