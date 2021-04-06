import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ScrollScene } from '@14islands/r3f-scroll-rig'

// Parallax mesh inside ScrollScene
export const ParallaxMesh = ({ children, scrollState, scale, parallax }) => {
  const mesh = useRef()

  useFrame(() => {
    if (!scrollState.inViewport) return

    const parallaxProgress = scrollState.progress * 2 - 1
    mesh.current.position.y = parallax * parallaxProgress * scale.multiplier
  })

  return <mesh ref={mesh}>{children}</mesh>
}

export const ParallaxScrollScene = ({ children, parallax, stickyLerp, ...props }) => {
  return (
    <ScrollScene scissor={false} {...props} inViewportMargin={Math.abs(parallax*3)}>
      { props => <ParallaxMesh parallax={parallax} {...props}>{children(props)}</ParallaxMesh> }
    </ScrollScene>
  )
}

export default ParallaxScrollScene
