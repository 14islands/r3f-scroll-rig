/**
 * runtime check for requestIdleCallback
 */
export declare const requestIdleCallback: (callback: () => void, { timeout }?: {
    timeout?: number | undefined;
}) => void;
export declare const cancelIdleCallback: (id: any) => void;
