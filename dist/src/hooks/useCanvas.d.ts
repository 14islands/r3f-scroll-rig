import { ReactNode } from 'react';
import { ScrollRigState } from '../hooks/useScrollRig';
/**
 * Adds THREE.js object to the GlobalCanvas while the component is mounted
 * @param {object} object THREE.js object3d
 */
declare function useCanvas(object: ReactNode | ((props: ScrollRigState) => ReactNode), props?: any, { key, dispose }?: {
    key?: string;
    dispose?: boolean;
}): (props: any) => void;
export { useCanvas };
