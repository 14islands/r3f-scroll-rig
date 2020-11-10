import React, { useRef } from 'react'
import { useFrame } from 'react-three-fiber'
import { ScrollScene } from '@14islands/r3f-scroll-rig'

// Sticky mesh that covers full viewport size
export const ParallaxMesh = ({ children, scrollState, scale, parallax }) => {
  const mesh = useRef()

  useFrame(() => {
    if (!scrollState.inViewport) return

    const parallaxProgress = scrollState.progress * 2 - 1
    mesh.current.position.y = parallax * parallaxProgress * scale.multiplier
  })

  return <mesh ref={mesh}>{children}</mesh>
}

export const ParallaxScrollScene = ({ children, stickyLerp, ...props }) => {
  return (
    <ScrollScene {...props} scissor={false}>
      { props => <ParallaxMesh {...props}>{children(props)}</ParallaxMesh> }
    </ScrollScene>
  )
}

export default ParallaxScrollScene
