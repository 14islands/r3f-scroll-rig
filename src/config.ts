// Global config

import { WebGLRenderer } from 'three'

type PreloadCallback = (gl: WebGLRenderer) => void

export const config = {
  // Execution order for useFrames (highest = last render)
  PRIORITY_PRELOAD: 0,
  PRIORITY_SCISSORS: 1,
  PRIORITY_VIEWPORTS: 1,
  PRIORITY_GLOBAL: 1000,

  DEFAULT_SCALE_MULTIPLIER: 1,

  // Global rendering props
  preloadQueue: [] as PreloadCallback[],
}

export default config
