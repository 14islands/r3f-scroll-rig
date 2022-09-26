import { useEffect, useMemo, forwardRef, useRef } from 'react';
import { Vector2, Color } from 'three';
import { invalidate, useThree, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei/core/Text.js';
import { jsx, Fragment, jsxs } from 'react/jsx-runtime';
import create from 'zustand';
import { useScrollbar, useScrollRig as useScrollRig$1, useImageAsTexture, ScrollScene } from '@14islands/r3f-scroll-rig';
import mergeRefs from 'react-merge-refs';
import lerp from '@14islands/lerp';

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
  }, [el, size, scale, color]); // recalc on resize

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
  } = useScrollRig$1();
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
    material.current.uniforms.u_rect.value.set(scale[0], scale[1]);
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
  } = useScrollRig$1();
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
    scrollState,
    scale,
    priority,
    stickyLerp = 1.0
  } = _ref;
  const group = useRef();
  const size = useThree(s => s.size);
  useFrame((_, delta) => {
    if (!scrollState.inViewport) return; //  move to top of sticky area

    const yTop = scale[1] * 0.5 - size.height * 0.5;
    const yBottom = -scale[1] * 0.5 + size.height * 0.5;
    const ySticky = yTop - (scrollState.viewport - 1) * size.height;
    let y = group.current.position.y; // enter

    if (scrollState.viewport < 1) {
      y = yTop;
    } // sticky
    else if (scrollState.visibility < 1) {
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
const renderAsSticky = (children, size, _ref2) => {
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
      childScale = [size.width, size.height, 1];
    }

    return /*#__PURE__*/jsx(StickyChild, {
      scale: scale,
      stickyLerp: stickyLerp,
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
    scaleToViewport = true,
    ...props
  } = _ref4;
  const size = useThree(s => s.size);
  const internalRef = useRef(track.current); // if tracked element is position:sticky, track the parent instead
  // we want to track the progress of the entire sticky area

  useMemo(() => {
    const style = getComputedStyle(track.current);

    if (style.position === 'sticky') {
      internalRef.current = track.current.parentElement;
    }
  }, [track]);
  return /*#__PURE__*/jsx(ScrollScene, {
    track: internalRef,
    ...props,
    children: renderAsSticky(children, size, {
      stickyLerp,
      scaleToViewport
    })
  });
};
var StickyScrollScene$1 = StickyScrollScene;

export { ParallaxScrollScene$1 as ParallaxScrollScene, StickyScrollScene$1 as StickyScrollScene, WebGLImage$1 as WebGLImage, WebGLText$1 as WebGLText };
