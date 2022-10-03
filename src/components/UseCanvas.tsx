import { forwardRef, ReactNode } from 'react'
import { useCanvas } from '../hooks/useCanvas'

interface IUseCanvas {
  children: ReactNode
  id?: string // persistent layout id
}

const UseCanvas = forwardRef(({ children, id, ...props }: IUseCanvas, ref) => {
  // auto update canvas with all props
  useCanvas(children, { ...props, ref }, { key: id })
  return null
})

export { UseCanvas }
