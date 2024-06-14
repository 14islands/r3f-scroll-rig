type PreloadCallback = (gl: any, scene: any, camera: any) => void;
export declare const config: {
    PRIORITY_PRELOAD: number;
    PRIORITY_SCISSORS: number;
    PRIORITY_VIEWPORTS: number;
    PRIORITY_GLOBAL: number;
    DEFAULT_SCALE_MULTIPLIER: number;
    preloadQueue: PreloadCallback[];
};
export {};
