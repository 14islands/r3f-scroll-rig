import { MutableRefObject } from 'react';
import type { TrackerOptions, Tracker } from './useTracker.d';
/**
 * Returns the current Scene position of the DOM element
 * based on initial getBoundingClientRect and scroll delta from start
 */
declare function useTracker(track: MutableRefObject<HTMLElement>, options?: TrackerOptions): Tracker;
export { useTracker };
export default useTracker;
