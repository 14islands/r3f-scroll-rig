import './styles/index.css';
export { GlobalCanvas } from './components/GlobalCanvas';
export { ScrollScene } from './components/ScrollScene';
export { ViewportScrollScene } from './components/ViewportScrollScene';
export { UseCanvas } from './components/UseCanvas';
export { useScrollRig } from './hooks/useScrollRig';
export { useCanvas } from './hooks/useCanvas';
export { useScrollbar } from './scrollbar/useScrollbar';
export { useTracker } from './hooks/useTracker';
export { useImageAsTexture } from './hooks/useImageAsTexture';
export { SmoothScrollbar } from './scrollbar/SmoothScrollbar';
export declare const styles: {
    hidden: string;
    hiddenWhenSmooth: string;
    transparentColor: string;
    transparentColorWhenSmooth: string;
};
export { useCanvasStore } from './store';
