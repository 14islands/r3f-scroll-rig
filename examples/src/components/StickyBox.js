import React, { useRef } from 'react'
import { useScrollRig, useCanvas } from '@14islands/r3f-scroll-rig'
import { useFrame } from 'react-three-fiber'
import { useSpring, animated } from 'react-spring/three'

import StickyScrollScene from './stdlib/StickyScrollScene'


const BoxMesh = ({scale, scrollState, lerp }) => {
  const mesh = useRef()
  const { requestFrame } = useScrollRig()

  const size = scale.width * 0.25

  const [rotationProps, set] = useSpring(() => ({ scale: [0, 0, 0], position: [0, 0, 0], config: { tension: 100, friction: 10, velocity: -5, precision: 0.01 * scale.multiplier } }))

  useFrame(() => {
    if (!scrollState.inViewport) return

    // enter
    if (scrollState.viewport < 1) {
      set({
        scale: [0.5, 0.5, 0.5],
        position: [0, size * 0.75, 0]
      })
    }
    // sticky
    else if (scrollState.viewport > 1 && scrollState.visibility < 1) {
      set({
        scale: [1, 1, 1],
        position: [-scale.viewportWidth * 0.25 , 0, 0]
      })
    }
    // exit
    else {
      set({
        scale: [0.5, 0.5, 0.5],
        position: [0, size * -0.5, 0]
      })
    }

    mesh.current.rotation.y = (Math.PI / 8) + scrollState.progress * Math.PI * 3
    mesh.current.rotation.x = Math.PI / 8 - scrollState.progress * Math.PI * 0.25

    requestFrame()
  })


  return (
    <animated.mesh ref={mesh} rotation={[Math.PI / 8, Math.PI / 8, 0]} position={[0,0,0]} {...rotationProps}>
      <boxBufferGeometry attach="geometry" args={[size, size, size]} />
      <meshNormalMaterial attach="material" />
    </animated.mesh>
  )
}



const StickyBox = ({ src, aspectRatio }) => {
  const ref = useRef()

  useCanvas(
    <StickyScrollScene el={ref} stickyLerp={0.2} debug={false} inViewportMargin={100}>
      {props => <BoxMesh {...props} />}
    </StickyScrollScene>
  )

  return (
      <div style={{ position: 'absolute', width: '100%', height: '100%' }} ref={ref}>
      </div>
  )
}

export default StickyBox
