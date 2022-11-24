import React, { ReactElement } from 'react';
export declare type LenisScrollCallback = (props: {
    scroll: number;
    limit: number;
    velocity: number;
    direction: number;
    progress: number;
}) => void;
export declare type LenisScrollToTarget = number | HTMLElement | string;
export declare type LenisScrollToConfig = {
    offset: number;
    immediate: boolean;
    duration: number;
    easing: (t: number) => number;
};
declare type LenisScrollTo = (target: LenisScrollToTarget, props: LenisScrollToConfig) => void;
declare type LenisScrollbarProps = {
    children: (props: any) => ReactElement;
    duration?: number;
    easing?: (t: number) => number;
    smooth?: boolean;
    direction?: string;
    config?: any;
    smoothTouch?: boolean;
};
export interface ILenisScrollbar {
    stop: () => void;
    start: () => void;
    on: (event: string, cb: LenisScrollCallback) => void;
    once: (event: string, cb: LenisScrollCallback) => void;
    off: (event: string, cb: LenisScrollCallback) => void;
    notify: () => void;
    scrollTo: LenisScrollTo;
    raf: (time: number) => void;
}
export declare function LenisScrollbar({ children, duration, easing, smooth, direction, config, ...props }: LenisScrollbarProps, ref: any): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
declare const _default: React.ForwardRefExoticComponent<LenisScrollbarProps & React.RefAttributes<unknown>>;
export default _default;
