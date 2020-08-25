import { useEffect } from 'react'

export const useDelayedEffect = (fn, deps, ms = 0) => {
  let timer
  useEffect(() => {
    timer = setTimeout(fn, ms)
    return () => clearTimeout(timer)
  }, deps)
}

export default useDelayedEffect
