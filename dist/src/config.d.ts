import type { Scene, Camera, WebGLRenderer } from 'three';
type PreloadCallback = (gl: WebGLRenderer, scene: Scene, camera: Camera) => void;
export declare const config: {
    PRIORITY_PRELOAD: number;
    PRIORITY_SCISSORS: number;
    PRIORITY_VIEWPORTS: number;
    PRIORITY_GLOBAL: number;
    DEFAULT_SCALE_MULTIPLIER: number;
    preloadQueue: PreloadCallback[];
};
export {};
