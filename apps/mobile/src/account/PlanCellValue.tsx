import type { StyleProp, TextStyle } from 'react-native'
import { CheckIcon } from '@altersend/components/icons'
import type { PlanCell } from '@altersend/domain'
import { Text } from '@/src/components/ThemedText'

interface Props {
  cell: PlanCell
  color: string
  size: number
  style: StyleProp<TextStyle>
}

export function PlanCellValue({ cell, color, size, style }: Props) {
  if (cell.type === 'check') return <CheckIcon size={size} color={color} />

  return <Text style={[style, { color }]}>{cell.value}</Text>
}
