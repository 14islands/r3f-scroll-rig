import React, { MutableRefObject } from 'react';
import { Mesh } from 'three';
interface WebGLImageProps {
    el: MutableRefObject<HTMLImageElement>;
    scale?: any;
    scrollState?: any;
    vertexShader?: string;
    fragmentShader?: string;
    invalidateFrameLoop: boolean;
    widthSegments?: number;
    heightSegments?: number;
}
export declare const WebGLImage: React.ForwardRefExoticComponent<WebGLImageProps & React.RefAttributes<Mesh<import("three").BufferGeometry<import("three").NormalBufferAttributes>, import("three").Material | import("three").Material[], import("three").Object3DEventMap>>>;
export {};
