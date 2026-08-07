import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Toast, type ToastPayload } from './Toast'
import { setToastPublisher } from './toastBridge'

export type ShowToastInput = Omit<ToastPayload, 'id'>

interface ToastContextValue {
  show: (input: ShowToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastPayload | null>(null)
  const nextId = useRef(0)

  const show = useCallback((input: ShowToastInput) => {
    nextId.current += 1
    setCurrent({ ...input, id: nextId.current })
    Haptics.notificationAsync(
      input.tone === 'error'
        ? Haptics.NotificationFeedbackType.Error
        : Haptics.NotificationFeedbackType.Success
    ).catch(() => {})
  }, [])

  const dismiss = useCallback((id: number) => {
    setCurrent((prev) => (prev && prev.id === id ? null : prev))
  }, [])

  useEffect(() => {
    setToastPublisher(show)
    return () => setToastPublisher(null)
  }, [show])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {current ? (
        <View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
          <Toast toast={current} onDismiss={dismiss} />
        </View>
      ) : null}
    </ToastContext.Provider>
  )
}
