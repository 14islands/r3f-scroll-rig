import React, { useRef, Suspense, useEffect } from 'react'
import { useScrollRig, useCanvas, ScrollScene, PerspectiveCameraScene, ScrollDomPortal } from '@14islands/r3f-scroll-rig'
import { MathUtils, CameraHelper, FrontSide, BackSide, DoubleSide } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { useFrame, useThree, useLoader, addTail } from 'react-three-fiber'
import { useGLTFLoader, Shadow, useHelper, softShadows } from 'drei'
import { StandardEffects } from './StandardEffects'

import WebGLImage from './image/WebGLImage'

// softShadows()

// function GltfModel({ url, size }) {
//   const gltf = useGLTFLoader(url)
//   // const gltf = useLoader(GLTFLoader, url)
//   return <primitive object={gltf.scene} position={[0, 0, 0]} scale={[size, size, size]} />
// }

const ModelMesh = ({ url, scale, camera, scene, state, parallax = 0, size = 1, position = [0, 0, 0] }) => {
  const mesh = useRef()
  const light = useRef()
  const { requestFrame, preloadScene } = useScrollRig()

  const gltf = useGLTFLoader(url)

  // useEffect(() => {
  //   if (light.current) {
  //     const cameraHelper = new CameraHelper(light.current.shadow.camera)
  //     scene.add(cameraHelper)
  //   }
  // }, [light.current])

  useEffect(() => {
    if (mesh.current) {
      mesh.current.traverseVisible(mesh => {
        // mesh.castShadow = true
        // mesh.receiveShadow = true
        if (mesh.material) {
          // mesh.material.side = DoubleSide
          // mesh.material.shadowSide = FrontSide
          // mesh.material.shadowSide = BackSide
          // mesh.material.shadowSide = DoubleSide
        }
      })
    }
  }, [mesh.current])

  useFrame(() => {
    if (!state.bounds.inViewport) return

    mesh.current.rotation.y = Math.PI / 2 + state.bounds.progress * Math.PI * 1
    mesh.current.rotation.x = Math.PI / 3 - state.bounds.progress * Math.PI * 0.5 * 1

    // light.current.intensity = MathUtils.lerp(0.0, 1.0, state.bounds.viewport*2)
    //   const parallaxProgress = state.bounds.progress * 2 - 1
    //   mesh.current.position.y = parallax * parallaxProgress

    if (state.bounds.inViewport) {
      requestFrame()
    }
  })

  // preload Model
  useEffect(() => {
    preloadScene(scene, camera)
  }, [gltf])


  // const size = Math.min(scale.width, scale.height) * 0.5 * 1
  size = Math.min(scale.width, scale.height) * size
  return (
    <>
      <ambientLight intensity={0.5} />
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
          // ref={mesh}
          object={gltf.scene}
          // position={[0, -size * 1.5, 0]}
          position={position}
          scale={[size, size, size]}
        />

        {/* <Shadow
        // color="#ff0000"
          scale={[scale.width * 0.5, scale.width * 0.5 * 0.2, 1]}
          opacity={0.1}
          position={[0, -scale.height * 0.401, 0]}
          rotation={[-Math.PI * 0.5, 0, 0]}
        /> */}
        <Shadow
          scale={[scale.width * 0.4, scale.width * 0.2, 1]}
          opacity={0.1}
          position={[0, -scale.height * 0.4, 0]}
          rotation={[-Math.PI * 0.5, 0, 0]}
        />
      </mesh>

      {/* <mesh position={[0, .1, 0]} rotation={[Math.PI / 8, Math.PI / 8, 0]} castShadow>
        <boxBufferGeometry attach="geometry" args={[size, size, size]} />
        <meshNormalMaterial attach="material" />
      </mesh> */}

      {/* <mesh position={[0, -scale.height * 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeBufferGeometry attach="geometry" args={[scale.width * 2, scale.height * 2, 1, 1]} />
        <shadowMaterial attach="material" opacity={0.2} />
      </mesh> */}
      {/* <StandardEffects camera={camera.current} scene={scene} bloom={{ luminanceThreshold: 0.99 }} /> */}
    </>
  )
}

const InlineModel = ({ src, aspectRatio, url, parallax, size, position }) => {
  const ref = useRef()

  useCanvas(
    <PerspectiveCameraScene el={ref} debug={false}>
      {(props) => {
        return <ModelMesh {...props} url={url} parallax={parallax} size={size} position={position} />
      }}
    </PerspectiveCameraScene>,
  )

  return <div style={{ width: '100%', height: '100%', background: 'green' }} ref={ref}></div>
}

export default InlineModel
