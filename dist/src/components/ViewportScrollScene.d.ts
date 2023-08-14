import { MutableRefObject, ReactNode } from 'react';
import type { ScrollState } from '../hooks/useTrackerTypes';
interface IViewportScrollScene {
    track: MutableRefObject<HTMLElement>;
    children: (state: ViewportScrollSceneChildProps) => ReactNode;
    margin?: number;
    inViewportMargin?: string;
    inViewportThreshold?: number;
    visible?: boolean;
    hideOffscreen?: boolean;
    debug?: boolean;
    orthographic?: boolean;
    priority?: number;
    hud?: boolean;
    camera?: any;
}
export interface ViewportScrollSceneChildProps {
    track: MutableRefObject<HTMLElement>;
    margin: number;
    priority: number;
    scale: vec3 | undefined;
    scrollState: ScrollState;
    inViewport: boolean;
}
declare function ViewportScrollScene({ track, margin, // Margin outside viewport to avoid clipping vertex displacement (px)
inViewportMargin, inViewportThreshold, priority, ...props }: IViewportScrollScene): JSX.Element;
export { ViewportScrollScene };
