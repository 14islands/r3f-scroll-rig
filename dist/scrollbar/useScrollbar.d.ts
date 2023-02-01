import { ScrollCallback } from './SmoothScrollbar';
export interface Scroll {
    y: number;
    x: number;
    limit: number;
    velocity: number;
    progress: number;
    direction: number;
    scrollDirection: string;
}
interface UseScrollbarProps {
    enabled: boolean;
    scroll: Scroll;
    scrollTo: (target: any) => void;
    onScroll: (cb: ScrollCallback) => () => void;
}
/**
 * Public interface for ScrollRig
 */
export declare const useScrollbar: () => UseScrollbarProps;
export {};
