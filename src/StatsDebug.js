import { useRef } from 'react'
import { useFrame } from 'react-three-fiber'
import { requestIdleCallback } from './hooks/requestIdleCallback'

const StatsDebug = ({ render = true, memory = true }) => {
  const stats = useRef({ calls: 0, triangles: 0, geometries: 0, textures: 0 }).current
  useFrame(({ gl, clock }) => {
    gl.info.autoReset = false
    const _calls = gl.info.render.calls
    const _triangles = gl.info.render.triangles
    const _geometries = gl.info.memory.geometries
    const _textures = gl.info.memory.textures

    if (render) {
      if (_calls !== stats.calls || _triangles !== stats.triangles) {
        requestIdleCallback(() => console.info('Draw calls: ', _calls, ' Triangles: ', _triangles))
        stats.calls = _calls
        stats.triangles = _triangles
      }
    }

    if (memory) {
      if (_geometries !== stats.geometries || _textures !== stats.textures) {
        requestIdleCallback(() => console.info('Geometries: ', _geometries, 'Textures: ', _textures))
        stats.geometries = _geometries
        stats.textures = _textures
      }
    }

    gl.info.reset()
  })
  return null
}

export default StatsDebug
