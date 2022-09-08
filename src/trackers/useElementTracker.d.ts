export interface ScrollState {
  inViewport: boolean
  progress: number
  visibility: number
  viewport: number
  deltaY: number
}

export interface ScrollPosition {
  x: number
  y: number
  top: number
  left: number
  positiveYUpBottom: number
  realY: number
  realX: number
}

export interface ElementTracker {
  bounds: { top: number; left: number; width: number; height: number }
  scale: [width: number, height: number, depth: number]
  getScrollState: () => ScrollState
  getPosition: () => ScrollPosition
  inViewport: Boolean
}

export interface ElementTrackerProps {
  element: React.MutableRefObject<HTMLElement>
  lerp?: number
  inViewportMargin?: number
  onPositionChange?: () => void
}

export type PropsOrElement = React.MutableRefObject<HTMLElement> | ElementTrackerProps
