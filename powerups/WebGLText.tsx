import React, { useMemo, useEffect, ReactNode, MutableRefObject } from 'react'
import { Color, Material } from 'three'
import { useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'

import { useScrollRig } from '@14islands/r3f-scroll-rig'

/**
 * Returns a WebGL Troika text mesh styled as the source DOM element
 */

interface WebGLTextProps {
  el: MutableRefObject<HTMLElement>
  children?: ReactNode
  material?: Material
  scale?: any
  font?: string
  fontOffsetY?: number
  fontOffsetX?: number
  overrideEmissive?: boolean
  color?: string
}

export const WebGLText = ({
  el,
  children,
  material,
  scale,
  font,
  fontOffsetY = 0,
  fontOffsetX = 0,
  overrideEmissive = false,
  color,
  ...props
}: WebGLTextProps) => {
  const { size } = useThree()
  const { scaleMultiplier } = useScrollRig()

  const { textColor, fontSize, textAlign, lineHeight, letterSpacing } = useMemo(() => {
    if (!el.current) return {}
    const cs = { ...window.getComputedStyle(el.current) }

    // get color from parent if set to transparent
    let textColor = color || cs.color
    if (!color && cs.color === 'rgba(0, 0, 0, 0)' && el.current.parentElement) {
      textColor = window.getComputedStyle(el.current.parentElement).color
    }

    // font size relative letter spacing
    const letterSpacing = (parseFloat(cs.letterSpacing) || 0) / parseFloat(cs.fontSize)
    const lineHeight = (parseFloat(cs.lineHeight) || 0) / parseFloat(cs.fontSize)

    return {
      letterSpacing,
      lineHeight,
      textColor,
      fontSize: parseFloat(cs.fontSize) * scaleMultiplier,
      textAlign: cs.textAlign,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, size, scale, color, scaleMultiplier]) // recalc on resize

  useEffect(() => {
    if (material && overrideEmissive) {
      // @ts-ignore
      material.emissive = color
    }
  }, [material, color, overrideEmissive])

  let xOffset = 0
  if (textAlign === 'left' || textAlign === 'start') {
    xOffset = scale[0] * -0.5
  } else if (textAlign === 'right' || textAlign === 'end') {
    xOffset = scale[0] * 0.5
  }

  const yOffset = scale ? scale[1] * 0.5 : size.height * 0.5

  return (
    <Text
      fontSize={fontSize}
      maxWidth={scale ? scale[0] : size.width}
      lineHeight={lineHeight}
      // @ts-ignore
      textAlign={textAlign}
      letterSpacing={letterSpacing}
      overflowWrap="break-word"
      font={font}
      color={textColor}
      // @ts-ignore
      anchorX={textAlign}
      anchorY="top" // so text moves down if row breaks
      // @ts-ignore
      position={[xOffset + fontSize * fontOffsetX, yOffset + fontSize * fontOffsetY, 0]} // font specific
      material={material}
      {...props}
    >
      {children}
    </Text>
  )
}
