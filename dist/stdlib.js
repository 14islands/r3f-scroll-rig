import _extends from '@babel/runtime/helpers/esm/extends';
import _objectWithoutPropertiesLoose from '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose';
import React, { useMemo, useEffect, useRef } from 'react';
import { Color, Vector2 } from 'three';
import { useThree, useFrame } from 'react-three-fiber';
import { Text } from '@react-three/drei/core/Text';
import { useScrollRig, useImgTagAsTexture, ScrollScene } from '@14islands/r3f-scroll-rig';

/**
 * Returns a WebGL Troika text mesh styled as the source DOM element
 */

const WebGLText = (_ref) => {
  let {
    el,
    children,
    material,
    scale,
    font,
    fontOffsetY = 0,
    fontOffsetX = 0,
    overrideEmissive = false,
    color
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["el", "children", "material", "scale", "font", "fontOffsetY", "fontOffsetX", "overrideEmissive", "color"]);

  const {
    size
  } = useThree();
  const {
    textColor,
    fontSize,
    textAlign,
    lineHeight,
    letterSpacing
  } = useMemo(() => {
    if (!el.current) return {};
    const cs = window.getComputedStyle(el.current); // font size relative letter spacing

    const letterSpacing = (parseFloat(cs.letterSpacing) || 0) / parseFloat(cs.fontSize);
    const lineHeight = (parseFloat(cs.lineHeight) || 0) / parseFloat(cs.fontSize);
    const textColor = new Color(color || cs.color).convertSRGBToLinear();
    return _extends({}, cs, {
      letterSpacing,
      lineHeight,
      color: textColor,
      fontSize: parseFloat(cs.fontSize) * scale.multiplier
    }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, size, scale, color]); // recalc on resize

  useEffect(() => {
    if (material && overrideEmissive) {
      material.emissive = color;
    }
  }, [material, color, overrideEmissive]);
  let xOffset = 0;

  if (textAlign === 'left' || textAlign === 'start') {
    xOffset = scale.width * -0.5;
  } else if (textAlign === 'right' || textAlign === 'end') {
    xOffset = scale.width * 0.5;
  }

  const yOffset = scale ? scale.height * 0.5 : size.height * 0.5;
  return /*#__PURE__*/React.createElement(Text, _extends({
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

const WebGLImage = ({
  image,
  scale,
  scrollState,
  scene,
  vertexShader,
  fragmentShader,
  invalidateFrameLoop = false,
  widthSegments = 128,
  heightSegments = 128
}) => {
  const material = useRef();
  const mesh = useRef();
  const {
    invalidate,
    pixelRatio,
    preloadScene
  } = useScrollRig();
  const {
    camera,
    size
  } = useThree();
  const [texture] = useImgTagAsTexture(image.current);
  const uniforms = useMemo(() => {
    return {
      u_color: {
        value: new Color('black')
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
        value: new Vector2(size.width, size.height)
      },
      u_texture: {
        value: texture
      },
      u_scaleMultiplier: {
        value: scale.multiplier
      }
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Preload when texture finished loading

  useEffect(() => {
    material.current.uniforms.u_texture.value = texture;
    preloadScene(scene, camera); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture]);
  useEffect(() => {
    material.current.uniforms.u_res.value.set(size.width, size.height);
  }, [size]);
  useFrame(() => {
    if (!scrollState.inViewport) return;
    material.current.uniforms.u_time.value += 0.01; // px velocity
    // material.current.uniforms.u_velocity.value = scrollState.velocity
    // percent of total visible distance that was scrolled (0 = just outside bottom of screen, 1 = just outside top of screen)

    material.current.uniforms.u_progress.value = scrollState.progress; // percent of item height in view

    material.current.uniforms.u_visibility.value = scrollState.visibility; // percent of window height scrolled since visible

    material.current.uniforms.u_viewport.value = scrollState.viewport;
    if (invalidateFrameLoop) invalidate();
  });
  return /*#__PURE__*/React.createElement("mesh", {
    ref: mesh
  }, /*#__PURE__*/React.createElement("planeBufferGeometry", {
    attach: "geometry",
    args: [scale.width, scale.height, widthSegments, heightSegments]
  }), /*#__PURE__*/React.createElement("shaderMaterial", {
    ref: material,
    attach: "material",
    args: [{
      vertexShader,
      fragmentShader
    }],
    transparent: true,
    uniforms: uniforms
  }));
};

const ParallaxMesh = ({
  children,
  scrollState,
  scale,
  parallax
}) => {
  const mesh = useRef();
  useFrame(() => {
    if (!scrollState.inViewport) return;
    const parallaxProgress = scrollState.progress * 2 - 1;
    mesh.current.position.y = parallax * parallaxProgress * scale.multiplier;
  });
  return /*#__PURE__*/React.createElement("mesh", {
    ref: mesh
  }, children);
};
const ParallaxScrollScene = (_ref) => {
  let {
    children,
    parallax
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["children", "parallax", "stickyLerp"]);

  return /*#__PURE__*/React.createElement(ScrollScene, _extends({
    scissor: false
  }, props, {
    inViewportMargin: Math.abs(parallax * 3)
  }), props => /*#__PURE__*/React.createElement(ParallaxMesh, _extends({
    parallax: parallax
  }, props), children(props)));
};

export { ParallaxScrollScene, ParallaxScrollScene as StickyScrollScene, WebGLImage, WebGLText };
