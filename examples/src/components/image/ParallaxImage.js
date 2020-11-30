import React, { useRef } from 'react'
import { useCanvas } from '@14islands/r3f-scroll-rig'
import ParallaxScrollScene from '../ParallaxScrollScene'

import WebGLImage from './WebGLImage'

/* eslint import/no-webpack-loader-syntax: off */
import vertexShader from '!raw-loader!./shader.vert'
import fragmentShader from '!raw-loader!./shader.frag'

const ParallaxImage = ({ src, aspectRatio, style, parallax }) => {
  const ref = useRef()

  useCanvas(
    <ParallaxScrollScene el={ref} parallax={parallax}>
      {(props) => {
        return <WebGLImage image={ref} {...props} vertexShader={vertexShader} fragmentShader={fragmentShader} />
      }}
    </ParallaxScrollScene>,
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

export default ParallaxImage
