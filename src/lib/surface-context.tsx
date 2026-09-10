'use client'

import { createContext, useContext, type ReactNode } from 'react'

import { normalizeSurfaceLevel } from './surface-classes'

const SurfaceContext = createContext<number>(1)

export function useSurface(): number {
  return useContext(SurfaceContext)
}

export function SurfaceProvider({ value, children }: { value: number; children: ReactNode }) {
  return (
    <SurfaceContext.Provider value={normalizeSurfaceLevel(value)}>
      {children}
    </SurfaceContext.Provider>
  )
}
