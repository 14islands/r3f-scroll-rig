import React, { useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshWobbleMaterial } from '@react-three/drei/core/MeshWobbleMaterial'

import WebGLText from '../stdlib/WebGLText'

const WobblyTextMesh = ({ children, scrollState, scale, el, font }) => {
  const [material, set] = useState()
  const { invalidate } = useThree()


  useFrame(() => {
    if (material && scrollState.inViewport) {
      invalidate()
      material.factor = scrollState.progress * 0.5 //Math.max(0, scrollState.progress - 0.5) * 2
    }
  })

  return (
    <>
      <MeshWobbleMaterial ref={set} factor={0} depthTest={false} />
      { material && <WebGLText el={el} font={font} material={material} scale={scale} overrideEmissive>
        {children}
      </WebGLText>}
    </>
  )
}

export default WobblyTextMesh
