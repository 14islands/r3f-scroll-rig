import React, { ReactElement } from 'react';
import { LenisScrollCallback } from './LenisScrollbar';
interface ISmoothScrobbar {
    children: (props: any) => ReactElement;
    scrollRestoration?: ScrollRestoration;
    enabled?: boolean;
    locked?: boolean;
    disablePointerOnScroll?: boolean;
    config?: object;
    horizontal?: boolean;
    scrollInContainer?: boolean;
    updateGlobalState?: boolean;
    onScroll?: LenisScrollCallback;
}
export declare const SmoothScrollbar: React.ForwardRefExoticComponent<ISmoothScrobbar & React.RefAttributes<unknown>>;
export {};
