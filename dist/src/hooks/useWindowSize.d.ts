export interface WindowSize {
    width: number;
    height: number;
}
type ConfigProps = {
    debounce?: number;
};
export declare function useWindowSize({ debounce }?: ConfigProps): WindowSize;
export {};
