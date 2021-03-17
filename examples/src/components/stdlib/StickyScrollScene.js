import React, { useRef } from 'react'
import { MathUtils } from 'three'
import { useFrame } from 'react-three-fiber'
import { ScrollScene } from '@14islands/r3f-scroll-rig'

// Sticky mesh that covers full viewport size
export const StickyMesh = ({ children, scrollState, lerp, scale, priority, stickyLerp = 1.0 }) => {
  const mesh = useRef()
  const local = useRef({ lerp: 1 }).current

  useFrame(() => {
    if (!scrollState.inViewport) return

    //  move to top of sticky area
    let yTop = (scale.height / 2 - scale.viewportHeight * 0.5)
    let yBottom = (-scale.height / 2 + scale.viewportHeight * 0.5)
    let ySticky = yTop - (scrollState.viewport - 1) * scale.viewportHeight

    let y = mesh.current.position.y
    let targetLerp

    // enter
    if (scrollState.viewport < 1) {
      y = yTop
      targetLerp = 1
    }
    // sticky
    else if (scrollState.viewport > 1 && scrollState.visibility < 1) {
      y = ySticky
      targetLerp = stickyLerp
    }
    // exit
    else {
      y = yBottom
      // TODO figure out soft limits
      // const f = Math.max(1, scrollState.visibility - 1)
      // y =  MathUtils.lerp(ySticky, yBottom, f)
      targetLerp = 1
    }

    local.lerp = MathUtils.lerp(local.lerp, targetLerp, stickyLerp < 1 ? lerp : 1)
    mesh.current.position.y = MathUtils.lerp(mesh.current.position.y, y, local.lerp)

  }, priority + 1) // must happen after ScrollScene's useFrame to be buttery

  return <mesh ref={mesh}>{children}</mesh>
}

export const renderAsSticky = (children, { stickyLerp, scaleToViewport }) => {
  return ({ scale, ...props }) => {
    // set child's scale to 100vh/100vw instead of the full DOM el
    // the DOM el should be taller to indicate how far the scene stays sticky
    let childScale = scale
    if (scaleToViewport) {
      childScale = { ...scale, width: scale.viewportWidth, height: scale.viewportHeight }
    }
    return <StickyMesh scale={scale} stickyLerp={stickyLerp} {...props}>{children({scale: childScale, ...props})}</StickyMesh>
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
