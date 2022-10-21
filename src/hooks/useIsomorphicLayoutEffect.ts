import { useEffect, useLayoutEffect as vanillaUseLayoutEffect } from 'react'

export const isBrowser = typeof window !== 'undefined'

export const useLayoutEffect = isBrowser ? vanillaUseLayoutEffect : useEffect
