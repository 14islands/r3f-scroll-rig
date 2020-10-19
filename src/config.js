// Transient shared state for canvas components
// usContext() causes re-rendering which can drop frames

export const config = {
  debug: false,
  planeSize: 1,

  scrollLerp: 0.1, // Linear interpolation - high performance easing
  scrollRestDelta: 0.14, // min delta to trigger animation frame on scroll

  // Render priorities (highest = last render)
  PRIORITY_GLOBAL: 100,
  PRIORITY_VIEWPORTS: 10,
  PRIORITY_SCISSORS: 20,

  // Global rendering props
  globalRender: false,
  hasRenderQueue: false,
  preloadQueue: [],
  preRender: [],
  postRender: [],
  scissorQueue: [],
  viewportQueue: [],
  fbo: {},
  hasVirtualScrollbar: false,
  hasGlobalCanvas: false,

  portalEl: null,

  // z-index for <groups>
  ORDER_TRANSITION: 6,
  ORDER_LAB_CTA: 5,
  ORDER_LAB_FG_BUBBLES: 4,
  ORDER_LAB_CONTENT: 3,
  ORDER_LAB_BG_BUBBLES: 2,
}

export default config
