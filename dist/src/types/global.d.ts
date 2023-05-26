declare type vec3 = {
    x: number;
    y: number;
    z: number;
    xy: [x: number, y: number];
    xyz: [x: number, y: number, z: number];
    times: (n: number) => vec3;
    div: (n: number) => vec3;
    max: () => number;
    min: () => number;
    sum: () => number;
} & [x: number, y: number, z: number];
declare module 'vecn' {
    function vec3(x: number, y: number, z: number): vec3;
}
