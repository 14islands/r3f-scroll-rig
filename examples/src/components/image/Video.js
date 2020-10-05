import React, { useRef } from 'react'
import { useCanvas, ScrollScene } from '@14islands/r3f-scroll-rig'

import WebGLVideo from './WebGLVideo'

const Video = ({ src, aspectRatio = 16/9, style, parallax }) => {
  const ref = useRef()

  useCanvas(
    <ScrollScene
      el={ref}
      scissor={false}
      debug={false}
    >
      {(props) => {
        return <WebGLVideo image={ref} {...props} />
      }}
    </ScrollScene>,
  )

  return (
    <div ref={ref} style={{ background: 'red', position: 'relative', width: 800, height: 600, ...style }}>

    </div>
  )
}

export default Video
