import React, { useRef } from 'react'
import { useScrollRig, useCanvas, ScrollScene, PerspectiveCameraScene, ScrollDomPortal } from 'r3f-scroll-rig'
import { MathUtils } from 'three'
import { useFrame, useThree } from 'react-three-fiber'
import { useViewportScroll } from 'framer-motion'

import WebGLImage from './WebGLImage'

const BoxMesh = ({scale, state, parallax = 0, layers }) => {
  const mesh = useRef()
  const { requestFrame } = useScrollRig()

  useFrame(() => {
    mesh.current.rotation.y = Math.PI / 8 + state.bounds.progress * Math.PI * 1
    mesh.current.rotation.x = Math.PI / 3 - state.bounds.progress * Math.PI * 0.5 * 1.25

    const parallaxProgress = (state.bounds.progress * 2) - 1
    mesh.current.position.y = parallax * parallaxProgress * 0.001

    if (state.bounds.inViewport) {
      requestFrame()
    }
  })

  const size = Math.min(scale.width, scale.height) * 0.5
  return (
    <mesh ref={mesh} position={[0, 0, -size/2]}
    rotation={[Math.PI / 8, Math.PI / 8, 0]}
    >
      <boxBufferGeometry attach="geometry" args={[size, size, size]} />
      <meshNormalMaterial attach="material" />
    </mesh>
  )
}

const InlineBox = ({ src, aspectRatio, parallax }) => {
  const ref = useRef()

  useCanvas(
    <ScrollScene el={ref} debug={false}>
      {(props) => {
        return <BoxMesh {...props} parallax={parallax} />
      }}
    </ScrollScene>,
  )

  return <div style={{ width: '100%', height: '100%' }} ref={ref}></div>
}

export default InlineBox
