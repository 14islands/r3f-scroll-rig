import { Component, ReactNode } from 'react';
interface ICanvasErrorBoundary {
    children: ReactNode;
    onError: () => void;
}
export declare class CanvasErrorBoundary extends Component<{}, ICanvasErrorBoundary> {
    constructor(props: any);
    static getDerivedStateFromError(error: any): {
        error: any;
    };
    render(): any;
}
export {};
