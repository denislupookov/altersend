import { modalWidth } from '../../theme/scales'
import type { ModalSize } from './types'

export const widthForSize: Record<ModalSize, number> = {
  sm: modalWidth.modalWidthSm,
  md: modalWidth.modalWidthMd,
  lg: modalWidth.modalWidthLg,
  panel: modalWidth.modalWidthPanel
}
