// Linear mapping from range <a1, a2> to range <b1, b2>
export function mapLinear(x: number, a1: number, a2: number, b1: number, b2: number) {
  return b1 + ((x - a1) * (b2 - b1)) / (a2 - a1)
}
