import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ScrollScene } from '@14islands/r3f-scroll-rig'
import lerp from '@14islands/lerp'

// Sticky mesh that covers full viewport size
export const StickyChild = ({
  children,
  childTop,
  childBottom,
  scrollState,
  parentScale,
  childScale,
  priority,
  stickyLerp = 1.0,
}) => {
  const group = useRef()
  const size = useThree((s) => s.size)

  useFrame((_, delta) => {
    if (!scrollState.inViewport) return

    const topOffset = childTop / size.height
    const bottomOffset = childBottom / parentScale[1]

    //  move to top of sticky area
    const yTop = parentScale[1] * 0.5 - childScale[1] * 0.5
    const yBottom = -parentScale[1] * 0.5 + childScale[1] * 0.5
    const ySticky = -childTop + yTop - (scrollState.viewport - 1) * size.height

    let y = group.current.position.y

    // enter
    if (scrollState.viewport + topOffset < 1) {
      y = yTop
    }
    // sticky
    else if (scrollState.visibility - bottomOffset < 1) {
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

export const renderAsSticky = (children, size, childStyle, { stickyLerp, fillViewport }) => {
  return ({ scale, ...props }) => {
    // set child's scale to 100vh/100vw instead of the full DOM el
    // the DOM el should be taller to indicate how far the scene stays sticky
    let childScale = [parseFloat(childStyle.width), parseFloat(childStyle.height), 1]
    let childTop = parseFloat(childStyle.top)
    let childBottom = size.height - childTop - childScale[1]

    if (fillViewport) {
      childScale = [size.width, size.height, 1]
      childTop = 0
      childBottom = 0
    }
    return (
      <StickyChild
        parentScale={scale}
        childScale={childScale}
        stickyLerp={stickyLerp}
        childTop={childTop}
        childBottom={childBottom}
        {...props}
      >
        {children({ scale: childScale, ...props })}
      </StickyChild>
    )
  }
}

export const StickyScrollScene = ({ children, track, stickyLerp, fillViewport, ...props }) => {
  const size = useThree((s) => s.size)

  const internalRef = useRef(track.current)

  // if tracked element is position:sticky, track the parent instead
  // we want to track the progress of the entire sticky area
  const childStyle = useMemo(() => {
    const style = getComputedStyle(track.current)
    if (style.position === 'sticky') {
      internalRef.current = track.current.parentElement
    } else {
      console.error('StickyScrollScene: tracked element is not position:sticky')
    }
    return style
  }, [track])

  return (
    <ScrollScene track={internalRef} {...props}>
      {renderAsSticky(children, size, childStyle, { stickyLerp, fillViewport })}
    </ScrollScene>
  )
}

export default StickyScrollScene
