import React, { useEffect, useRef } from 'react'
import { Animated, Easing, Platform } from 'react-native'
import { ToastIos } from './ToastIos'
import { ToastAndroid } from './ToastAndroid'

export type ToastTone = 'success' | 'error'

export interface ToastPayload {
  id: number
  title: string
  tone?: ToastTone
  hint?: string
  actionLabel?: string
  onPress?: () => void
  durationMs?: number
}

interface ToastProps {
  toast: ToastPayload
  onDismiss: (id: number) => void
}

const DEFAULT_DURATION = 5000
const ENTER_DURATION = 260
const EXIT_DURATION = 200

export function Toast({ toast, onDismiss }: ToastProps) {
  const translate = useRef(new Animated.Value(Platform.OS === 'ios' ? -60 : 60)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translate, {
        toValue: 0,
        duration: ENTER_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: ENTER_DURATION,
        useNativeDriver: true
      })
    ]).start()

    const timer = setTimeout(() => dismiss(), toast.durationMs ?? DEFAULT_DURATION)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once animation per toast.id; deps would force re-trigger
  }, [toast.id])

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translate, {
        toValue: Platform.OS === 'ios' ? -60 : 60,
        duration: EXIT_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: EXIT_DURATION,
        useNativeDriver: true
      })
    ]).start(() => onDismiss(toast.id))
  }

  const handlePress = () => {
    toast.onPress?.()
    dismiss()
  }

  if (Platform.OS === 'ios') {
    return (
      <ToastIos
        title={toast.title}
        hint={toast.hint}
        tone={toast.tone}
        translate={translate}
        opacity={opacity}
        onPress={handlePress}
      />
    )
  }

  return (
    <ToastAndroid
      title={toast.title}
      hint={toast.hint}
      tone={toast.tone}
      actionLabel={toast.actionLabel}
      translate={translate}
      opacity={opacity}
      onPress={handlePress}
    />
  )
}
