import React, { MutableRefObject, ReactNode } from 'react';
import type { ScrollSceneChildProps } from './ScrollScene';
interface ViewportScrollScene {
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
declare function ViewportScrollSceneImpl({ track, margin, // Margin outside viewport to avoid clipping vertex displacement (px)
inViewportMargin, inViewportThreshold, priority, ...props }: ViewportScrollScene): JSX.Element;
declare const ViewportScrollScene: React.MemoExoticComponent<typeof ViewportScrollSceneImpl>;
export { ViewportScrollScene };
