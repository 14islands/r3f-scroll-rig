import React from 'react'
import { Color } from 'three'

export const DebugMesh = ({ scale }: { scale: [x: number, y: number, z: number] }) => (
  <mesh scale={scale}>
    <planeGeometry />
    <shaderMaterial
      args={[
        {
          uniforms: {
            color: { value: new Color('hotpink') },
          },
          vertexShader: `
            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 color;
            uniform float opacity;
            void main() {
              gl_FragColor.rgba = vec4(color, .5);
            }
          `,
        },
      ]}
      transparent
    />
  </mesh>
)
