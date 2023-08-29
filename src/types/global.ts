declare type vec2 = {
  x: number
  y: number
  xy: vec2
  yx: vec2
  times: (n: number) => vec2
  div: (n: number) => vec2
  max: () => number
  min: () => number
  sum: () => number
} & [x: number, y: number]

declare type vec3 = {
  x: number
  y: number
  z: number
  xy: vec2
  yx: vec2
  xyz: vec3
  xzy: vec3
  yxz: vec3
  yzx: vec3
  zxy: vec3
  zyx: vec3
  times: (n: number) => vec3
  div: (n: number) => vec3
  max: () => number
  min: () => number
  sum: () => number
} & [x: number, y: number, z: number]

declare module 'vecn' {
  export function vec2(x: number, y: number): vec2
  export function vec3(x: number, y: number, z: number): vec3
}
