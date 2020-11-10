import React, { useRef } from 'react'
import { MathUtils } from 'three'
import { useFrame } from 'react-three-fiber'
import { ScrollScene } from '@14islands/r3f-scroll-rig'

// Sticky mesh that covers full viewport size
export const StickyMesh = ({ children, state, lerp, scale, priority, stickyLerp = 1.0 }) => {
  const mesh = useRef()
  const local = useRef({ lerp: 1 }).current

  useFrame(() => {
    if (!state.bounds.inViewport) return

    //  move to top of sticky area
    let yTop = (state.bounds.height / 2 - state.bounds.window.height * 0.5) *  scale.multiplier
    let yBottom = (-state.bounds.height / 2 + state.bounds.window.height * 0.5) * scale.multiplier
    let ySticky = yTop - (state.bounds.viewport - 1) * state.bounds.window.height * scale.multiplier

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

  }, priority + 1) // must happen after ScrollScene's useFrame to be buttery

  return <mesh ref={mesh}>{children}</mesh>
}

export const renderAsSticky = (children, { stickyLerp, scaleToViewport }) => {
  return ({ scale, state, ...props }) => {
    // set child's scale to 100vh/100vw instead of the full DOM el
    // the DOM el should be taller to indicate how far the scene stays sticky
    if (scaleToViewport) {
      scale = { ...scale, width: state.bounds.window.width * scale.multiplier, height: state.bounds.window.height * scale.multiplier}
    }
    return <StickyMesh state={state} scale={scale} stickyLerp={stickyLerp} {...props}>{children({scale, state, ...props})}</StickyMesh>
  }
}

export const StickyScrollScene = ({ children, stickyLerp, scaleToViewport = true, ...props }) => {
  return (
    <ScrollScene {...props} scissor={false}>
      {renderAsSticky(children, { stickyLerp, scaleToViewport })}
    </ScrollScene>
  )
}

export default StickyScrollScene
