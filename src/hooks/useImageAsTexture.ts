import { useEffect, RefObject } from 'react'
import { useThree, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import { suspend } from 'suspend-react'

/**
 *  Reasons for why this exists:
 *
 *  - Make sure we don't load image twice - <img> tag already loads image,
 *    wait for it to finish so we get a cache hit
 *
 *  - Get responsive image size using currentSrc/src from the <img/> if available
 *
 *  - Auto-load new texture if image currentSrc changes
 *    - This supports lazy loading images (although the GPU upload can cause jank)
 *
 */

function useImageAsTexture(imgRef: RefObject<HTMLImageElement>, { initTexture = true } = {}) {
  const { gl } = useThree()
  const { size } = useThree()

  const currentSrc = suspend(() => {
    return new Promise((resolve) => {
      const el = imgRef.current

      // respond to all future load events (resizing might load another image)
      el?.addEventListener('load', () => resolve(el?.currentSrc), { once: true })

      // detect if loaded from browser cache
      if (el?.complete) {
        resolve(el?.currentSrc)
      }
    })
  }, [imgRef, size]) as string

  const texture = useLoader(TextureLoader, currentSrc)

  // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render
  useEffect(
    function uploadTextureToGPU() {
      initTexture && gl.initTexture(texture)
    },
    [gl, texture, initTexture]
  )

  return texture
}

export { useImageAsTexture }
export default useImageAsTexture
