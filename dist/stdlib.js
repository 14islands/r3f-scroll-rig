import _extends from '@babel/runtime/helpers/esm/extends';
import React, { useMemo, useEffect, useRef } from 'react';
import { Color, Vector2, MathUtils } from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei/core/Text';
import { useScrollRig, useImgTagAsTexture, ScrollScene, _config } from '@14islands/r3f-scroll-rig';
import lerp from '@14islands/lerp';

/**
 * Returns a WebGL Troika text mesh styled as the source DOM element
 */

const WebGLText = _ref => {
  let {
    el,
    children,
    material,
    scale,
    font,
    fontOffsetY = 0,
    fontOffsetX = 0,
    overrideEmissive = false,
    color,
    ...props
  } = _ref;
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
    return {
      letterSpacing,
      lineHeight,
      textColor,
      fontSize: parseFloat(cs.fontSize) * scale.multiplier,
      textAlign: cs.textAlign
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
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

const WebGLImage = _ref => {
  let {
    el,
    scale,
    scrollState,
    scene,
    vertexShader,
    fragmentShader,
    invalidateFrameLoop = false,
    widthSegments = 14,
    heightSegments = 14,
    ...props
  } = _ref;
  const material = useRef();
  const mesh = useRef();
  const {
    preloadScene
  } = useScrollRig();
  const {
    invalidate,
    camera,
    size
  } = useThree();
  const pixelRatio = useThree(s => s.viewport.dpr);
  const [texture] = useImgTagAsTexture(el.current);
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
      // scroll speed
      u_res: {
        value: new Vector2(size.width, size.height)
      },
      // screen dimensions
      u_rect: {
        value: new Vector2()
      },
      // DOM el dimensions
      u_size: {
        value: new Vector2()
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

  useEffect(() => {
    if (!texture) return;
    material.current.uniforms.u_texture.value = texture;
    material.current.uniforms.u_size.value.set(texture.image.width, texture.image.height);
    preloadScene(scene, camera); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture]);
  useEffect(() => {
    material.current.uniforms.u_res.value.set(size.width, size.height);
    material.current.uniforms.u_rect.value.set(scale.width, scale.height);
  }, [size, scale]);
  useFrame((_, delta) => {
    if (!scrollState.inViewport) return;
    material.current.uniforms.u_time.value += delta; // px velocity

    const targetVel = MathUtils.clamp(scrollState.deltaY / 200, -1, 1);
    material.current.uniforms.u_velocity.value = lerp(material.current.uniforms.u_velocity.value, targetVel, 0.1, delta); // percent of total visible distance that was scrolled (0 = just outside bottom of screen, 1 = just outside top of screen)

    material.current.uniforms.u_progress.value = scrollState.progress; // percent of item height in view

    material.current.uniforms.u_visibility.value = scrollState.visibility; // percent of window height scrolled since visible

    material.current.uniforms.u_viewport.value = scrollState.viewport;
    if (invalidateFrameLoop) invalidate();
  });
  return /*#__PURE__*/React.createElement("mesh", _extends({
    ref: mesh,
    scale: [scale.width, scale.height, 1]
  }, props), /*#__PURE__*/React.createElement("planeBufferGeometry", {
    attach: "geometry",
    args: [1, 1, widthSegments, heightSegments]
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

const ParallaxMesh = _ref => {
  let {
    children,
    scrollState,
    scale,
    parallax
  } = _ref;
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
const ParallaxScrollScene = _ref2 => {
  let {
    children,
    parallax,
    stickyLerp,
    ...props
  } = _ref2;
  return /*#__PURE__*/React.createElement(ScrollScene, _extends({
    scissor: false
  }, props, {
    inViewportMargin: Math.abs(parallax * 3)
  }), props => /*#__PURE__*/React.createElement(ParallaxMesh, _extends({
    parallax: parallax
  }, props), children(props)));
};

const StickyMesh = _ref => {
  let {
    children,
    scrollState,
    lerp,
    scale,
    priority,
    stickyLerp = 1.0
  } = _ref;
  const mesh = useRef();
  const local = useRef({
    lerp: 1
  }).current;
  useFrame(() => {
    if (!scrollState.inViewport) return; //  move to top of sticky area

    let yTop = scale.height / 2 - scale.viewportHeight * 0.5;
    let yBottom = -scale.height / 2 + scale.viewportHeight * 0.5;
    let ySticky = yTop - (scrollState.viewport - 1) * scale.viewportHeight;
    let y = mesh.current.position.y;
    let targetLerp; // enter

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

    local.lerp = MathUtils.lerp(local.lerp, targetLerp, stickyLerp < 1 ? lerp : 1);
    mesh.current.position.y = MathUtils.lerp(mesh.current.position.y, y, local.lerp);
  }, priority + 1); // must happen after ScrollScene's useFrame to be buttery

  return /*#__PURE__*/React.createElement("mesh", {
    ref: mesh
  }, children);
};
const renderAsSticky = (children, _ref2) => {
  let {
    stickyLerp,
    scaleToViewport
  } = _ref2;
  return _ref3 => {
    let {
      scale,
      ...props
    } = _ref3;
    // set child's scale to 100vh/100vw instead of the full DOM el
    // the DOM el should be taller to indicate how far the scene stays sticky
    let childScale = scale;

    if (scaleToViewport) {
      childScale = { ...scale,
        width: scale.viewportWidth,
        height: scale.viewportHeight
      };
    }

    return /*#__PURE__*/React.createElement(StickyMesh, _extends({
      scale: scale,
      stickyLerp: stickyLerp
    }, props), children({
      scale: childScale,
      ...props
    }));
  };
};
const StickyScrollScene = _ref4 => {
  let {
    children,
    stickyLerp,
    scaleToViewport = true,
    ...props
  } = _ref4;
  return /*#__PURE__*/React.createElement(ScrollScene, _extends({
    scissor: false
  }, props), renderAsSticky(children, {
    stickyLerp,
    scaleToViewport
  }));
};

const DprScaler = () => {
  const size = useThree(s => s.size);
  const setDpr = useThree(s => s.setDpr);
  useEffect(() => {
    const devicePixelRatio = window.devicePixelRatio || 1;

    if (devicePixelRatio > 1) {
      const MAX_PIXEL_RATIO = 2.5; // TODO Can we allow better resolution on more powerful computers somehow?
      // Calculate avg frame rate and lower pixelRatio on demand?
      // scale down when scrolling fast?

      let scale;
      scale = size.width > 1500 ? 0.9 : 1.0;
      scale = size.width > 1900 ? 0.8 : scale;
      const dpr = Math.max(1.0, Math.min(MAX_PIXEL_RATIO, devicePixelRatio * scale));
      _config.debug && console.info('DprScaler', 'Set dpr', dpr);
      setDpr(dpr);
    }
  }, [size]);
  return null;
};

export { DprScaler, ParallaxScrollScene, StickyScrollScene, WebGLImage, WebGLText };
