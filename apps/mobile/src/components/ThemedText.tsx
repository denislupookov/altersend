import {
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps,
  type TextProps
} from 'react-native'
import { useTheme } from '@altersend/components'

export function Text({ style, ...props }: TextProps) {
  const { fontFamilyName } = useTheme()
  return (
    <NativeText
      {...props}
      style={[fontFamilyName ? { fontFamily: fontFamilyName } : null, style]}
    />
  )
}

export function TextInput({ style, ...props }: TextInputProps) {
  const { fontFamilyName } = useTheme()
  return (
    <NativeTextInput
      {...props}
      style={[fontFamilyName ? { fontFamily: fontFamilyName } : null, style]}
    />
  )
}
