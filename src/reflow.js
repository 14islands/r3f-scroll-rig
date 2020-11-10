import { useCanvasStore } from './store'

export const reflow = () => {
  const requestReflow = useCanvasStore((state) => state.requestReflow)
  requestReflow()
}
