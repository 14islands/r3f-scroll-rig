import { Object3D } from 'three';
type CulledObject = {
    wasFrustumCulled?: boolean;
    wasVisible?: boolean;
} & Object3D;
export declare function setAllCulled(obj: CulledObject, overrideCulled: boolean): void;
export {};
