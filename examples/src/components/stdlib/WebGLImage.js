import React, { useRef, useMemo, useEffect } from 'react'
import { useScrollRig, useImgTagAsTexture } from '@14islands/r3f-scroll-rig'
import { Color, Vector2, MathUtils } from 'three'
import { useFrame, useThree } from '@react-three/fiber'

import lerp from '@14islands/lerp'

const WebGLImage = ({
  el,
  scale,
  scrollState,
  scene,
  vertexShader,
  fragmentShader,
  invalidateFrameLoop = false,
  widthSegments = 14,
  heightSegments = 14,
  ...props
}) => {
  const material = useRef()
  const mesh = useRef()
  const { preloadScene } = useScrollRig()
  const { invalidate, camera, size } = useThree()
  const pixelRatio = useThree((s) => s.viewport.dpr)

  const [texture] = useImgTagAsTexture(el.current)

  const uniforms = useMemo(() => {
    return {
      u_color: { value: new Color('black') },
      u_time: { value: 0 },
      u_pixelRatio: { value: pixelRatio },
      u_progress: { value: 0 },
      u_visibility: { value: 0 },
      u_viewport: { value: 0 },
      u_velocity: { value: 0 }, // scroll speed
      u_res: { value: new Vector2(size.width, size.height) }, // screen dimensions
      u_rect: { value: new Vector2() }, // DOM el dimensions
      u_size: { value: new Vector2() }, // Texture dimensions
      u_texture: { value: texture },
      u_scaleMultiplier: { value: scale.multiplier },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // // Preload when texture finished loading
  useEffect(() => {
    if (!texture) return
    material.current.uniforms.u_texture.value = texture
    material.current.uniforms.u_size.value.set(texture.image.width, texture.image.height)
    preloadScene(scene, camera)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture])

  useEffect(() => {
    material.current.uniforms.u_res.value.set(size.width, size.height)
    material.current.uniforms.u_rect.value.set(scale.width, scale.height)
  }, [size, scale])

  useFrame((_, delta) => {
    if (!scrollState.inViewport) return

    material.current.uniforms.u_time.value += delta

    // px velocity
    const targetVel = MathUtils.clamp(scrollState.deltaY / 200, -1, 1)
    material.current.uniforms.u_velocity.value = lerp(material.current.uniforms.u_velocity.value, targetVel, 0.1, delta)

    // percent of total visible distance that was scrolled (0 = just outside bottom of screen, 1 = just outside top of screen)
    material.current.uniforms.u_progress.value = scrollState.progress

    // percent of item height in view
    material.current.uniforms.u_visibility.value = scrollState.visibility
    // percent of window height scrolled since visible
    material.current.uniforms.u_viewport.value = scrollState.viewport

    if (invalidateFrameLoop) invalidate()
  })

  return (
    <mesh ref={mesh} scale={[scale.width, scale.height, 1]} {...props}>
      <planeBufferGeometry attach="geometry" args={[1, 1, widthSegments, heightSegments]} />
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
