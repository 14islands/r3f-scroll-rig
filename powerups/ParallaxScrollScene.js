import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ScrollScene, useScrollRig } from '@14islands/r3f-scroll-rig'

// Parallax group inside ScrollScene
export const ParallaxGroup = ({ children, scrollState, parallax }) => {
  const mesh = useRef()
  const size = useThree((s) => s.size)
  const { scaleMultiplier } = useScrollRig()

  useFrame(() => {
    if (!scrollState.inViewport) return

    const parallaxProgress = scrollState.progress * 2 - 1
    mesh.current.position.y = parallax * parallaxProgress * scaleMultiplier * size.height
  })

  return <mesh ref={mesh}>{children}</mesh>
}

/* Speed=1 is no parallax */
export const ParallaxScrollScene = ({ children, speed = 1, ...props }) => {
  const extraMargin = 50 // add 50vh extra margin to avoid aggressive clipping
  const parallaxAmount = speed - 1
  return (
    <ScrollScene scissor={false} inViewportMargin={`${Math.max(0, 1 - 0.5) * 200 + extraMargin}%`} {...props}>
      {(props) => (
        <ParallaxGroup parallax={parallaxAmount} {...props}>
          {children(props)}
        </ParallaxGroup>
      )}
    </ScrollScene>
  )
}

export default ParallaxScrollScene
