export interface ScrollState {
  inViewport: boolean
  progress: number
  visibility: number
  viewport: number
}

export interface ScrollPosition {
  x: number
  y: number
  top: number
  left: number
  positiveYUpBottom: number
}

export interface ElementTracker {
  bounds: { top: number; bottom: number; left: number; right: number; width: number; height: number }
  scale: [width: number, height: number, depth: number]
  scrollState: ScrollState
  position: ScrollPosition
  inViewport: Boolean
  update: () => void
}

export interface ElementTrackerProps {
  track: RefObject<HTMLElement>
  rootMargin?: string
}

export type PropsOrElement = React.MutableRefObject<HTMLElement> | ElementTrackerProps
