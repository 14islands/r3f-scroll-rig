import { Object3D } from 'three'

type CulledObject = {
  wasFrustumCulled?: boolean
  wasVisible?: boolean
} & Object3D

// Use to override Frustum temporarily to pre-upload textures to GPU
export function setAllCulled(obj: CulledObject, overrideCulled: boolean) {
  if (!obj) return
  if (overrideCulled === false) {
    obj.wasFrustumCulled = obj.frustumCulled
    obj.wasVisible = obj.visible
    obj.visible = true
    obj.frustumCulled = false
  } else {
    obj.visible = !!obj.wasVisible
    obj.frustumCulled = !!obj.wasFrustumCulled
  }
  obj.children.forEach((child) => setAllCulled(child, overrideCulled))
}
