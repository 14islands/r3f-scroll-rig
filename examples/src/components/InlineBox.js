import React, { useRef } from 'react'
import { useScrollRig, useCanvas, ScrollScene } from '@14islands/r3f-scroll-rig'
import { useFrame } from 'react-three-fiber'
import { RayGrab, Hover } from '@react-three/xr'

const BoxMesh = ({scale, scrollState, parallax = 0 }) => {
  const mesh = useRef()
  const { invalidate } = useScrollRig()

  useFrame(() => {
    mesh.current.rotation.y = Math.PI / 8 + scrollState.progress * Math.PI * 1
    mesh.current.rotation.x = Math.PI / 3 - scrollState.progress * Math.PI * 0.5 * 1.25

    const parallaxProgress = (scrollState.progress * 2) - 1
    mesh.current.position.y = parallax * parallaxProgress * 0.001

    if (scrollState.inViewport) {
      invalidate()
    }
  })

  const size = Math.min(scale.width, scale.height) * 0.5

  return (
    // <RayGrab>
    // <Hover onChange={() => {}}>
    <mesh ref={mesh} position={[0, 0, -size/2]}
    rotation={[Math.PI / 8, Math.PI / 8, 0]}
    >
      <boxBufferGeometry attach="geometry" args={[size, size, size]} />
      <meshNormalMaterial attach="material" />
    </mesh>
// </Hover>
//     </RayGrab>
  )
}

const InlineBox = ({ src, aspectRatio, parallax, ...props }) => {
  const ref = useRef()

  useCanvas(
    <ScrollScene el={ref} debug={false} {...props}>
      {(props) => {
        return <BoxMesh {...props} parallax={parallax} />
      }}
    </ScrollScene>,
  )

  return <div style={{ width: '100%', height: '100%' }} ref={ref}></div>
}

export default InlineBox
