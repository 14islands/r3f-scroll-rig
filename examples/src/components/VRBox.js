import React, { useEffect, useState } from 'react'

import { useThree, useFrame } from 'react-three-fiber'
import { Hover, useXR, Select, RayGrab } from '@react-three/xr'
import { RoundedBox, MeshWobbleMaterial } from '@react-three/drei'
import { a, useSpring, interpolate } from 'react-spring/three'

const AnimatedWobbleMaterial = a(MeshWobbleMaterial)
const AnimatedRoundedBox = a(RoundedBox)

function useActive(inactiveScale, activeScale, maxFactor) {
  const [active, set] = useState(false)
  // converts the active flag into a animated 0-1 spring
  const { f } = useSpring({ f: Number(active), from: { f: Number(!active) }, config: { mass: 5, tension: 500, friction: 40 } })
  const scale = f.interpolate([0, 1], [inactiveScale, activeScale])
  const factor = f.interpolate([0, 0.5, 1], [0, maxFactor, 0])
  const color = f.interpolate({
    extrapolate: 'clamp',
    range: [0, 1],
    output: ['deeppink', 'orange']
  })
  return [(e) => (set(!active)), scale, factor, color]
}

function VRBox() {
  // const model = useGLTF(donut)
  const { gl, camera } = useThree()
  const { controllers } = useXR()

  const [isVR, setIsVR] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [selected, setSelected] = useState(false)
  const [onClick, scale, selectFactor] = useActive(0.1, 0.2, 2)
  const [onHover, hoverScale, hoverFactor, hoverColor] = useActive(1, 1.1, .3)
  
//   useEffect(() => {
//     console.log('isVR?', gl.xr.isPresenting)
//     if (!isVR || gl.xr.isPresenting) setIsVR(gl.xr.isPresenting)
//   }, [controllers])
  
  useFrame(() => {
    // console.log('draw calls:', gl.info.render.calls)
    // console.log('draw triangles:', gl.info.render.triangles)
  })
  
  
  return (
      <RayGrab>
    <group position={isVR ? [0, .7, -0.5] : [0, 0, 0]}>
    <Select onSelect={onClick}>
      <Hover onChange={onHover}>

          {/* <primitive object={model.scene} position={[0, 0, 0]} scale={[1, 1, 1]} 
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
          /> */}

          {/* <mesh>
          <primitive object={model.scene} position={[0, 0, 0]} scale={[1, 1, 1]}/>
          <Shadow
            color="black" // Color (default:black)
            colorStop={0.5} // First gradient-stop (default:0)
            opacity={0.3} // Alpha (default:0.5)
            fog={false} // Reacts to fog (default=false)
            scale={[3.5, 3.5, 1]}
            rotation={[-Math.PI/2, 0, 0]}
            position={[.8, 0, -0.3]}
            />
          </mesh> */}

          <a.mesh
            onPointerEnter={onHover}
            onPointerLeave={onHover}
            scale-x={hoverScale} scale-y={hoverScale} scale-z={hoverScale}
          >
            <AnimatedRoundedBox
              args={[1.2, 1.2, 1.2]} // Width, Height and Depth of the box
              radius={.14} // Border-Radius of the box
              smoothness={10} // Optional, number of subdivisions
              position={[0, 0, 0]}
              rotation={[0, Math.PI/5, 0]}
              scale-x={scale} scale-y={scale} scale-z={scale} onClick={onClick}
            >
              <AnimatedWobbleMaterial attach="material"
                color={hoverColor}
                speed={5} // Speed (default=1)
                factor={interpolate([selectFactor, hoverFactor], (f1, f2) => f1 + f2)} // Strength, 0 disables the effect (default=1)
                roughness={0.1}
                metalness={0}
              />
            </AnimatedRoundedBox>
            </a.mesh>
          </Hover>
        </Select>

        {/* <Reflector position={[3, 1, -3]} rotation={[0, -Math.PI/4, 0]}
          // textureWidth={window.innerWidth * window.devicePixelRatio}
          // textureHeight={window.innerHeight * window.devicePixelRatio}>
          textureWidth={1024*4}
          textureHeight={1024*4}>
          <planeBufferGeometry args={[5, 3]} attach="geometry" />
        </Reflector> */}
      </group>
        </RayGrab>
  )
}

export default VRBox;
