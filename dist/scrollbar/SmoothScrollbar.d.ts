import { ReactElement } from 'react';
interface ISmoothScrobbar {
    children: (props: any) => ReactElement;
    scrollRestoration?: ScrollRestoration;
    enabled?: boolean;
    locked?: boolean;
    disablePointerOnScroll?: boolean;
    config?: object;
    horizontal?: boolean;
}
export declare const SmoothScrollbar: ({ children, enabled, locked, scrollRestoration, disablePointerOnScroll, horizontal, config, }: ISmoothScrobbar) => JSX.Element;
export {};
