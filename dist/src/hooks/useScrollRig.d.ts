import type { Scene, Camera } from 'three';
export interface ScrollRigState {
    debug: boolean;
    isCanvasAvailable: boolean;
    hasSmoothScrollbar: boolean;
    scaleMultiplier: number;
    preloadScene: (scene: Scene, camera: Camera, layer?: number, callback?: any) => void;
    requestRender: (layers?: number[]) => void;
    renderScissor: (args: any) => void;
    renderViewport: (args: any) => void;
    reflow: () => void;
}
/**
 * Public interface for ScrollRig
 */
export declare const useScrollRig: () => ScrollRigState;
