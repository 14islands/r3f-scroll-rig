import { useMemo, useEffect, forwardRef, useRef } from 'react';
import { Color, Vector2 } from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei/core/Text.js';
import { useScrollRig, useScrollbar, useImageAsTexture, ScrollScene } from '@14islands/r3f-scroll-rig';
import { jsx, Fragment, jsxs } from 'react/jsx-runtime';
import mergeRefs from 'react-merge-refs';
import lerp from '@14islands/lerp';

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
    scaleMultiplier
  } = useScrollRig();
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
      fontSize: parseFloat(cs.fontSize) * scaleMultiplier,
      textAlign: cs.textAlign
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, size, scale, color, scaleMultiplier]); // recalc on resize

  useEffect(() => {
    if (material && overrideEmissive) {
      material.emissive = color;
    }
  }, [material, color, overrideEmissive]);
  let xOffset = 0;

  if (textAlign === 'left' || textAlign === 'start') {
    xOffset = scale[0] * -0.5;
  } else if (textAlign === 'right' || textAlign === 'end') {
    xOffset = scale[0] * 0.5;
  }

  const yOffset = scale ? scale[1] * 0.5 : size.height * 0.5;
  return /*#__PURE__*/jsx(Text, {
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
    material: material,
    ...props,
    children: children
  });
};
var WebGLText$1 = WebGLText;

const WebGLImage = (_ref, ref) => {
  let {
    el,
    scale,
    scrollState,
    vertexShader,
    fragmentShader,
    invalidateFrameLoop = false,
    widthSegments = 128,
    heightSegments = 128,
    ...props
  } = _ref;
  const material = useRef();
  const mesh = useRef();
  const {
    invalidate,
    gl,
    size
  } = useThree();
  const pixelRatio = useThree(s => s.viewport.dpr);
  const {
    scroll
  } = useScrollbar();
  const {
    scaleMultiplier
  } = useScrollRig();
  const texture = useImageAsTexture(el);
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
        value: new Vector2()
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

  useEffect(() => {
    if (!texture) return;
    if (!material.current) return;
    material.current.uniforms.u_texture.value = texture;
    material.current.uniforms.u_size.value.set(texture.image.width, texture.image.height);
    material.current.uniforms.u_loaded.value = true;
  }, [texture, gl]);
  useEffect(() => {
    if (!material.current) return;
    material.current.uniforms.u_res.value.set(size.width, size.height);
    material.current.uniforms.u_rect.value.set(scale === null || scale === void 0 ? void 0 : scale[0], scale === null || scale === void 0 ? void 0 : scale[1]);
  }, [size, scale]);
  useFrame((_, delta) => {
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
  const args = useMemo(() => [{
    vertexShader,
    fragmentShader
  }], [vertexShader, fragmentShader]);
  return /*#__PURE__*/jsx(Fragment, {
    children: /*#__PURE__*/jsxs("mesh", {
      ref: mergeRefs([mesh, ref]),
      ...props,
      children: [/*#__PURE__*/jsx("planeGeometry", {
        attach: "geometry",
        args: [1, 1, widthSegments, heightSegments]
      }), /*#__PURE__*/jsx("shaderMaterial", {
        ref: material,
        args: args,
        transparent: true,
        uniforms: uniforms
      })]
    })
  });
};

var WebGLImage$1 = /*#__PURE__*/forwardRef(WebGLImage);

const ParallaxGroup = _ref => {
  let {
    children,
    scrollState,
    parallax
  } = _ref;
  const mesh = useRef();
  const size = useThree(s => s.size);
  const {
    scaleMultiplier
  } = useScrollRig();
  useFrame(() => {
    if (!scrollState.inViewport) return;
    const parallaxProgress = scrollState.progress * 2 - 1;
    mesh.current.position.y = parallax * parallaxProgress * scaleMultiplier * size.height;
  });
  return /*#__PURE__*/jsx("mesh", {
    ref: mesh,
    children: children
  });
};
/* Speed=1 is no parallax */

const ParallaxScrollScene = _ref2 => {
  let {
    children,
    speed = 1,
    ...props
  } = _ref2;
  const extraMargin = 50; // add 50vh extra margin to avoid aggressive clipping

  const parallaxAmount = speed - 1;
  return /*#__PURE__*/jsx(ScrollScene, {
    scissor: false,
    inViewportMargin: `${Math.max(0, 1 - 0.5) * 200 + extraMargin}%`,
    ...props,
    children: props => /*#__PURE__*/jsx(ParallaxGroup, {
      parallax: parallaxAmount,
      ...props,
      children: children(props)
    })
  });
};
var ParallaxScrollScene$1 = ParallaxScrollScene;

const StickyChild = _ref => {
  let {
    children,
    childTop,
    childBottom,
    scrollState,
    parentScale,
    childScale,
    priority,
    stickyLerp = 1.0
  } = _ref;
  const group = useRef();
  const size = useThree(s => s.size);
  useFrame((_, delta) => {
    if (!scrollState.inViewport) return;
    const topOffset = childTop / size.height;
    const bottomOffset = childBottom / parentScale[1]; //  move to top of sticky area

    const yTop = parentScale[1] * 0.5 - childScale[1] * 0.5;
    const yBottom = -parentScale[1] * 0.5 + childScale[1] * 0.5;
    const ySticky = -childTop + yTop - (scrollState.viewport - 1) * size.height;
    let y = group.current.position.y; // enter

    if (scrollState.viewport + topOffset < 1) {
      y = yTop;
    } // sticky
    else if (scrollState.visibility - bottomOffset < 1) {
      y = ySticky;
    } // exit
    else {
      y = yBottom;
    }

    group.current.position.y = lerp(group.current.position.y, y, stickyLerp, delta);
  }, priority); // must happen after ScrollScene's useFrame to be buttery

  return /*#__PURE__*/jsx("group", {
    ref: group,
    children: children
  });
};
const renderAsSticky = (children, size, childStyle, _ref2) => {
  let {
    stickyLerp,
    fillViewport
  } = _ref2;
  return _ref3 => {
    let {
      scale,
      ...props
    } = _ref3;
    // set child's scale to 100vh/100vw instead of the full DOM el
    // the DOM el should be taller to indicate how far the scene stays sticky
    let childScale = [parseFloat(childStyle.width), parseFloat(childStyle.height), 1];
    let childTop = parseFloat(childStyle.top);
    let childBottom = size.height - childTop - childScale[1];

    if (fillViewport) {
      childScale = [size.width, size.height, 1];
      childTop = 0;
      childBottom = 0;
    }

    return /*#__PURE__*/jsx(StickyChild, {
      parentScale: scale,
      childScale: childScale,
      stickyLerp: stickyLerp,
      childTop: childTop,
      childBottom: childBottom,
      ...props,
      children: children({
        scale: childScale,
        ...props
      })
    });
  };
};
const StickyScrollScene = _ref4 => {
  let {
    children,
    track,
    stickyLerp,
    fillViewport,
    ...props
  } = _ref4;
  const size = useThree(s => s.size);
  const internalRef = useRef(track.current); // if tracked element is position:sticky, track the parent instead
  // we want to track the progress of the entire sticky area

  const childStyle = useMemo(() => {
    const style = getComputedStyle(track.current);

    if (style.position === 'sticky') {
      internalRef.current = track.current.parentElement;
    } else {
      console.error('StickyScrollScene: tracked element is not position:sticky');
    }

    return style;
  }, [track]);
  return /*#__PURE__*/jsx(ScrollScene, {
    track: internalRef,
    ...props,
    children: renderAsSticky(children, size, childStyle, {
      stickyLerp,
      fillViewport
    })
  });
};
var StickyScrollScene$1 = StickyScrollScene;

export { ParallaxScrollScene$1 as ParallaxScrollScene, StickyScrollScene$1 as StickyScrollScene, WebGLImage$1 as WebGLImage, WebGLText$1 as WebGLText };
