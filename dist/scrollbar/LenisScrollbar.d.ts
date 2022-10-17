import { ReactElement } from 'react';
export declare type LenisScrollCallback = (props: {
    scroll: number;
    limit: number;
    velocity: number;
    direction: string;
    progress: number;
}) => void;
declare type LenisScrollToTarget = number | HTMLElement | string;
declare type LenisScrollToConfig = {
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
};
export interface ILenisScrollbar {
    stop: () => void;
    start: () => void;
    on: (event: string, cb: LenisScrollCallback) => void;
    once: (event: string, cb: LenisScrollCallback) => void;
    off: (event: string, cb: LenisScrollCallback) => void;
    scrollTo: LenisScrollTo;
    raf: (time: number) => void;
}
export declare function LenisScrollbar({ children, duration, easing, smooth, direction, config, ...props }: LenisScrollbarProps, ref: any): ReactElement<any, string | import("react").JSXElementConstructor<any>>;
declare const _default: import("react").ForwardRefExoticComponent<LenisScrollbarProps & import("react").RefAttributes<unknown>>;
export default _default;
