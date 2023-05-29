import { MutableRefObject, ReactNode } from 'react';
import type { ScrollSceneChildProps } from './ScrollScene';
interface IViewportScrollScene {
    track: MutableRefObject<HTMLElement>;
    children: (state: ScrollSceneChildProps) => ReactNode;
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
declare function ViewportScrollScene({ track, margin, // Margin outside viewport to avoid clipping vertex displacement (px)
inViewportMargin, inViewportThreshold, priority, ...props }: IViewportScrollScene): JSX.Element;
export { ViewportScrollScene };
