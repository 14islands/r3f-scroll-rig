type vec3 = {
  x: number
  y: number
  z: number
  xy: [x: number, y: number]
  xyz: [x: number, y: number, z: number]
} & [x: number, y: number, z: number]
declare module 'vecn' {
  export function vec3(number, number, number): vec3
}
