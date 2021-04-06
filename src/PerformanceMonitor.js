import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

import config from './config'
import { useCanvasStore } from './store'

const PerformanceMonitor = () => {
  const { size } = useThree()
  const setPixelRatio = useCanvasStore((state) => state.setPixelRatio)

  useEffect(() => {
    const devicePixelRatio = window.devicePixelRatio || 1
    if (devicePixelRatio > 1) {
      const MAX_PIXEL_RATIO = 2.5

      // TODO Can we allow better resolution on more powerful computers somehow?
      // Calculate avg frame rate and lower pixelRatio on demand?
      // scale down when scrolling fast?
      let scale
      scale = size.width > 1500 ? 0.9 : 1.0
      scale = size.width > 1900 ? 0.8 : scale

      const pixelRatio = Math.max(1.0, Math.min(MAX_PIXEL_RATIO, devicePixelRatio * scale))
      config.debug && console.info('PerformanceMonitor', 'Set pixelRatio', pixelRatio)
      setPixelRatio(pixelRatio)
    }
  }, [size])

  return null
}

export default PerformanceMonitor
