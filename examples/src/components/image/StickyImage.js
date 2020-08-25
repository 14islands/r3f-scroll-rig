import React, { useRef } from 'react'
import { useCanvas, ScrollScene, ScrollDomPortal } from 'r3f-scroll-rig'


import vertexShader from './shader.vert'
import fragmentShader from './shader.frag'

import WebGLImage from './WebGLImage'
import { renderAsSticky, StickyScrollScene } from './StickyMesh'

const StickyImage = ({ src }) => {
  const ref = useRef()

  useCanvas(
    <StickyScrollScene el={ref} scissor={false} stickyLerp={1} debug={false}>
      {props => <WebGLImage image={ref} {...props} vertexShader={vertexShader} fragmentShader={fragmentShader} />}
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
