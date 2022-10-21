import React, { MutableRefObject, ReactNode } from 'react';
import { Scene } from 'three';
import { vec3 } from 'vecn';
import type { ScrollState } from '../hooks/useTracker.d';
export interface ScrollSceneState {
    track: MutableRefObject<HTMLElement>;
    margin: number;
    renderOrder: number;
    priority: number;
    scene: Scene;
    scale: vec3 | undefined;
    scrollState: ScrollState;
    inViewport: boolean;
}
interface ScrollSceneProps {
    track: MutableRefObject<HTMLElement>;
    children: (state: ScrollSceneState) => ReactNode;
    margin?: number;
    inViewportMargin?: string;
    inViewportThreshold?: number;
    visible?: boolean;
    hideOffscreen?: boolean;
    scissor?: boolean;
    debug?: boolean;
    as?: string;
    renderOrder?: number;
    priority?: number;
}
declare const ScrollScene: React.MemoExoticComponent<({ track, children, margin, inViewportMargin, inViewportThreshold, visible, hideOffscreen, scissor, debug, as, renderOrder, priority, ...props }: ScrollSceneProps) => JSX.Element>;
export { ScrollScene };
