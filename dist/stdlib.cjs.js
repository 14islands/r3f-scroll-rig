'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('@babel/runtime/helpers/extends'));
var _objectWithoutPropertiesLoose = _interopDefault(require('@babel/runtime/helpers/objectWithoutPropertiesLoose'));
var React = require('react');
var React__default = _interopDefault(React);
var three = require('three');
var reactThreeFiber = require('react-three-fiber');
var Text = require('@react-three/drei/core/Text');
var r3fScrollRig = require('@14islands/r3f-scroll-rig');

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
      props = _objectWithoutPropertiesLoose(_ref, ["el", "children", "material", "scale", "font", "fontOffsetY", "fontOffsetX", "overrideEmissive"]);

  var _useThree = reactThreeFiber.useThree(),
      size = _useThree.size;

  var _useMemo = React.useMemo(function () {
    if (!el.current) return {};
    var cs = window.getComputedStyle(el.current); // font size relative letter spacing

    var letterSpacing = (parseFloat(cs.letterSpacing) || 0) / parseFloat(cs.fontSize);
    var lineHeight = (parseFloat(cs.lineHeight) || 0) / parseFloat(cs.fontSize);
    return _extends({}, cs, {
      letterSpacing: letterSpacing,
      lineHeight: lineHeight,
      color: new three.Color(cs.color).convertSRGBToLinear(),
      fontSize: parseFloat(cs.fontSize) * scale.multiplier
    }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, size, scale]),
      color = _useMemo.color,
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
  textAlign === ('left' ) && (xOffset = scale.width * -0.5);
  textAlign === ('right' ) && (xOffset = scale.width * 0.5);
  r3fScrollRig.config.debug && console.log('WebGLText', textAlign, xOffset, scale.width);
  var yOffset = scale ? scale.height * 0.5 : size.height * 0.5;
  return /*#__PURE__*/React__default.createElement(Text.Text, _extends({
    fontSize: fontSize,
    maxWidth: scale ? scale.width : size.width,
    lineHeight: lineHeight,
    textAlign: textAlign,
    letterSpacing: letterSpacing,
    font: font,
    color: color,
    anchorX: textAlign,
    anchorY: "top" // so text moves down if row breaks
    ,
    position: [xOffset + fontSize * fontOffsetX, yOffset + fontSize * fontOffsetY, 0] // font specific
    ,
    material: material
  }, props), children);
};

var WebGLImage = function WebGLImage(_ref) {
  var image = _ref.image,
      scale = _ref.scale,
      scrollState = _ref.scrollState,
      scene = _ref.scene,
      vertexShader = _ref.vertexShader,
      fragmentShader = _ref.fragmentShader,
      _ref$invalidateFrameL = _ref.invalidateFrameLoop,
      invalidateFrameLoop = _ref$invalidateFrameL === void 0 ? false : _ref$invalidateFrameL,
      _ref$widthSegments = _ref.widthSegments,
      widthSegments = _ref$widthSegments === void 0 ? 128 : _ref$widthSegments,
      _ref$heightSegments = _ref.heightSegments,
      heightSegments = _ref$heightSegments === void 0 ? 128 : _ref$heightSegments;
  var material = React.useRef();
  var mesh = React.useRef();

  var _useScrollRig = r3fScrollRig.useScrollRig(),
      invalidate = _useScrollRig.invalidate,
      pixelRatio = _useScrollRig.pixelRatio,
      preloadScene = _useScrollRig.preloadScene;

  var _useThree = reactThreeFiber.useThree(),
      camera = _useThree.camera,
      size = _useThree.size;

  var _useImgTagAsTexture = r3fScrollRig.useImgTagAsTexture(image.current),
      texture = _useImgTagAsTexture[0];

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
      u_res: {
        value: new three.Vector2(size.width, size.height)
      },
      u_texture: {
        value: texture
      },
      u_scaleMultiplier: {
        value: scale.multiplier
      }
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Preload when texture finished loading

  React.useEffect(function () {
    material.current.uniforms.u_texture.value = texture;
    preloadScene(scene, camera); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture]);
  React.useEffect(function () {
    material.current.uniforms.u_res.value.set(size.width, size.height);
  }, [size]);
  reactThreeFiber.useFrame(function () {
    if (!scrollState.inViewport) return;
    material.current.uniforms.u_time.value += 0.01; // px velocity
    // material.current.uniforms.u_velocity.value = scrollState.velocity
    // percent of total visible distance that was scrolled (0 = just outside bottom of screen, 1 = just outside top of screen)

    material.current.uniforms.u_progress.value = scrollState.progress; // percent of item height in view

    material.current.uniforms.u_visibility.value = scrollState.visibility; // percent of window height scrolled since visible

    material.current.uniforms.u_viewport.value = scrollState.viewport;
    if (invalidateFrameLoop) invalidate();
  });
  return /*#__PURE__*/React__default.createElement("mesh", {
    ref: mesh
  }, /*#__PURE__*/React__default.createElement("planeBufferGeometry", {
    attach: "geometry",
    args: [scale.width, scale.height, widthSegments, heightSegments]
  }), /*#__PURE__*/React__default.createElement("shaderMaterial", {
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

var ParallaxMesh = function ParallaxMesh(_ref) {
  var children = _ref.children,
      scrollState = _ref.scrollState,
      scale = _ref.scale,
      parallax = _ref.parallax;
  var mesh = React.useRef();
  reactThreeFiber.useFrame(function () {
    if (!scrollState.inViewport) return;
    var parallaxProgress = scrollState.progress * 2 - 1;
    mesh.current.position.y = parallax * parallaxProgress * scale.multiplier;
  });
  return /*#__PURE__*/React__default.createElement("mesh", {
    ref: mesh
  }, children);
};
var ParallaxScrollScene = function ParallaxScrollScene(_ref2) {
  var children = _ref2.children,
      parallax = _ref2.parallax,
      stickyLerp = _ref2.stickyLerp,
      props = _objectWithoutPropertiesLoose(_ref2, ["children", "parallax", "stickyLerp"]);

  return /*#__PURE__*/React__default.createElement(r3fScrollRig.ScrollScene, _extends({
    scissor: false
  }, props, {
    inViewportMargin: Math.abs(parallax * 3)
  }), function (props) {
    return /*#__PURE__*/React__default.createElement(ParallaxMesh, _extends({
      parallax: parallax
    }, props), children(props));
  });
};

exports.ParallaxScrollScene = ParallaxScrollScene;
exports.StickyScrollScene = ParallaxScrollScene;
exports.WebGLImage = WebGLImage;
exports.WebGLText = WebGLText;
