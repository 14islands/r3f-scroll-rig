import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ScrollScene } from '@14islands/r3f-scroll-rig'
import lerp from '@14islands/lerp'

// Sticky mesh that covers full viewport size
export const StickyChild = ({ children, scrollState, scale, priority, stickyLerp = 1.0 }) => {
  const group = useRef()
  const size = useThree((s) => s.size)

  useFrame((_, delta) => {
    if (!scrollState.inViewport) return

    //  move to top of sticky area
    const yTop = scale[1] * 0.5 - size.height * 0.5
    const yBottom = -scale[1] * 0.5 + size.height * 0.5
    const ySticky = yTop - (scrollState.viewport - 1) * size.height

    let y = group.current.position.y

    // enter
    if (scrollState.viewport < 1) {
      y = yTop
    }
    // sticky
    else if (scrollState.visibility < 1) {
      y = ySticky
    }
    // exit
    else {
      y = yBottom
    }

    group.current.position.y = lerp(group.current.position.y, y, stickyLerp, delta)
  }, priority) // must happen after ScrollScene's useFrame to be buttery

  return <group ref={group}>{children}</group>
}

export const renderAsSticky = (children, size, { stickyLerp, scaleToViewport }) => {
  return ({ scale, ...props }) => {
    // set child's scale to 100vh/100vw instead of the full DOM el
    // the DOM el should be taller to indicate how far the scene stays sticky
    let childScale = scale
    if (scaleToViewport) {
      childScale = [size.width, size.height, 1]
    }
    return (
      <StickyChild scale={scale} stickyLerp={stickyLerp} {...props}>
        {children({ scale: childScale, ...props })}
      </StickyChild>
    )
  }
}

export const StickyScrollScene = ({ children, track, stickyLerp, scaleToViewport = true, ...props }) => {
  const size = useThree((s) => s.size)

  const internalRef = useRef(track.current)

  // if tracked element is position:sticky, track the parent instead
  // we want to track the progress of the entire sticky area
  useMemo(() => {
    const style = getComputedStyle(track.current)
    if (style.position === 'sticky') {
      internalRef.current = track.current.parentElement
    }
  }, [track])

  return (
    <ScrollScene track={internalRef} {...props}>
      {renderAsSticky(children, size, { stickyLerp, scaleToViewport })}
    </ScrollScene>
  )
}

export default StickyScrollScene
