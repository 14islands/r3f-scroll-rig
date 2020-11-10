import React from 'react'
import { useScrollRig } from '@14islands/r3f-scroll-rig'
import { useFrame, useResource } from 'react-three-fiber'
import { MeshWobbleMaterial } from '@react-three/drei'

import WebGLText from './WebGLText'

const WobblyTextMesh = ({ children, state, scale, el, font }) => {
  const material = useResource()
  const { requestFrame } = useScrollRig()

  useFrame(() => {
    if (material.current && state.bounds.inViewport) {
      requestFrame()
      material.current.factor = Math.max(0, state.bounds.progress - 0.5) * 2
    }
  })

  return (
    <>
      <MeshWobbleMaterial ref={material} factor={0} />
      <ambientLight />
      <WebGLText el={el} font={font} material={material.current} scale={scale}>
        {children}
      </WebGLText>
    </>
  )
}

export default WobblyTextMesh
