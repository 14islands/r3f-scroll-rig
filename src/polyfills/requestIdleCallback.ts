/**
 * runtime check for requestIdleCallback
 */
export const requestIdleCallback = (callback: () => void, { timeout = 100 } = {}) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout })
  } else {
    setTimeout(callback, 0)
  }
}

export const cancelIdleCallback = (id: any) => {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}
