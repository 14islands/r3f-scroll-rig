import { useEffect, useState, useCallback } from 'react'
import { useThree } from 'react-three-fiber'
import {
  sRGBEncoding,
  LinearFilter,
  CanvasTexture,
  ImageBitmapLoader,
  TextureLoader,
  RGBFormat,
  RGBAFormat,
} from 'three'

/**
 *  Reasons for why this exists:
 *
 *  - Make sure we don't load image twice - <img> tag already loads image, we need to make sure we get a cache hit
 *
 *  - Get responsive image size using currentSrc/src from the <img/> if available
 *
 *  - Consistent image loading across major browsers
 *    - Safari doesnt support createImageBitmap
 *    - Firefox createImageBitmap doesn't accept 2nd parameter for flipping
 *    - Firefox createImageBitmap seems to flip powerOf2 images by default - Chrome doesn't
 *
 */

// only use ImageBitmapLoader if supported and not FF for now
const useImageBitmap = typeof createImageBitmap !== 'undefined' && /Firefox/.test(navigator.userAgent) === false

// Override fetch to prefer cached images by default
if (typeof window !== 'undefined') {
  const realFetch = window.fetch
  window.fetch = (url, options = { cache: 'force-cache' }, ...args) => realFetch(url, options, ...args)
}

export const useTextureLoader = (url, { disableMipmaps = false } = {}) => {
  const [texture, setTexture] = useState()
  const [imageBitmap, setImageBitmap] = useState()
  const { gl } = useThree()

  const disposeBitmap = useCallback(() => {
    if (imageBitmap && imageBitmap.close) {
      imageBitmap.close()
      setImageBitmap(null)
    }
  }, [imageBitmap])

  const loadTexture = (url) => {
    let loader
    if (useImageBitmap) {
      loader = new ImageBitmapLoader()
      // Flip if texture
      loader.setOptions({
        imageOrientation: 'flipY',
        premultiplyAlpha: 'none',
      })
    } else {
      loader = new TextureLoader()
    }
    loader.setCrossOrigin('anonymous')

    loader.load(
      url,
      (texture) => {
        if (useImageBitmap) {
          setImageBitmap(imageBitmap)
          texture = new CanvasTexture(texture)
        }

        // max quality
        texture.anisotropy = gl.capabilities.getMaxAnisotropy()
        texture.encoding = sRGBEncoding

        if (disableMipmaps) {
          texture.minFilter = LinearFilter
          texture.generateMipmaps = false
        }

        // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
        // eslint-disable-next-line no-useless-escape
        var isJPEG = url.search(/\.jpe?g($|\?)/i) > 0 || url.search(/^data\:image\/jpeg/) === 0

        texture.format = isJPEG ? RGBFormat : RGBAFormat

        setTexture(texture)
      },
      null,
      (err) => {
        console.error('err', err)
      },
    )
  }

  useEffect(() => {
    if (url) {
      loadTexture(url)
    }
  }, [url])

  return [texture, disposeBitmap]
}

export const useImgTagAsTexture = (imgEl, opts) => {
  const [url, setUrl] = useState(null)
  const [texture, disposeBitmap] = useTextureLoader(url, opts)

  const loadTexture = () => {
    imgEl.removeEventListener('load', loadTexture)
    setUrl(imgEl.currentSrc || imgEl.src)
  }

  useEffect(() => {
    // Wait for DOM <img> to finish loading so we get a cache hit from our upcoming fetch API request
    if (imgEl) {
      imgEl.addEventListener('load', loadTexture)
      // check if image was loaded from browser cache
      if (imgEl.complete) {
        loadTexture()
      }
    }
  }, [imgEl])

  return [texture, disposeBitmap]
}

export default useImgTagAsTexture
