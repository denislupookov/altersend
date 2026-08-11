import type { ReactNode } from 'react'

export type ModalSize = 'sm' | 'md' | 'lg' | 'panel'

export interface ModalProps {
  open: boolean
  title?: string
  subtitle?: string
  size?: ModalSize
  closeLabel?: string
  backLabel?: string
  onClose: () => void
  onBack?: () => void
  children: ReactNode
}
