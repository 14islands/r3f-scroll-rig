import React, { ReactNode } from 'react';
import PropTypes from 'prop-types';
interface ICanvasErrorBoundary {
    children: ReactNode;
    onError: () => void;
}
declare class CanvasErrorBoundary extends React.Component<{}, ICanvasErrorBoundary> {
    constructor(props: any);
    static propTypes: {
        onError: PropTypes.Requireable<(...args: any[]) => any>;
    };
    static getDerivedStateFromError(error: any): {
        error: any;
    };
    render(): any;
}
export default CanvasErrorBoundary;
