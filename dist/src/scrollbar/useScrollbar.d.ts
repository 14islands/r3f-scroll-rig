/**
 * Public interface for ScrollRig
 */
export declare const useScrollbar: () => {
    enabled: boolean;
    scroll: import("./SmoothScrollbarTypes").ScrollData;
    scrollTo: (target: any) => void;
    onScroll: (cb: import("./SmoothScrollbarTypes").ScrollCallback) => () => void;
    __lenis: import("lenis").default | undefined;
};
