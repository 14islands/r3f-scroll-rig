import './styles/index.css'

// Components
export { GlobalCanvas } from './components/GlobalCanvas'
export { ScrollScene } from './components/ScrollScene'
export { ViewportScrollScene } from './components/ViewportScrollScene'
export { UseCanvas } from './components/UseCanvas'

// Hooks
export { useScrollRig } from './hooks/useScrollRig'
export { useCanvas } from './hooks/useCanvas'
export { useScrollbar } from './scrollbar/useScrollbar'
export { useTracker } from './hooks/useTracker'

// Utils hooks
export { useImageAsTexture } from './hooks/useImageAsTexture'

// Scrollbar
export { SmoothScrollbar } from './scrollbar/SmoothScrollbar'

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
