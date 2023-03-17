// Global config
import type { Scene, Camera, WebGLRenderer } from 'three'

type PreloadCallback = (gl: WebGLRenderer, scene: Scene, camera: Camera) => void

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
