import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import { useScrollRig } from '@14islands/r3f-scroll-rig'
import { Color } from 'three'
import { MeshWobbleMaterial } from 'drei'

import { Text } from 'drei'


const WebGLText = ({ el, children, state, ...props }) => {
  const mesh = useRef()
  const { requestFrame } = useScrollRig()
  const { size } = useThree()

  const { color, fontSize, textAlign, lineHeight, letterSpacing } = useMemo(() => {
    if (!el.current) return {}
    const cs = window.getComputedStyle(el.current)

    // font size relative letter spacing
    const letterSpacing = (parseInt(cs.letterSpacing, 10) || 0) / parseInt(cs.fontSize, 10)

    return {
      ...cs,
      letterSpacing,
      color: new Color(cs.color).convertSRGBToLinear(),
    }
  }, [el, size])

  useFrame(() => {
    if (mesh.current && state.bounds.inViewport) {
      requestFrame()
      mesh.current.material.factor.value = Math.max(0, state.bounds.progress - 0.5) * 2
    }
  })

  return (
    <>
      <ambientLight />
      <Text
        ref={mesh}
        state={state}
        fontSize={parseInt(fontSize, 10)}
        maxWidth={state.bounds.width}
        lineHeight={lineHeight}
        textAlign={textAlign}
        letterSpacing={letterSpacing}
        // font={fontSrc}
        font={'https://fonts.gstatic.com/s/philosopher/v9/vEFV2_5QCwIS4_Dhez5jcWBuT0s.woff'}
        anchorX="center"
        anchorY="middle"
        position={[0, 13, 0]} // font specific
      >
        {children}
        <MeshWobbleMaterial attach="material" color={color} factor={0} />
        {/* <meshBasicMaterial attach="material" color={color} /> */}
      </Text>
    </>
  )
}

export default WebGLText
