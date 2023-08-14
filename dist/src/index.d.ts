import './styles/index.css';
export { GlobalCanvas } from './components/GlobalCanvas';
export { type ScrollSceneChildProps, ScrollScene } from './components/ScrollScene';
export { type ViewportScrollSceneChildProps, ViewportScrollScene } from './components/ViewportScrollScene';
export { UseCanvas } from './components/UseCanvas';
export { useScrollRig } from './hooks/useScrollRig';
export { useCanvas } from './hooks/useCanvas';
export { useScrollbar } from './scrollbar/useScrollbar';
export { useTracker } from './hooks/useTracker';
export { useImageAsTexture } from './hooks/useImageAsTexture';
export { default as SmoothScrollbar } from './components/R3FSmoothScrollbar';
export declare const styles: {
    hidden: string;
    hiddenWhenSmooth: string;
    transparentColor: string;
    transparentColorWhenSmooth: string;
};
export { useCanvasStore } from './store';
export type { ScrollState } from './hooks/useTrackerTypes';
