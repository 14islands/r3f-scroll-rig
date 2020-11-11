import React, { useRef } from 'react'
import { useCanvas } from '@14islands/r3f-scroll-rig'
import { useFrame } from 'react-three-fiber'

import vertexShader from './shader.vert'
import fragmentShader from './shader.frag'

import WebGLImage from './WebGLImage'
import StickyScrollScene from '../StickyScrollScene'

const ImageMesh = ({ scrollState, ...props }) => {
  const scaleWrapper = useRef()
  
  useFrame(() => {  
    if (!scrollState.inViewport) return
    scaleWrapper.current.scale.setScalar(0.5 + scrollState.visibility * 0.5)
  })

  return (
    <mesh ref={scaleWrapper}>
      <WebGLImage {...props} scrollState={scrollState} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  )
}


const StickyImage = ({ src, scrollState }) => {
  const ref = useRef()

  
  useCanvas(
    <StickyScrollScene el={ref} stickyLerp={1} debug={false}>
      {props => <ImageMesh image={ref} {...props} />}
    </StickyScrollScene>
  )

  return (
    <>
      <div style={{ position: 'relative', height: '100%' }}>
        <img
          src={src}
          ref={ref}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          alt=""
        />
      </div>
    </>
  )
}

export default StickyImage
