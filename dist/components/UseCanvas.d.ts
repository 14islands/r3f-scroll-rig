import { ReactNode } from 'react';
import { ScrollRigState } from '../hooks/useScrollRig';
interface IUseCanvas {
    children: ReactNode | ((props: ScrollRigState) => ReactNode);
    id?: string;
}
declare const UseCanvas: import("react").ForwardRefExoticComponent<IUseCanvas & import("react").RefAttributes<unknown>>;
export { UseCanvas };
