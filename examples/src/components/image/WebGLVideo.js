import React, { useState, useRef, useMemo, useEffect } from 'react'
import { useScrollRig, useImgTagAsTexture, requestFrame } from '@14islands/r3f-scroll-rig'
import { useFrame, useThree } from 'react-three-fiber'

import { LinearFilter, VideoTexture, sRGBEncoding, Math as MathUtils } from 'three'

const WebGLVideo = ({ image, scale, scrollState, scene }) => {
  const material = useRef()
  const mesh = useRef()
  const { requestFrame, pixelRatio, preloadScene } = useScrollRig()
  const { camera, size, gl } = useThree()
  const [texture, setTexture] = useState(null)

  const createVideoTexture = el => {
    var texture = new VideoTexture(el)
    texture.anisotropy = gl.capabilities.getMaxAnisotropy()
    texture.generateMipmaps = false
    texture.magFilter = LinearFilter
    texture.minFilter = LinearFilter
    texture.encoding = sRGBEncoding
    return texture
  }

  useEffect(() => {
    setTimeout(() => {
      // const videoEl = document.getElementById('video')
      // const video = videoEl.querySelector('video')
      const video = document.querySelector('video')
      const texture = createVideoTexture(video)

      setTexture(texture)

      var api = window.Wistia.api("ylmlt1f62d");
      api.play()

    }, 1000)
  }, [])

  useFrame(({clock}) => {
    if (!scrollState.inViewport) return
    // texture && (texture.needsUpdate = true)
    // if (material.current && material.current.map) {
    //   material.current.map.needsUpdate = true
    // }
    mesh.current.rotation.y = Math.sin(clock.getElapsedTime())

    requestFrame()
 })

  return (
    <mesh ref={mesh}>
      <planeBufferGeometry attach="geometry" args={[scale.width, scale.height, 128, 128]} />
      {texture && <meshBasicMaterial ref={material} attach="material" map={texture} />}
    </mesh>
  )
}

export default WebGLVideo
