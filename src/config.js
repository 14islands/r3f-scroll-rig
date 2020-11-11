// Transient shared state for canvas components
// usContext() causes re-rendering which can drop frames

export const config = {
  debug: false,
  fps: false,

  // Global lerp settings
  scrollLerp: 0.1, // Linear interpolation - high performance easing
  scrollRestDelta: 0.14, // min delta to trigger animation frame on scroll

  // Execution order for useFrames (highest = last render)
  PRIORITY_SCISSORS: 1,
  PRIORITY_VIEWPORTS: 1,
  PRIORITY_GLOBAL: 1001, // max renderOrder supported for scissors = 1000

  // Scaling
  scaleMultiplier: 1, // scale pixels vs viewport units (1:1 by default)

  // Global rendering props
  globalRender: false,
  preloadQueue: [],
  preRender: [],
  postRender: [],
  scissorQueue: [],
  viewportQueueBefore: [],
  viewportQueueAfter: [],
  hasVirtualScrollbar: false,
  hasGlobalCanvas: false,

  // portal for viewports
  portalEl: null,
}

export default config
