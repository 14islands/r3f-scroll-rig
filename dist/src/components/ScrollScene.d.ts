import React, { MutableRefObject, ReactNode } from 'react';
import type { ScrollState } from '../hooks/useTrackerTypes';
export interface ScrollSceneChildProps {
    track: MutableRefObject<HTMLElement>;
    margin: number;
    priority: number;
    scale: vec3 | undefined;
    scrollState: ScrollState;
    inViewport: boolean;
}
interface ScrollScene {
    track: MutableRefObject<HTMLElement>;
    children: (state: ScrollSceneChildProps) => ReactNode;
    margin?: number;
    inViewportMargin?: string;
    inViewportThreshold?: number;
    visible?: boolean;
    hideOffscreen?: boolean;
    scissor?: boolean;
    debug?: boolean;
    as?: string;
    priority?: number;
}
declare const ScrollScene: React.MemoExoticComponent<({ track, children, margin, inViewportMargin, inViewportThreshold, visible, hideOffscreen, scissor, debug, as, priority, ...props }: ScrollScene) => JSX.Element>;
export { ScrollScene };
