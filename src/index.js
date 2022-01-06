// Public & battle-tested
// ----------------------------------
export { default as GlobalCanvas } from './canvas/GlobalCanvas'
export { ScrollScene } from './trackers/ScrollScene'
export { ScrollDomPortal } from './trackers/ScrollDomPortal'
export { useScrollRig } from './hooks/useScrollRig'
export { useCanvas } from './hooks/useCanvas'
export { useImgTagAsTexture, useTextureLoader } from './hooks/useImgTagAsTexture'

// Public & somewhat experimental
// ----------------------------------
export { ViewportScrollScene } from './trackers/ViewportScrollScene'
export { ViewportScrollScene as PerspectiveCameraScene } from './trackers/ViewportScrollScene'
export { useDelayedCanvas } from './hooks/useDelayedCanvas'
export { HijackedScrollbar as SmoothScrollbar } from './scrollbar/HijackedScrollbar'

// will be deprecated
export { HijackedScrollbar } from './scrollbar/HijackedScrollbar'
export { HijackedScrollbar as VirtualScrollbar } from './scrollbar/HijackedScrollbar'

// Public & battle-tested
// ----------------------------------
export { useScrollbar } from './scrollbar/useScrollbar'

// Private-ish
// ----------------------------------
export { useCanvasStore } from './store'
export { config as _config } from './config'
