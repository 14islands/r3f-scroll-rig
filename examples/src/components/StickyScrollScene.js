import React, { useRef } from 'react'
import { MathUtils } from 'three'
import { useFrame } from 'react-three-fiber'
import { ScrollScene } from '@14islands/r3f-scroll-rig'

// Sticky mesh that covers full viewport size
export const StickyMesh = ({ children, state, lerp, stickyLerp = 1.0 }) => {
  const mesh = useRef()
  const local = useRef({ lerp: 1 }).current

  useFrame(() => {
    if (!state.bounds.inViewport) return

    //  move to top of sticky area
    let yTop = state.bounds.height / 2 - state.bounds.window.height * 0.5
    let yBottom = -state.bounds.height / 2 + state.bounds.window.height * 0.5
    let ySticky = yTop - (state.bounds.viewport - 1) * state.bounds.window.height

    let y, targetLerp

    // enter
    if (state.bounds.viewport < 1) {
      y = yTop
      targetLerp = 1
    }
    // sticky
    else if (state.bounds.viewport > 1 && state.bounds.visibility < 1) {
      y = ySticky
      targetLerp = stickyLerp
    }
    // exit
    else {
      y = yBottom
      targetLerp = 1
    }

    local.lerp = MathUtils.lerp(local.lerp, targetLerp, stickyLerp < 1 ? lerp : 1)
    mesh.current.position.y = MathUtils.lerp(mesh.current.position.y, y, local.lerp)

  }, 20 + 1) // must happen after ScrollScene's useFrame to be buttery

  return <mesh ref={mesh}>{children}</mesh>
}

export const renderAsSticky = (children, stickyProps) => {
  return ({ scale, state, lerp, ...props }) => {
    // set child's cale to 100vh/100vw
    const fullscreen = { width: state.bounds.window.width, height: state.bounds.window.height }
    return <StickyMesh state={state} lerp={lerp} {...stickyProps}>{children({scale: fullscreen, state, lerp, ...props})}</StickyMesh>
  }
}

export const StickyScrollScene = ({ children, stickyLerp, ...props }) => {
  return (
    <ScrollScene {...props}>
      {renderAsSticky(children, { stickyLerp })}
    </ScrollScene>
  )
}

export default StickyScrollScene
