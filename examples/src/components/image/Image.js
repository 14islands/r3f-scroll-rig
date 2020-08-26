import React, { useRef } from 'react'
import { useCanvas, ScrollScene } from '@14islands/r3f-scroll-rig'

import WebGLImage from './WebGLImage'

import vertexShader from './shader.vert'
import fragmentShader from './shader.frag'

const Image = ({ src, aspectRatio, style, parallax, mesh = WebGLImage }) => {
  const ref = useRef()

  useCanvas(
    <ScrollScene
      el={ref}
      scissor={false}
      debug={false}
    >
      {(props) => {
        return <WebGLImage image={ref} {...props} vertexShader={vertexShader} fragmentShader={fragmentShader} />
      }}
    </ScrollScene>,
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: 0, paddingBottom: `${100 / aspectRatio}%`, ...style }}>
      <img
        src={src}
        ref={ref}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        alt=""
      />
    </div>
  )
}

export default Image
