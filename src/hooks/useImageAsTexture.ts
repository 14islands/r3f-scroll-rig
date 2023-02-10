import { useEffect, RefObject, useMemo, useState } from 'react'
import { useThree, useLoader } from '@react-three/fiber'
import { Texture, CanvasTexture, ImageBitmapLoader, TextureLoader, DefaultLoadingManager } from 'three'
import { suspend } from 'suspend-react'
import supportsWebP from 'supports-webp'
import equal from 'fast-deep-equal'

import { useWindowSize } from './useWindowSize'
import { useCanvasStore } from '../store'

/**
 *  Create Threejs Texture from DOM image tag
 *
 *  - Supports <picture> and `srcset` - uses `currentSrc` to get the responsive image source
 *
 *  - Supports lazy-loading image - suspends until first load event. Warning: the GPU upload can cause jank
 *
 *  - Relies on browser cache to avoid loading image twice. We let the <img> tag load the image and suspend until it's ready.
 *
 *  - NOTE: You must add the `crossOrigin` attribute
 *     <img src="" alt="" crossOrigin="anonymous"/>
 */

let hasWebpSupport: boolean = false
// this test is fast - "should" run before first image is requested
supportsWebP.then((supported) => {
  hasWebpSupport = supported
})

function useTextureLoader() {
  // Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
  // expensive work of uploading a texture to the GPU off the main thread.
  // Copied from: github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/GLTFLoader.js#L2424
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) === true
  const isFirefox = navigator.userAgent.indexOf('Firefox') > -1
  // @ts-ignore
  const firefoxVersion = isFirefox ? navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1] : -1
  return typeof createImageBitmap === 'undefined' || isSafari || (isFirefox && firefoxVersion < 98)
}

function useImageAsTexture(
  imgRef: RefObject<HTMLImageElement>,
  { initTexture = true, premultiplyAlpha = 'default' } = {}
) {
  const gl = useThree((s) => s.gl)
  const size = useWindowSize()
  const debug = useCanvasStore((state) => state.debug)

  // This is a workaround for detecting lazy loading images
  // unfortunately the `loadstart` event is not working everywhere: https://bugs.chromium.org/p/chromium/issues/detail?id=458851
  // So we can't suspend while lazy images are loading - only detect when they finished
  const [newSrcDetected, setNewSrcDetected] = useState(imgRef.current?.currentSrc)
  useEffect(() => {
    const el = imgRef.current
    const onLoad = () => {
      setNewSrcDetected(imgRef.current?.currentSrc)
    }
    el?.addEventListener('load', onLoad)
    return () => el?.removeEventListener('load', onLoad)
  }, [imgRef, newSrcDetected, setNewSrcDetected])

  // suspend until we have currentSrc for this `size`
  const currentSrc = suspend(
    () => {
      DefaultLoadingManager.itemStart('waiting for DOM image')
      return new Promise((resolve) => {
        const el = imgRef.current

        function returnResolve() {
          resolve(el?.currentSrc)
          DefaultLoadingManager.itemEnd('waiting for DOM image')
        }

        // respond to future load event if not cached
        el?.addEventListener('load', returnResolve, { once: true })

        // detect if loaded from browser cache
        if (el?.complete) {
          el?.removeEventListener('load', returnResolve)
          returnResolve()
        }
      })
    },
    [imgRef, size, imgRef.current?.currentSrc, newSrcDetected],
    { equal } // use deep-equal since size ref seems to update on route change
  ) as string

  const LoaderProto = useTextureLoader() ? TextureLoader : ImageBitmapLoader

  // @ts-ignore
  const result: any = useLoader(LoaderProto, currentSrc, (loader) => {
    if (loader instanceof ImageBitmapLoader) {
      loader.setOptions({
        colorSpaceConversion: 'none',
        premultiplyAlpha, // "none" increases blocking time in lighthouse
        imageOrientation: 'flipY',
      })
      // Add webp to Accept header if supported
      // TODO: add check for AVIF
      loader.setRequestHeader({
        Accept: `${hasWebpSupport ? 'image/webp,' : ''}*/*`,
      })
    }
  })

  const texture = useMemo(() => {
    if (result instanceof Texture) {
      return result
    }
    if (result instanceof ImageBitmap) {
      return new CanvasTexture(result)
    }
  }, [result]) as Texture

  // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render
  useEffect(
    function uploadTextureToGPU() {
      initTexture && gl.initTexture(texture)
      debug && console.log('useImageAsTexture', 'initTexture()')
    },
    [gl, texture, initTexture]
  )

  return texture
}

export { useImageAsTexture }
