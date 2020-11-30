import React, { useRef, useEffect } from 'react'
import { useScrollRig, useCanvas, ScrollScene } from '@14islands/r3f-scroll-rig'
// import { MathUtils, CameraHelper, FrontSide, BackSide, DoubleSide } from 'three'
import { useFrame } from 'react-three-fiber'
import { useGLTF, Shadow, softShadows } from '@react-three/drei'
// import { StandardEffects } from './StandardEffects'

// softShadows()

const ModelMesh = ({ url, scale, camera, scene, scrollState, parallax = 0, size = 1, position = [0, 0, 0] }) => {
  const mesh = useRef()
  const light = useRef()
  const { requestFrame, preloadScene } = useScrollRig()

  const gltf = useGLTF(url)

  useFrame(() => {
    if (!scrollState.inViewport) return

    mesh.current.rotation.y = Math.PI / 2 + scrollState.progress * Math.PI * 1
    mesh.current.rotation.x = Math.PI / 3 - scrollState.progress * Math.PI * 0.5 * 1

    // light.current.intensity = MathUtils.lerp(0.0, 1.0, scrollState.viewport*2)
    //   const parallaxProgress = scrollState.progress * 2 - 1
    //   mesh.current.position.y = parallax * parallaxProgress

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
    <>
      {/* <ambientLight intensity={0.5} /> */}
      <directionalLight
        intensity={0.5}
        ref={light}
        // position={[-1, 1, 1]}
        position={[-scale.height * 1, scale.height * 2, scale.height * 2]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={scale.height * 5}
        shadow-camera-left={-scale.width}
        shadow-camera-right={scale.width}
        shadow-camera-top={scale.width}
        shadow-camera-bottom={-scale.width}
        shadow-bias={-0.0018}
        // shadow-bias={-0.004}
      />

      <mesh position={[0, 0, 0]} ref={mesh}>
        <primitive
          object={gltf.scene}
          position={position}
          scale={[size, size, size]}
        />

        <Shadow
          scale={[scale.width * 0.4, scale.width * 0.2, 1]}
          opacity={0.1}
          position={[0, -scale.height * 0.4, 0]}
          rotation={[-Math.PI * 0.5, 0, 0]}
        />
      </mesh>
    </>
  )
}

const InlineModel = ({ src, aspectRatio, url, parallax, size, position, renderOnTop }) => {
  const ref = useRef()

  useCanvas(
    <ScrollScene el={ref} debug={false} renderOnTop={renderOnTop} scaleMultiplier={0.001}>
      {(props) => {
        return <ModelMesh {...props} url={url} parallax={parallax} size={size} position={position} />
      }}
    </ScrollScene>,
  )

  return <div style={{ width: '100%', height: '100%', background: 'green' }} ref={ref}></div>
}

export default InlineModel
