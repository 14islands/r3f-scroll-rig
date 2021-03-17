import { useState, useEffect } from 'react'
import { addEffect, addAfterEffect } from 'react-three-fiber'
import StatsImpl from 'three/examples/js/libs/stats.min'

console.log('load STATS!')

export function Stats({ showPanel = 0, className, parent }) {
  const [stats] = useState(new StatsImpl())
  useEffect(() => {
    console.log('STATS!', stats)
    if (stats) {
      const node = (parent && parent.current) || document.body
      stats.showPanel(showPanel)
      node.appendChild(stats.dom)
      if (className) stats.dom.classList.add(className)
      const begin = addEffect(() => stats.begin())
      const end = addAfterEffect(() => stats.end())
      return () => {
        node.removeChild(stats.dom)
        begin()
        end()
      }
    }
  }, [parent, stats, className, showPanel])
  return null
}
