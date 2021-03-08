import React, { useRef, useEffect } from 'react'
import { useScrollRig, useCanvas, ScrollScene } from '@14islands/r3f-scroll-rig'
import { useFrame } from 'react-three-fiber'
import { useGLTF, Shadow, softShadows } from '@react-three/drei'

import StickyScrollScene from './StickyScrollScene'
import tileModel from '../assets/rounded-tile_3_1.draco.glb'

const ModelMesh = ({ scale, camera, scene, scrollState, parallax = 0, size = .2, position = [0, 0, 0], shadow, shadowPosition }) => {
  const wrapper = useRef()
  const mesh1 = useRef()
  const mesh2 = useRef()
  const mesh3 = useRef()
  const { requestFrame, preloadScene } = useScrollRig()

  const gltf = useGLTF(tileModel)

  useFrame(() => {
    if (!scrollState.inViewport) return

    // const parallaxProgress = scrollState.progress * 2 - 1
    const progress = Math.max(1 - scrollState.viewport, 0)

    mesh1.current.rotation.y = Math.PI / 4 + scrollState.progress * Math.PI * 1
    mesh2.current.rotation.y = Math.PI / 4 - scrollState.progress * Math.PI * 1
    mesh3.current.rotation.y = Math.PI / 4 + scrollState.progress * Math.PI * 2

    // mesh1.current.position.z = progress * size
    // mesh2.current.position.z = progress * size * -4
    // mesh3.current.position.z = progress * size * -8

    wrapper.current.rotation.x = Math.PI / 3 - scrollState.progress * Math.PI * 0.5 * 1
    wrapper.current.position.y = progress * scale.height * 0.75


    if (scrollState.inViewport) {
      requestFrame()
    }
  })

  // preload Model
  useEffect(() => {
    preloadScene(scene, camera)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf])

  size = Math.min(scale.width, scale.height) * size
  return (
    <mesh ref={wrapper}>
      <mesh position={[0, size/2, 0]} ref={mesh1}>
        <primitive
          object={gltf.scene.clone()}
          position={position}
          scale={[size, size, size]}
        />
      </mesh>
      <mesh position={[0, 0, 0]} ref={mesh2}>
        <primitive
          object={gltf.scene.clone()}
          position={position}
          scale={[size, size, size]}
        />
      </mesh>
      <mesh position={[0, -size/2, 0]} ref={mesh3}>
        <primitive
          object={gltf.scene.clone()}
          position={position}
          scale={[size, size, size]}
        />
      </mesh>
      <Shadow
        scale={[scale.width * 0.4, scale.width * 0.2, 1]}
        opacity={0.1}
        position={[0, -size, 0]}
        rotation={[-Math.PI * 0.5, 0, 0]}
      />
    </mesh>
  )
}

const InlineCustomModelAnimation = ({ src, url, parallax, size, position, debug, ...mProps }) => {
  const ref = useRef()

  useCanvas(
    // <ScrollScene el={ref} debug={debug} scissor={false}>
    <StickyScrollScene el={ref} stickyLerp={1} debug={false} inViewportMargin={100}>
      {(props) => {
        return <ModelMesh {...props} url={url} parallax={parallax} size={size} position={position} {...mProps} />
      }}
    {/* </ScrollScene>, */}
    </StickyScrollScene>,
  )

  return <div style={{ width: '100%', height: '100%', background: 'green' }} ref={ref}></div>
}

export default InlineCustomModelAnimation
