import React from 'react'
import PropTypes from 'prop-types'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei/core/shaderMaterial.js'
import { Color } from 'three'

const DebugMaterial = shaderMaterial(
  { color: new Color(1.0, 0.0, 0.0), opacity: 1 },
  // vertex shader
  ` varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,
  // fragment shader
  `
    uniform vec3 color;
    uniform float opacity;
    varying vec2 vUv;
    void main() {
      gl_FragColor.rgba = vec4(color, opacity);
    }
  `
)
extend({ DebugMaterial })

export const DebugMesh = ({ scale }) => (
  <mesh scale={scale}>
    <planeBufferGeometry />
    <debugMaterial color="hotpink" transparent opacity={0.5} />
  </mesh>
)

DebugMesh.propTypes = {
  scale: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
}

export default DebugMesh
