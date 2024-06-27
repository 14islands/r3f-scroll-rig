import { ReactNode } from 'react';
import { ScrollRigState } from '../hooks/useScrollRig';
interface IUseCanvas {
    children: ReactNode | ((props: ScrollRigState) => ReactNode);
    id?: string;
    dispose?: boolean;
    [key: string]: any;
}
declare const UseCanvas: import("react").ForwardRefExoticComponent<Pick<IUseCanvas, keyof IUseCanvas> & import("react").RefAttributes<unknown>>;
export { UseCanvas };
