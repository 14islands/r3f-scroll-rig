import { ReactElement } from 'react';
export declare type ScrollCallback = (props: {
    scroll: number;
    limit: number;
    velocity: number;
    direction: number;
    progress: number;
}) => void;
export declare type ScrollToTarget = number | HTMLElement | string;
export declare type ScrollToConfig = {
    offset: number;
    immediate: boolean;
    duration: number;
    easing: (t: number) => number;
};
export interface ISmoothScrollbar {
    children: (props: any) => ReactElement;
    enabled?: boolean;
    locked?: boolean;
    scrollRestoration?: ScrollRestoration;
    disablePointerOnScroll?: boolean;
    horizontal?: boolean;
    scrollInContainer?: boolean;
    updateGlobalState?: boolean;
    onScroll?: ScrollCallback;
    config?: object;
    invalidate?: () => void;
    addEffect?: (cb: any) => () => void;
}
