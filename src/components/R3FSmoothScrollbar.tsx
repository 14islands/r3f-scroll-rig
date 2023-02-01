import React from 'react'
import { SmoothScrollbar } from '../scrollbar/SmoothScrollbar'
import { addEffect, invalidate } from '@react-three/fiber'

export default function R3FSmoothScrollbar(props: any) {
  return <SmoothScrollbar invalidate={invalidate} addEffect={addEffect} {...props} />
}
