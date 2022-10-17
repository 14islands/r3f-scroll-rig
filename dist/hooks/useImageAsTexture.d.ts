import { RefObject } from 'react';
import { Texture } from 'three';
declare function useImageAsTexture(imgRef: RefObject<HTMLImageElement>, { initTexture, premultiplyAlpha }?: {
    initTexture?: boolean | undefined;
    premultiplyAlpha?: string | undefined;
}): Texture;
export { useImageAsTexture };
export default useImageAsTexture;
