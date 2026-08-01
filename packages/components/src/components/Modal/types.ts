import type { ReactNode } from 'react'

export interface ModalProps {
  open: boolean
  title?: string
  subtitle?: string
  width?: number
  closeLabel?: string
  backLabel?: string
  onClose: () => void
  onBack?: () => void
  children: ReactNode
}
