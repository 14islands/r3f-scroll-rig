import React, { MutableRefObject, ReactNode } from 'react';
import { Scene, Camera } from 'three';
import { vec3 } from 'vecn';
import type { ScrollState } from '../hooks/useTracker.d';
interface ViewportScrollSceneState {
    track: MutableRefObject<HTMLElement>;
    margin: number;
    renderOrder: number;
    priority: number;
    scene: Scene;
    camera: Camera;
    scale: vec3 | undefined;
    scrollState: ScrollState;
    inViewport: boolean;
}
interface ViewportScrollScene {
    track: MutableRefObject<HTMLElement>;
    children: (state: ViewportScrollSceneState) => ReactNode;
    margin?: number;
    inViewportMargin?: string;
    inViewportThreshold?: number;
    visible?: boolean;
    hideOffscreen?: boolean;
    debug?: boolean;
    orthographic?: boolean;
    as?: string;
    renderOrder?: number;
    priority?: number;
}
declare const ViewportScrollScene: React.MemoExoticComponent<({ track, children, margin, inViewportMargin, inViewportThreshold, visible, hideOffscreen, debug, orthographic, renderOrder, priority, ...props }: ViewportScrollScene) => JSX.Element>;
export { ViewportScrollScene };
