import { ReactElement } from 'react';
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
export declare const SmoothScrollbar: ({ children, enabled, locked, scrollRestoration, disablePointerOnScroll, horizontal, scrollInContainer, updateGlobalState, onScroll, config, }: ISmoothScrobbar) => JSX.Element;
export {};
