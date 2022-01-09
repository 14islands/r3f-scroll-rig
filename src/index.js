// Public & battle-tested
// ----------------------------------
export { default as GlobalCanvas } from './canvas/GlobalCanvas'
export { ScrollScene } from './trackers/ScrollScene'
export { ViewportScrollScene } from './trackers/ViewportScrollScene'
export { ScrollDomPortal } from './trackers/ScrollDomPortal'
export { useScrollRig } from './hooks/useScrollRig'
export { useCanvas } from './hooks/useCanvas'
export { useScrollbar } from './scrollbar/useScrollbar'

// TODO: move to stdlib
export { useImgTagAsTexture, useTextureLoader } from './hooks/useImgTagAsTexture'

// TODO: should we deprecate Virtual and make Hijacked the default?
export { HijackedScrollbar as SmoothScrollbar } from './scrollbar/HijackedScrollbar'
export { HijackedScrollbar } from './scrollbar/HijackedScrollbar'
export { VirtualScrollbar } from './scrollbar/VirtualScrollbar'

// Public & somewhat experimental
// ----------------------------------
export { useDelayedCanvas } from './hooks/useDelayedCanvas'

// Private-ish
// ----------------------------------
export { useCanvasStore } from './store'
export { config as _config } from './config'
