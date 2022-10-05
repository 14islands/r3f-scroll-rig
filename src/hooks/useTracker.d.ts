import { vec3 } from 'vecn'
export interface ScrollState {
  inViewport: boolean
  progress: number
  visibility: number
  viewport: number
}

export type Rect = {
  top: number
  bottom: number
  left: number
  right: number
  width: number
  height: number
  x: number
  y: number
}
export type Bounds = Rect & {
  positiveYUpBottom: number
}

export interface ElementTracker {
  rect: Rect | undefined
  bounds: Bounds
  scale: vec3 | undefined
  scrollState: ScrollState
  position: vec3
  inViewport: Boolean
  update: () => void
}

export interface ElementTrackerProps {
  track: RefObject<HTMLElement>
  rootMargin?: string
  threshold?: number
  autoUpdate?: boolean
}

export type PropsOrElement = React.MutableRefObject<HTMLElement> | ElementTrackerProps
