'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _extends = require('@babel/runtime/helpers/extends');
var _objectWithoutProperties = require('@babel/runtime/helpers/objectWithoutProperties');
var React = require('react');
var three = require('three');
var fiber = require('@react-three/fiber');
var Text = require('@react-three/drei/core/Text');
var _slicedToArray = require('@babel/runtime/helpers/slicedToArray');
var r3fScrollRig = require('@14islands/r3f-scroll-rig');
var lerp = require('@14islands/lerp');
var _defineProperty = require('@babel/runtime/helpers/defineProperty');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _extends__default = /*#__PURE__*/_interopDefaultLegacy(_extends);
var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);
var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var _slicedToArray__default = /*#__PURE__*/_interopDefaultLegacy(_slicedToArray);
var lerp__default = /*#__PURE__*/_interopDefaultLegacy(lerp);
var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);

var _excluded$3 = ["el", "children", "material", "scale", "font", "fontOffsetY", "fontOffsetX", "overrideEmissive", "color"];
/**
 * Returns a WebGL Troika text mesh styled as the source DOM element
 */

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

  var _useMemo = React.useMemo(function () {
    if (!el.current) return {};
    var cs = window.getComputedStyle(el.current); // font size relative letter spacing

    // font size relative letter spacing
    var letterSpacing = (parseFloat(cs.letterSpacing) || 0) / parseFloat(cs.fontSize);
    var lineHeight = (parseFloat(cs.lineHeight) || 0) / parseFloat(cs.fontSize);
    var textColor = new three.Color(color || cs.color).convertSRGBToLinear();
    return {
      letterSpacing: letterSpacing,
      lineHeight: lineHeight,
      textColor: textColor,
      fontSize: parseFloat(cs.fontSize) * scale.multiplier,
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
    xOffset = scale.width * -0.5;
  } else if (textAlign === 'right' || textAlign === 'end') {
    xOffset = scale.width * 0.5;
  }

  var yOffset = scale ? scale.height * 0.5 : size.height * 0.5;
  return /*#__PURE__*/React__default["default"].createElement(Text.Text, _extends__default["default"]({
    fontSize: fontSize,
    maxWidth: scale ? scale.width : size.width,
    lineHeight: lineHeight,
    textAlign: textAlign,
    letterSpacing: letterSpacing,
    font: font,
    color: textColor,
    anchorX: textAlign,
    anchorY: "top" // so text moves down if row breaks
    ,
    position: [xOffset + fontSize * fontOffsetX, yOffset + fontSize * fontOffsetY, 0] // font specific
    ,
    material: material
  }, props), children);
};

var _excluded$2 = ["el", "scale", "scrollState", "scene", "vertexShader", "fragmentShader", "invalidateFrameLoop", "widthSegments", "heightSegments"];

var WebGLImage = function WebGLImage(_ref) {
  var el = _ref.el,
      scale = _ref.scale,
      scrollState = _ref.scrollState,
      scene = _ref.scene,
      vertexShader = _ref.vertexShader,
      fragmentShader = _ref.fragmentShader,
      _ref$invalidateFrameL = _ref.invalidateFrameLoop,
      invalidateFrameLoop = _ref$invalidateFrameL === void 0 ? false : _ref$invalidateFrameL,
      _ref$widthSegments = _ref.widthSegments,
      widthSegments = _ref$widthSegments === void 0 ? 14 : _ref$widthSegments,
      _ref$heightSegments = _ref.heightSegments,
      heightSegments = _ref$heightSegments === void 0 ? 14 : _ref$heightSegments,
      props = _objectWithoutProperties__default["default"](_ref, _excluded$2);

  var material = React.useRef();
  var mesh = React.useRef();

  var _useScrollRig = r3fScrollRig.useScrollRig(),
      preloadScene = _useScrollRig.preloadScene;

  var _useThree = fiber.useThree(),
      invalidate = _useThree.invalidate,
      camera = _useThree.camera,
      size = _useThree.size;

  var pixelRatio = fiber.useThree(function (s) {
    return s.viewport.dpr;
  });

  var _useImgTagAsTexture = r3fScrollRig.useImgTagAsTexture(el.current),
      _useImgTagAsTexture2 = _slicedToArray__default["default"](_useImgTagAsTexture, 1),
      texture = _useImgTagAsTexture2[0];

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
        value: new three.Vector2(size.width, size.height)
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
        value: texture
      },
      u_scaleMultiplier: {
        value: scale.multiplier
      }
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // // Preload when texture finished loading

  React.useEffect(function () {
    if (!texture) return;
    material.current.uniforms.u_texture.value = texture;
    material.current.uniforms.u_size.value.set(texture.image.width, texture.image.height);
    preloadScene(scene, camera); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture]);
  React.useEffect(function () {
    material.current.uniforms.u_res.value.set(size.width, size.height);
    material.current.uniforms.u_rect.value.set(scale.width, scale.height);
  }, [size, scale]);
  fiber.useFrame(function (_, delta) {
    if (!scrollState.inViewport) return;
    material.current.uniforms.u_time.value += delta; // px velocity

    var targetVel = three.MathUtils.clamp(scrollState.deltaY / 200, -1, 1);
    material.current.uniforms.u_velocity.value = lerp__default["default"](material.current.uniforms.u_velocity.value, targetVel, 0.1, delta); // percent of total visible distance that was scrolled (0 = just outside bottom of screen, 1 = just outside top of screen)

    material.current.uniforms.u_progress.value = scrollState.progress; // percent of item height in view

    material.current.uniforms.u_visibility.value = scrollState.visibility; // percent of window height scrolled since visible

    material.current.uniforms.u_viewport.value = scrollState.viewport;
    if (invalidateFrameLoop) invalidate();
  });
  return /*#__PURE__*/React__default["default"].createElement("mesh", _extends__default["default"]({
    ref: mesh,
    scale: [scale.width, scale.height, 1]
  }, props), /*#__PURE__*/React__default["default"].createElement("planeBufferGeometry", {
    attach: "geometry",
    args: [1, 1, widthSegments, heightSegments]
  }), /*#__PURE__*/React__default["default"].createElement("shaderMaterial", {
    ref: material,
    attach: "material",
    args: [{
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    }],
    transparent: true,
    uniforms: uniforms
  }));
};

var _excluded$1 = ["children", "parallax", "stickyLerp"];

var ParallaxMesh = function ParallaxMesh(_ref) {
  var children = _ref.children,
      scrollState = _ref.scrollState,
      scale = _ref.scale,
      parallax = _ref.parallax;
  var mesh = React.useRef();
  fiber.useFrame(function () {
    if (!scrollState.inViewport) return;
    var parallaxProgress = scrollState.progress * 2 - 1;
    mesh.current.position.y = parallax * parallaxProgress * scale.multiplier;
  });
  return /*#__PURE__*/React__default["default"].createElement("mesh", {
    ref: mesh
  }, children);
};
var ParallaxScrollScene = function ParallaxScrollScene(_ref2) {
  var children = _ref2.children,
      parallax = _ref2.parallax;
      _ref2.stickyLerp;
      var props = _objectWithoutProperties__default["default"](_ref2, _excluded$1);

  return /*#__PURE__*/React__default["default"].createElement(r3fScrollRig.ScrollScene, _extends__default["default"]({
    scissor: false
  }, props, {
    inViewportMargin: Math.abs(parallax * 3)
  }), function (props) {
    return /*#__PURE__*/React__default["default"].createElement(ParallaxMesh, _extends__default["default"]({
      parallax: parallax
    }, props), children(props));
  });
};

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

    var yTop = scale.height / 2 - scale.viewportHeight * 0.5;
    var yBottom = -scale.height / 2 + scale.viewportHeight * 0.5;
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

  return /*#__PURE__*/React__default["default"].createElement("mesh", {
    ref: mesh
  }, children);
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

    return /*#__PURE__*/React__default["default"].createElement(StickyMesh, _extends__default["default"]({
      scale: scale,
      stickyLerp: stickyLerp
    }, props), children(_objectSpread({
      scale: childScale
    }, props)));
  };
};
var StickyScrollScene = function StickyScrollScene(_ref4) {
  var children = _ref4.children,
      stickyLerp = _ref4.stickyLerp,
      _ref4$scaleToViewport = _ref4.scaleToViewport,
      scaleToViewport = _ref4$scaleToViewport === void 0 ? true : _ref4$scaleToViewport,
      props = _objectWithoutProperties__default["default"](_ref4, _excluded2);

  return /*#__PURE__*/React__default["default"].createElement(r3fScrollRig.ScrollScene, _extends__default["default"]({
    scissor: false
  }, props), renderAsSticky(children, {
    stickyLerp: stickyLerp,
    scaleToViewport: scaleToViewport
  }));
};

var DprScaler = function DprScaler() {
  var size = fiber.useThree(function (s) {
    return s.size;
  });
  var setDpr = fiber.useThree(function (s) {
    return s.setDpr;
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
      var dpr = Math.max(1.0, Math.min(MAX_PIXEL_RATIO, devicePixelRatio * scale));
      r3fScrollRig._config.debug && console.info('DprScaler', 'Set dpr', dpr);
      setDpr(dpr);
    }
  }, [size]);
  return null;
};

exports.DprScaler = DprScaler;
exports.ParallaxScrollScene = ParallaxScrollScene;
exports.StickyScrollScene = StickyScrollScene;
exports.WebGLImage = WebGLImage;
exports.WebGLText = WebGLText;
