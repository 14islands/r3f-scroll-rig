import React, { forwardRef } from 'react'
import { SmoothScrollbar } from '../scrollbar/SmoothScrollbar'
import { ISmoothScrollbar } from '../scrollbar/SmoothScrollbar.d'
import { addEffect, invalidate } from '@react-three/fiber'

function R3FSmoothScrollbar(props: ISmoothScrollbar, ref: any) {
  return <SmoothScrollbar ref={ref} invalidate={invalidate} addEffect={addEffect} {...props} />
}

export default forwardRef<any, ISmoothScrollbar>(R3FSmoothScrollbar)
