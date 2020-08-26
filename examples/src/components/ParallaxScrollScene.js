import React, { useRef } from 'react'
import { MathUtils } from 'three'
import { useFrame } from 'react-three-fiber'
import { ScrollScene } from '@14islands/r3f-scroll-rig'

// Sticky mesh that covers full viewport size
export const ParallaxMesh = ({ children, state, parallax }) => {
  const mesh = useRef()

  useFrame(() => {
    if (!state.bounds.inViewport) return

    const parallaxProgress = state.bounds.progress * 2 - 1
    mesh.current.position.y = parallax * parallaxProgress
  })

  return <mesh ref={mesh}>{children}</mesh>
}

export const ParallaxScrollScene = ({ children, stickyLerp, ...props }) => {
  return (
    <ScrollScene {...props}>
      { props => <ParallaxMesh {...props}>{children(props)}</ParallaxMesh> }
    </ScrollScene>
  )
}

export default ParallaxScrollScene
