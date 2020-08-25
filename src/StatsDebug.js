import { useRef } from 'react'
import { useFrame } from 'react-three-fiber'
import { requestIdleCallback } from './hooks/requestIdleCallback'

const StatsDebug = () => {
  const stats = useRef({ calls: 0 }).current
  useFrame(({ gl, clock }) => {
    gl.info.autoReset = false
    window._gl = gl
    const calls = gl.info.render.calls
    if (calls !== stats.calls) {
      requestIdleCallback(() => console.log('Draw calls: ', calls))
      stats.calls = calls
    }
    gl.info.reset()
  })
  return null
}

export default StatsDebug
