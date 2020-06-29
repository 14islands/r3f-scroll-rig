import { useRef, useEffect, useState, useCallback } from 'react'
import { useThree } from 'react-three-fiber'
import {
  Math as MathUtils,
  sRGBEncoding,
  LinearFilter,
  CanvasTexture,
  ImageBitmapLoader,
  RGBFormat,
  RGBAFormat,
} from 'three'

// polyfill createImageBitmap for browsers that don't support it
if (typeof window !== 'undefined') {
  require('lib/polyfills/createImageBitmap')
}

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

// keep track if we should try to pass options to createImageBitmap or not
let optionsAreSupported = true

// Override fetch to prefer cached images by default
if (typeof window !== 'undefined') {
  const realFetch = window.fetch
  window.fetch = (url, options = { cache: 'force-cache' }, ...args) => realFetch(url, options, ...args)
}

function isPowerOfTwo(dimensions = { width: -1, height: -1 }) {
  return MathUtils.isPowerOfTwo(dimensions.width) && MathUtils.isPowerOfTwo(dimensions.height)
}

export const useTextureLoader = (url, dimensions, { disableMipmaps = false } = {}) => {
  const hasPreviousError = useRef(false)
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
    const texture = new CanvasTexture()
    const loader = new ImageBitmapLoader()
    loader.setCrossOrigin('anonymous')

    // Flip if options are supported (not FF) and texture is powerOf2
    if (optionsAreSupported && isPowerOfTwo(dimensions)) {
      loader.setOptions({
        imageOrientation: 'flipY',
      })
    }

    loader.load(
      url,
      (imageBitmap) => {
        setImageBitmap(imageBitmap)
        texture.image = imageBitmap

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
        optionsAreSupported = false
        if (!hasPreviousError.current) {
          loadTexture(url)
          hasPreviousError.current = err
        }
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

const useImgTagAsTexture = (imgEl, dimensions, opts) => {
  const [url, setUrl] = useState(null)
  const [texture, disposeBitmap] = useTextureLoader(url, dimensions, opts)

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
