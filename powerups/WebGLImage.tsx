import React, {
  useRef,
  useMemo,
  useEffect,
  forwardRef,
  MutableRefObject,
  ForwardedRef,
  useImperativeHandle,
} from 'react'
import { Color, Vector2, ShaderMaterial, Mesh, ShaderMaterialParameters } from 'three'
import { useFrame, useThree } from '@react-three/fiber'

import { useScrollRig, useImageAsTexture, useScrollbar } from '../src'

interface WebGLImageProps {
  el: MutableRefObject<HTMLImageElement>
  scale?: any
  scrollState?: any
  vertexShader?: string
  fragmentShader?: string
  invalidateFrameLoop: boolean
  widthSegments?: number
  heightSegments?: number
}

export const WebGLImage = forwardRef(
  (
    {
      el,
      scale,
      scrollState,
      vertexShader,
      fragmentShader,
      invalidateFrameLoop = false,
      widthSegments = 128,
      heightSegments = 128,
      ...props
    }: WebGLImageProps,
    ref: ForwardedRef<Mesh>
  ) => {
    const material = useRef<ShaderMaterial>(null!)
    const mesh = useRef<Mesh>(null!)
    useImperativeHandle(ref, () => mesh.current)

    const { invalidate, gl, size } = useThree()
    const pixelRatio = useThree((s) => s.viewport.dpr)
    const { scroll } = useScrollbar()
    const { scaleMultiplier } = useScrollRig()

    const texture = useImageAsTexture(el)

    const uniforms = useMemo(() => {
      return {
        u_color: { value: new Color('black') },
        u_time: { value: 0 },
        u_pixelRatio: { value: pixelRatio },
        u_progress: { value: 0 },
        u_visibility: { value: 0 },
        u_viewport: { value: 0 },
        u_velocity: { value: 0 }, // scroll speed
        u_res: { value: new Vector2() }, // screen dimensions
        u_rect: { value: new Vector2() }, // DOM el dimensions
        u_size: { value: new Vector2() }, // Texture dimensions
        u_texture: { value: null },
        u_loaded: { value: false },
        u_scaleMultiplier: { value: scaleMultiplier },
      }
    }, [pixelRatio])

    // Fade in when texture loaded
    useEffect(() => {
      if (!texture) return
      if (!material.current) return
      material.current.uniforms.u_texture.value = texture
      material.current.uniforms.u_size.value.set(texture.image.width, texture.image.height)
      material.current.uniforms.u_loaded.value = true
    }, [texture, gl])

    useEffect(() => {
      if (!material.current) return
      material.current.uniforms.u_res.value.set(size.width, size.height)
      material.current.uniforms.u_rect.value.set(scale?.[0], scale?.[1])
    }, [size, scale])

    useFrame((_, delta) => {
      if (!scrollState.inViewport || !mesh.current || !material.current) return

      if (!material.current.uniforms.u_loaded.value) return

      material.current.uniforms.u_time.value += delta

      // update scale while animating too
      material.current.uniforms.u_rect.value.set(mesh.current.scale.x, mesh.current.scale.y)

      // px velocity
      material.current.uniforms.u_velocity.value = scroll.velocity

      // percent of total visible distance that was scrolled (0 = just outside bottom of screen, 1 = just outside top of screen)
      material.current.uniforms.u_progress.value = scrollState.progress

      // percent of item height in view
      material.current.uniforms.u_visibility.value = scrollState.visibility
      // percent of window height scrolled since visible
      material.current.uniforms.u_viewport.value = scrollState.viewport

      if (invalidateFrameLoop) invalidate()
    })

    const args = useMemo(
      () => [
        {
          vertexShader,
          fragmentShader,
        },
      ],
      [vertexShader, fragmentShader]
    )

    return (
      <>
        <mesh ref={mesh} {...props}>
          <planeGeometry attach="geometry" args={[1, 1, widthSegments, heightSegments]} />
          <shaderMaterial
            ref={material}
            args={args as [ShaderMaterialParameters]}
            transparent={true}
            uniforms={uniforms}
          />
        </mesh>
      </>
    )
  }
)
