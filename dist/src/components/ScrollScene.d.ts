import { MutableRefObject, ReactNode } from 'react';
import type { ScrollState } from '../hooks/useTrackerTypes';
export interface ScrollSceneChildProps {
    track: MutableRefObject<HTMLElement>;
    margin: number;
    priority: number;
    scale: vec3 | undefined;
    scrollState: ScrollState;
    inViewport: boolean;
}
interface IScrollScene {
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
/**
 * Generic THREE.js Scene that tracks the dimensions and position of a DOM element while scrolling
 * Scene is positioned and scaled exactly above DOM element
 *
 * @author david@14islands.com
 */
declare function ScrollScene({ track, children, margin, // Margin outside scissor to avoid clipping vertex displacement (px)
inViewportMargin, inViewportThreshold, visible, hideOffscreen, scissor, debug, as, priority, ...props }: IScrollScene): JSX.Element;
export { ScrollScene };
