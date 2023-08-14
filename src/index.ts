import './styles/index.css'

// Components
export { GlobalCanvas } from './components/GlobalCanvas'
export { type ScrollSceneChildProps, ScrollScene } from './components/ScrollScene'
export { type ViewportScrollSceneChildProps, ViewportScrollScene } from './components/ViewportScrollScene'
export { UseCanvas } from './components/UseCanvas'

// Hooks
export { useScrollRig } from './hooks/useScrollRig'
export { useCanvas } from './hooks/useCanvas'
export { useScrollbar } from './scrollbar/useScrollbar'
export { useTracker } from './hooks/useTracker'

// Utils hooks
export { useImageAsTexture } from './hooks/useImageAsTexture'

// Scrollbar
export { default as SmoothScrollbar } from './components/R3FSmoothScrollbar'

// CSS class names for hiding stuff
// Matching css styles can be imported from @14islands/r3f-scrollr-rig/css
export const styles = {
  hidden: 'ScrollRig-visibilityHidden',
  hiddenWhenSmooth: 'ScrollRig-visibilityHidden ScrollRig-hiddenIfSmooth',
  transparentColor: 'ScrollRig-transparentColor',
  transparentColorWhenSmooth: 'ScrollRig-transparentColor ScrollRig-hiddenIfSmooth',
}

// Private-ish
// ----------------------------------
export { useCanvasStore } from './store'

// Types
export type { ScrollState } from './hooks/useTrackerTypes'
