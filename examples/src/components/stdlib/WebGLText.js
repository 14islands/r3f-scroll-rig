import React, { useMemo, useEffect } from 'react'
import { Color } from 'three'
import { useThree } from 'react-three-fiber'
import { Text } from '@react-three/drei'

/**
 * Returns a WebGL Troika text mesh styled as the source DOM element
 */

const WebGLText = ({ el, children, material, scale, font, fontOffsetY = 0, fontOffsetX = 0, overrideEmissive = false, ...props }) => {
  const { size } = useThree()

  const { color, fontSize, textAlign, lineHeight, letterSpacing } = useMemo(() => {
    if (!el.current) return {}
    const cs = window.getComputedStyle(el.current)

    // font size relative letter spacing
    const letterSpacing = (parseFloat(cs.letterSpacing) || 0) / parseFloat(cs.fontSize)
    const lineHeight = (parseFloat(cs.lineHeight) || 0) / parseFloat(cs.fontSize)

    return {
      ...cs,
      letterSpacing,
      lineHeight,
      color: new Color(cs.color).convertSRGBToLinear(),
      fontSize: parseFloat(cs.fontSize) * scale.multiplier,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, size, scale]) // recalc on resize

  useEffect(() => {
    if (material && overrideEmissive) {
      material.emissive = color
    }
  }, [material, color, overrideEmissive])

  let xOffset = 0
  textAlign === 'left' && (xOffset = scale.width * -0.5)
  textAlign === 'right' && (xOffset = scale.width * 0.5)

  const yOffset = scale ? scale.height * 0.5 : size.height * 0.5

  return (
    <Text
      fontSize={fontSize}
      maxWidth={scale ? scale.width : size.width}
      lineHeight={lineHeight}
      textAlign={textAlign}
      letterSpacing={letterSpacing}
      font={font}
      color={color}
      anchorX={textAlign}
      anchorY="top" // so text moves down if row breaks
      position={[xOffset + fontSize * fontOffsetX, yOffset + fontSize * fontOffsetY, 0]} // font specific
      material={material}
      {...props}
    >
      {children}
    </Text>
  )
}
