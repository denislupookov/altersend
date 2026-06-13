import { useId, useState, type ReactNode } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { LockIcon } from '../../icons'
import { rawTokens, useTheme } from '../../theme'

type InputChangeEvent = {
  target: { value: string }
  type: 'change'
}

export interface InputProps extends Omit<
  TextInputProps,
  'editable' | 'onChange' | 'onChangeText' | 'secureTextEntry' | 'style'
> {
  description?: string
  disabled?: boolean
  error?: string
  icon?: ReactNode
  label?: string
  mono?: boolean
  onChange?: (event: InputChangeEvent) => void
  onChangeText?: (text: string) => void
  readOnly?: boolean
  secure?: boolean
  trailing?: ReactNode
  type?: string
}

export function Input({
  description,
  disabled = false,
  error,
  icon,
  id,
  label,
  mono = false,
  onBlur,
  onChange,
  onChangeText,
  onFocus,
  readOnly = false,
  secure = false,
  trailing,
  type,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const { fontFamilyName, theme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const hasError = Boolean(error)
  const resolvedIcon = secure ? <LockIcon size={13} /> : icon
  const useWrapper = Boolean(resolvedIcon || trailing)
  const textColor = disabled ? theme.colors.colorTextMuted : theme.colors.colorTextPrimary
  const borderColor = hasError
    ? theme.colors.colorDanger
    : isFocused
      ? theme.colors.colorFocusRing
      : theme.colors.colorBorderPrimary
  const fontFamilyStyle = fontFamilyName ? { fontFamily: fontFamilyName } : null

  const handleChangeText = (text: string) => {
    onChangeText?.(text)
    onChange?.({ target: { value: text }, type: 'change' })
  }

  const handleFocus: NonNullable<TextInputProps['onFocus']> = (event) => {
    setIsFocused(true)
    onFocus?.(event)
  }

  const handleBlur: NonNullable<TextInputProps['onBlur']> = (event) => {
    setIsFocused(false)
    onBlur?.(event)
  }

  const input = (
    <TextInput
      {...props}
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      editable={!disabled && !readOnly}
      id={inputId}
      key={fontFamilyName ?? 'system'}
      onBlur={handleBlur}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      placeholderTextColor={theme.colors.colorTextMuted}
      secureTextEntry={type === 'password'}
      style={[
        styles.input,
        {
          color: textColor
        },
        fontFamilyStyle,
        mono && styles.inputMono,
        !useWrapper && styles.fieldInput
      ]}
      underlineColorAndroid='transparent'
    />
  )

  return (
    <View style={styles.root}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.colorTextMuted }, fontFamilyStyle]}>
          {label}
        </Text>
      ) : null}

      {useWrapper ? (
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: theme.colors.colorBackgroundSubtle,
              borderColor
            }
          ]}
        >
          {resolvedIcon ? <View style={styles.iconSlot}>{resolvedIcon}</View> : null}
          {input}
          {trailing ? (
            <View style={[styles.trailingSlot, { borderColor: theme.colors.colorBorderPrimary }]}>
              {trailing}
            </View>
          ) : null}
        </View>
      ) : (
        <View
          style={[
            styles.field,
            {
              backgroundColor: theme.colors.colorBackgroundSubtle,
              borderColor
            }
          ]}
        >
          {input}
        </View>
      )}

      {error || description ? (
        <Text
          style={[
            styles.hint,
            {
              color: error ? theme.colors.colorDanger : theme.colors.colorTextMuted
            },
            fontFamilyStyle
          ]}
        >
          {error ?? description}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: rawTokens.space.space2,
    width: '100%'
  },
  label: {
    fontSize: rawTokens.fontSize.fontSizeXs,
    fontWeight: '600',
    letterSpacing: 1.3,
    lineHeight: 16,
    textTransform: 'uppercase'
  },
  field: {
    borderRadius: rawTokens.radius.radiusSm,
    borderWidth: 1,
    minHeight: 48
  },
  fieldInput: {
    paddingHorizontal: rawTokens.space.space4
  },
  iconWrapper: {
    alignItems: 'center',
    borderRadius: rawTokens.radius.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: rawTokens.space.space25,
    minHeight: 48,
    paddingLeft: rawTokens.space.space35
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  input: {
    flex: 1,
    fontSize: rawTokens.fontSize.fontSizeLg,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlignVertical: 'center'
  },
  inputMono: {
    fontSize: rawTokens.fontSize.fontSizeBase
  },
  trailingSlot: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderLeftWidth: 1,
    justifyContent: 'center',
    width: 48
  },
  hint: {
    fontSize: rawTokens.fontSize.fontSizeMd,
    lineHeight: 18
  }
})
