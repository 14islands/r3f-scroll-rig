import { Object3D } from 'three';
declare type CulledObject = {
    wasFrustumCulled?: boolean;
    wasVisible?: boolean;
} & Object3D;
export declare function setAllCulled(obj: CulledObject, overrideCulled: boolean): void;
export {};
