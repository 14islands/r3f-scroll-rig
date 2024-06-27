import React from 'react';
type Props = JSX.IntrinsicElements['perspectiveCamera'] & {
    makeDefault?: boolean;
    margin?: number;
};
export declare const PerspectiveCamera: React.ForwardRefExoticComponent<Omit<Props, "ref"> & React.RefAttributes<unknown>>;
export {};
