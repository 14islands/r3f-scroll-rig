import React, { useMemo, useEffect } from 'react'
import { Color } from 'three'
import { useThree } from 'react-three-fiber'
import { Text } from '@react-three/drei'

/**
 * Returns a WebGL Troika text mesh styled as the source DOM element
 */

const WebGLText = ({ el, children, material, scale, font, offset = 0, ...props }) => {
  const { size } = useThree()

  const { color, fontSize, textAlign, lineHeight, letterSpacing } = useMemo(() => {
    if (!el.current) return {}
    const cs = window.getComputedStyle(el.current)

    // font size relative letter spacing
    const letterSpacing = (parseInt(cs.letterSpacing, 10) || 0) / parseInt(cs.fontSize, 10)

    return {
      ...cs,
      letterSpacing,
      color: new Color(cs.color).convertSRGBToLinear(),
      fontSize: parseInt(cs.fontSize, 10) * scale.multiplier,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, size, scale]) // recalc on resize

  useEffect(() => {
    if (material) {
      material.emissive = color
    }
  }, [material, color])

  return (
    <mesh layers={[3]}>
      <Text
        fontSize={fontSize}
        maxWidth={scale ? scale.width : size.width}
        lineHeight={lineHeight}
        textAlign={textAlign}
        letterSpacing={letterSpacing}
        font={font}
        color={color}
        anchorX="center"
        anchorY="middle"
        position={[0, fontSize * offset, 0]} // font specific
        material={material}
        {...props}
      >
        {children}
      </Text>
    </mesh>
  )
}

export default WebGLText
