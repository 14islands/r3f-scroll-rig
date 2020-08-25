import React, { useEffect, useRef, useMemo } from 'react'
import { useCanvas, ScrollScene } from 'r3f-scroll-rig'
import WebGLText from './WebGLText'


const Text = ({ children, className, style }) => {
  const ref = useRef()

  const updateTextMesh = useCanvas(
    <ScrollScene el={ref} debug={false}>
      { (props) => <WebGLText el={ref} {...props}>{children}</WebGLText> }
    </ScrollScene>,
  )

  return (
    <div ref={ref} className={className} style={{ ...style }}>
      {children}
    </div>
  )
}

export default Text
