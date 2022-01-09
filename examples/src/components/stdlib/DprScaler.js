import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

import { _config } from '@14islands/r3f-scroll-rig'

const DprScaler = () => {
  const size = useThree(s => s.size)
  const setDpr = useThree(s => s.setDpr)

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

      const dpr = Math.max(1.0, Math.min(MAX_PIXEL_RATIO, devicePixelRatio * scale))
      _config.debug && console.info('DprScaler', 'Set dpr', dpr)
      setDpr(dpr)
    }
  }, [size])

  return null
}

export default DprScaler
