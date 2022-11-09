import { LenisScrollCallback } from './LenisScrollbar';
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
    onScroll: (cb: LenisScrollCallback) => () => void;
}
/**
 * Public interface for ScrollRig
 */
export declare const useScrollbar: () => UseScrollbarProps;
export {};
