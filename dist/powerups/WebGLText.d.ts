import { ReactNode, MutableRefObject } from 'react';
import { Material } from 'three';
/**
 * Returns a WebGL Troika text mesh styled as the source DOM element
 */
interface WebGLTextProps {
    el: MutableRefObject<HTMLElement>;
    children?: ReactNode;
    material?: Material;
    scale?: any;
    font?: string;
    fontOffsetY?: number;
    fontOffsetX?: number;
    overrideEmissive?: boolean;
    color?: string;
}
export declare const WebGLText: ({ el, children, material, scale, font, fontOffsetY, fontOffsetX, overrideEmissive, color, ...props }: WebGLTextProps) => JSX.Element;
export {};
