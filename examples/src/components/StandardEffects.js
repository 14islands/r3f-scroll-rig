import { HalfFloatType } from 'three'
import { useMemo, useEffect } from 'react'
import { useLoader, useThree, useFrame } from 'react-three-fiber'
import {
  SMAAImageLoader,
  BlendFunction,
  KernelSize,
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  SSAOEffect,
  NormalPass,
  // @ts-ignore
} from 'postprocessing'

export function StandardEffects({
  smaa = true,
  ao = true,
  bloom = true,
  edgeDetection = 0.1,
  bloomOpacity = 1,
  effects,
  camera,
  scene
}) {
  const { gl, size } = useThree()
  const smaaProps = useLoader(SMAAImageLoader, '')
  const composer = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: HalfFloatType })
    composer.addPass(new RenderPass(scene, camera))
    const smaaEffect = new SMAAEffect(...smaaProps)
    smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(edgeDetection)

    const normalPass = new NormalPass(scene, camera)
    const ssaoEffect = new SSAOEffect(camera, normalPass.renderTarget.texture, {
      blendFunction: BlendFunction.MULTIPLY,
      samples: 21, // May get away with less samples
      rings: 4, // Just make sure this isn't a multiple of samples
      distanceThreshold: 1.0,
      distanceFalloff: 0.0,
      rangeThreshold: 0.015, // Controls sensitivity based on camera view distance **
      rangeFalloff: 0.002,
      luminanceInfluence: 0.9,
      radius: 20, // Spread range
      scale: 1.0, // Controls intensity **
      bias: 0.05,
      ...ao,
    })

    const bloomEffect = new BloomEffect({
      opacity: 1,
      blendFunction: BlendFunction.SCREEN,
      kernelSize: KernelSize.VERY_LARGE,
      luminanceThreshold: 0.9,
      luminanceSmoothing: 0.07,
      height: 600,
      ...bloom,
    })

    bloomEffect.blendMode.opacity.value = bloomOpacity

    let effectsArray = []
    if (effects) effectsArray = effects([smaaEffect, ssaoEffect, bloomEffect])
    else {
      if (smaa) effectsArray.push(smaaEffect)
      if (ao) effectsArray.push(ssaoEffect)
      if (bloom) effectsArray.push(bloomEffect)
    }

    const effectPass = new EffectPass(camera, ...effectsArray)
    effectPass.renderToScreen = true
    composer.addPass(normalPass)
    composer.addPass(effectPass)
    return composer
  }, [camera, gl, scene, smaa, ao, bloom, edgeDetection, bloomOpacity])

  useEffect(() => void composer.setSize(size.width, size.height), [composer, size])
  return useFrame((_, delta) => composer.render(delta), 1)
}
