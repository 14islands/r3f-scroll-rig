import { Scene, Camera } from 'three';
export declare const requestRender: (layers?: number[]) => void;
export declare const renderScissor: ({ gl, scene, camera, left, top, width, height, layer, autoClear, clearDepth, }: any) => void;
export declare const renderViewport: ({ gl, scene, camera, left, top, width, height, layer, scissor, autoClear, clearDepth, }: any) => void;
export declare const preloadScene: ({ scene, camera, layer }: {
    scene?: Scene | undefined;
    camera?: Camera | undefined;
    layer?: number | undefined;
}, callback?: () => void) => void;
