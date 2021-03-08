import React, { useRef, useEffect } from 'react'
import { useScrollRig, useCanvas, ViewportScrollScene } from '@14islands/r3f-scroll-rig'
import { useFrame } from 'react-three-fiber'
import { BackSide } from 'three'
import { RayGrab, Hover } from '@react-three/xr'

const BoxMesh = ({scale, scene, camera, scrollState, parallax = 0 }) => {
  const mesh = useRef()
  const light = useRef()
  const light2 = useRef()
  const icosahedron = useRef()
  const icosahedronWrap = useRef()
  const { requestFrame, preloadScene } = useScrollRig()

  const size = Math.min(scale.width, scale.height) * 1.5


  useFrame(({clock}) => {
    icosahedronWrap.current.rotation.y += 0.005
    icosahedron.current.rotation.y = scrollState.progress * Math.PI * 2
    mesh.current.rotation.x = Math.PI * 0.075 - scrollState.progress * Math.PI * 0.15

    const parallaxProgress = (scrollState.progress * 2) - 1
     icosahedronWrap.current.position.x = parallaxProgress * scale.width*0.3

    light.current.position.y = Math.sin(clock.getElapsedTime()) * scale.height * 0.4
    light.current.position.x = Math.cos(clock.getElapsedTime()) * scale.width * 0.4
    light.current.position.z = Math.cos(clock.getElapsedTime()*0.5) * size * 0.2

    light2.current.position.y = Math.sin(Math.PI + clock.getElapsedTime()) * scale.height * 0.4
    light2.current.position.x = Math.cos(Math.PI + clock.getElapsedTime()) * scale.width * 0.4
    light2.current.position.z = Math.cos(Math.PI + clock.getElapsedTime()*0.5) * size * 0.2

    light.current.intensity = (scrollState.viewport - 0.5) *2

    if (scrollState.inViewport) {
      requestFrame()
    }
  })


  // preload Model
  useEffect(() => {
    preloadScene(scene, camera)
    console.log('preloadScene', scene, camera)
  }, [scene, camera])



  return (
    <>
      <pointLight ref={light} intensity={0} distance={15} decay={3} color="magenta"/>
      <pointLight ref={light2} intensity={1} distance={15} decay={3} color="turquoise"/>
      <mesh ref={mesh} position={[0, 0, -size/2]}>
        <boxBufferGeometry attach="geometry" args={[scale.width*1.1, scale.height*1.1, size]} />
        <meshStandardMaterial attach="material" side={BackSide}/>
      </mesh>
      <mesh ref={icosahedronWrap}>
        <mesh ref={icosahedron}>
          <icosahedronGeometry attach="geometry" args={[1, 0]} />
          <meshStandardMaterial attach="material"/>
        </mesh>
      </mesh>
    </>
  )
}

const Viewport3DScene = ({ src, aspectRatio, parallax, ...props }) => {
  const ref = useRef()

  useCanvas(
    <ViewportScrollScene el={ref} debug={false} {...props} scaleMultiplier={0.01}>
      {(props) => {
        return <BoxMesh {...props} parallax={parallax} />
      }}
    </ViewportScrollScene>,
  )

  return <div style={{ width: '100%', height: '100%' }} ref={ref}></div>
}

export default Viewport3DScene
