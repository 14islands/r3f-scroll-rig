import { ReactElement } from 'react';
export type ScrollCallback = (props: {
    scroll: number;
    limit: number;
    velocity: number;
    direction: number;
    progress: number;
}) => void;
export interface ScrollData {
    y: number;
    x: number;
    limit: number;
    velocity: number;
    progress: number;
    direction: number;
    scrollDirection?: string;
}
export type ScrollToTarget = number | HTMLElement | string;
export type ScrollToConfig = {
    offset: number;
    immediate: boolean;
    duration: number;
    easing: (t: number) => number;
};
export interface ISmoothScrollbar {
    children?: (props: any) => ReactElement;
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
