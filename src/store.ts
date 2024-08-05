import create from 'zustand'
import { config } from './config'
import type Lenis from 'lenis'

import { ScrollCallback, ScrollData } from './scrollbar/SmoothScrollbarTypes'

interface ScrollRigStore {
  debug: boolean
  scaleMultiplier: number
  globalRender: boolean
  globalPriority: number
  globalClearDepth: boolean
  globalRenderQueue: false | any[]
  clearGlobalRenderQueue: () => void
  isCanvasAvailable: boolean
  hasSmoothScrollbar: boolean
  canvasChildren: Record<string, any | undefined>
  updateCanvas: (key: string, newProps: any) => void
  renderToCanvas: (key: string, mesh: any, props: any) => void
  removeFromCanvas: (key: string, dispose: boolean) => void
  pageReflow: number
  requestReflow: () => void
  scroll: ScrollData
  __lenis: Lenis | undefined
  scrollTo: (target: any) => void
  onScroll: (cb: ScrollCallback) => () => void
}

const useCanvasStore = create<ScrollRigStore>((set) => ({
  // //////////////////////////////////////////////////////////////////////////
  // GLOBAL ScrollRig STATE
  // //////////////////////////////////////////////////////////////////////////
  debug: false,
  scaleMultiplier: config.DEFAULT_SCALE_MULTIPLIER,

  globalRender: true,
  globalPriority: config.PRIORITY_GLOBAL,
  globalClearDepth: false,

  globalRenderQueue: false,
  clearGlobalRenderQueue: () => set(() => ({ globalRenderQueue: false })),

  // true if WebGL initialized without errors
  isCanvasAvailable: false,

  // true if <VirtualScrollbar> is currently enabled
  hasSmoothScrollbar: false,

  // map of all components to render on the global canvas
  canvasChildren: {},

  // add component to canvas
  renderToCanvas: (key, mesh, props = {}) =>
    set(({ canvasChildren }) => {
      // check if already mounted
      if (Object.getOwnPropertyDescriptor(canvasChildren, key)) {
        // increase usage count
        canvasChildren[key].instances += 1
        canvasChildren[key].props.inactive = false
        return { canvasChildren }
      } else {
        // otherwise mount it
        const obj = { ...canvasChildren, [key]: { mesh, props, instances: 1 } }
        return { canvasChildren: obj }
      }
    }),

  // pass new props to a canvas component
  updateCanvas: (key, newProps) =>
    // @ts-ignore
    set(({ canvasChildren }) => {
      if (!canvasChildren[key]) return
      const {
        [key]: { mesh, props, instances },
      } = canvasChildren
      const obj = {
        ...canvasChildren,
        [key]: { mesh, props: { ...props, ...newProps }, instances },
      }
      // console.log('updateCanvas', key, { ...props, ...newProps })
      return { canvasChildren: obj }
    }),

  // remove component from canvas
  removeFromCanvas: (key, dispose = true) =>
    set(({ canvasChildren }) => {
      // check if remove or reduce instances
      if (canvasChildren[key]?.instances > 1) {
        // reduce usage count
        canvasChildren[key].instances -= 1
        return { canvasChildren }
      } else {
        if (dispose) {
          // unmount since no longer used
          const { [key]: _omit, ...obj } = canvasChildren // make a separate copy of the obj and omit
          return { canvasChildren: obj }
        } else {
          // or tell it that it is "inactive"
          canvasChildren[key].instances = 0
          canvasChildren[key].props.inactive = true
          return { canvasChildren: { ...canvasChildren } }
        }
      }
    }),

  // Used to ask components to re-calculate their positions after a layout reflow
  pageReflow: 0,
  requestReflow: () => {
    set((state) => {
      return { pageReflow: state.pageReflow + 1 }
    })
  },

  // keep track of scrollbar
  scroll: {
    y: 0,
    x: 0,
    limit: 0,
    velocity: 0,
    progress: 0,
    direction: 0,
    scrollDirection: undefined,
  },
  __lenis: undefined,
  scrollTo: () => {},
  onScroll: () => () => {},
}))

export { useCanvasStore }
