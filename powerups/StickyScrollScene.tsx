import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group } from 'three'
import vecn from 'vecn'
// @ts-ignore
import lerp from '@14islands/lerp'

import { ScrollScene, useScrollRig } from '@14islands/r3f-scroll-rig'

// Sticky mesh that covers full viewport size
const StickyChild = ({
  children,
  childTop,
  childBottom,
  scrollState,
  parentScale,
  childScale,
  scaleMultiplier,
  priority,
  stickyLerp = 1.0,
  offsetTop = 0,
}: any) => {
  const group = useRef<Group>(null!)
  const size = useThree((s) => s.size)
  const initialScrollY = useRef(window.scrollY || 0).current;

  useFrame((_, delta) => {
    if (!scrollState.inViewport) return

    const topOffset = (childTop - offsetTop + initialScrollY + 1) / size.height
    const bottomOffset = (childBottom / parentScale[1]) * scaleMultiplier

    //  move to top of sticky area
    const yTop = parentScale[1] * 0.5 - childScale[1] * 0.5 - offsetTop * scaleMultiplier
    const yBottom = -parentScale[1] * 0.5 + childScale[1] * 0.5
    const ySticky =
      -childTop * scaleMultiplier +
      yTop -
      (scrollState.viewport - 1) * size.height * scaleMultiplier +
      offsetTop * scaleMultiplier

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

const renderAsSticky = (
  el: any,
  children: any,
  size: any,
  childStyle: any,
  scaleMultiplier: number,
  { stickyLerp, fillViewport }: any
) => {
  return ({ scale, ...props }: any) => {
    let childScale = vecn.vec3(parseFloat(childStyle.width), parseFloat(childStyle.height), 1)
    let childTop = parseFloat(childStyle.top)
    let childBottom = size.height - childTop - childScale[1]

    if (fillViewport) {
      childScale = vecn.vec3(size.width, size.height, 1)
      childTop = 0
      childBottom = 0
    }

    const offsetTop = useRef(el.current.offsetTop).current

    return (
      // @ts-ignore
      <StickyChild
        offsetTop={offsetTop}
        parentScale={scale}
        childScale={childScale.times(scaleMultiplier)}
        stickyLerp={stickyLerp}
        childTop={childTop}
        childBottom={childBottom}
        scaleMultiplier={scaleMultiplier}
        {...props}
      >
        {children({
          scale: childScale.times(scaleMultiplier),
          parentScale: scale,
          ...props,
        })}
      </StickyChild>
    )
  }
}

export const StickyScrollScene = ({ children, track, stickyLerp, fillViewport, ...props }: any) => {
  const size = useThree((s) => s.size)
  const { scaleMultiplier } = useScrollRig()

  const internalRef = useRef(track.current)

  // if tracked element is position:sticky, track the parent instead
  // we want to track the progress of the entire sticky area
  const childStyle = useMemo(() => {
    const style = getComputedStyle(track.current)
    if (style.position === 'sticky') {
      internalRef.current = track.current.parentElement

      // make sure parent is relative/absolute so we get accurante offsetTop
      const parentStyle = getComputedStyle(internalRef.current)
      if (parentStyle.position === 'static') {
        console.error(
          'StickyScrollScene: parent of position:sticky needs to be position:relative or position:absolute (currently set to position:static)'
        )
      }
    } else {
      console.error('StickyScrollScene: tracked element is not position:sticky')
    }
    return style
  }, [track])

  return (
    <ScrollScene track={internalRef} {...props}>
      {renderAsSticky(track, children, size, childStyle, scaleMultiplier, {
        stickyLerp,
        fillViewport,
      })}
    </ScrollScene>
  )
}
