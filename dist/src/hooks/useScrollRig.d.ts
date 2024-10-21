import { preloadScene, requestRender, renderScissor, renderViewport } from '../renderer-api';
export interface ScrollRigState {
    debug: boolean;
    isCanvasAvailable: boolean;
    hasSmoothScrollbar: boolean;
    scaleMultiplier: number;
    preloadScene: typeof preloadScene;
    requestRender: typeof requestRender;
    renderScissor: typeof renderScissor;
    renderViewport: typeof renderViewport;
    reflow: () => void;
}
/**
 * Public interface for ScrollRig
 */
export declare const useScrollRig: () => ScrollRigState;
