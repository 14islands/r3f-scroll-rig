import React, { useRef, useMemo, useEffect } from 'react'
import { useScrollRig, useImgTagAsTexture } from '@14islands/r3f-scroll-rig'
import { Color, Vector2 } from 'three'
import { useFrame, useThree } from '@react-three/fiber'


const WebGLImage = ({ image, scale, scrollState, scene, vertexShader, fragmentShader, invalidateFrameLoop = false, widthSegments = 128, heightSegments = 128 }) => {
  const material = useRef()
  const mesh = useRef()
  const { invalidate, pixelRatio, preloadScene } = useScrollRig()
  const { camera, size } = useThree()

  const [texture] = useImgTagAsTexture(image.current)

  const uniforms = useMemo(() => {
    return {
      u_color: { value: new Color('black') },
      u_time: { value: 0 },
      u_pixelRatio: { value: pixelRatio },
      u_progress: { value: 0 },
      u_visibility: { value: 0 },
      u_viewport: { value: 0 },
      u_velocity: { value: 0 },
      u_res: { value: new Vector2(size.width, size.height) },
      u_texture: { value: texture },
      u_scaleMultiplier: { value: scale.multiplier },
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Preload when texture finished loading
  useEffect(() => {
    material.current.uniforms.u_texture.value = texture
    preloadScene(scene, camera)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture])

  useEffect(() => {
    material.current.uniforms.u_res.value.set(size.width, size.height)
  }, [size])

  useFrame(() => {
    if (!scrollState.inViewport) return

    material.current.uniforms.u_time.value += 0.01

    // px velocity
    // material.current.uniforms.u_velocity.value = scrollState.velocity

    // percent of total visible distance that was scrolled (0 = just outside bottom of screen, 1 = just outside top of screen)
    material.current.uniforms.u_progress.value = scrollState.progress
    // percent of item height in view
    material.current.uniforms.u_visibility.value = scrollState.visibility
    // percent of window height scrolled since visible
    material.current.uniforms.u_viewport.value = scrollState.viewport

    if (invalidateFrameLoop) invalidate()
 })

  return (
    <mesh ref={mesh}>
      <planeBufferGeometry attach="geometry" args={[scale.width, scale.height, widthSegments, heightSegments]} />
      <shaderMaterial
        ref={material}
        attach="material"
        args={[
          {
            vertexShader,
            fragmentShader,
          },
        ]}
        transparent={true}
        uniforms={uniforms}
      />
    </mesh>
  )
}

export default WebGLImage
