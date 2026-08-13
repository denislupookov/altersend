import type { ReactNode } from 'react'

export interface RadioOption<T extends string = string> {
  value: T
  label: string
  description?: string
}

export interface RadioGroupProps<T extends string = string> {
  options: readonly RadioOption<T>[]
  value: T
  onChange(value: T): void
  expansion?: { value: T; content: ReactNode }
  bare?: boolean
  disabled?: boolean
  'aria-label'?: string
}
