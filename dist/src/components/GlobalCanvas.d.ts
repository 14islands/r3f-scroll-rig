import { ReactNode } from 'react';
import { Props } from '@react-three/fiber';
interface IGlobalCanvas extends Omit<Props, 'children'> {
    as?: any;
    children?: ReactNode | ((globalChildren: ReactNode) => ReactNode);
    orthographic?: boolean;
    onError?: (props: any) => void;
    camera?: any;
    debug?: boolean;
    scaleMultiplier?: number;
    globalRender?: boolean;
    globalPriority?: number;
    globalAutoClear?: boolean;
    globalClearDepth?: boolean;
    loadingFallback?: any;
}
export declare const GlobalCanvas: ({ children, onError, ...props }: IGlobalCanvas) => JSX.Element;
export {};
