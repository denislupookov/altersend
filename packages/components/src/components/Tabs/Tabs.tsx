import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useContext,
  type ReactNode
} from 'react'
import { html } from 'react-strict-dom'
import { styles } from './styles'
import { TabIndicator } from './TabIndicator'

type DivElementProps = Parameters<typeof html.div>[0]
type ButtonElementProps = Parameters<typeof html.button>[0]
type ButtonKeyDownEvent = Parameters<NonNullable<ButtonElementProps['onKeyDown']>>[0]
type ButtonKeyboardEvent = ButtonKeyDownEvent & {
  defaultPrevented?: boolean
  preventDefault?: () => void
}

interface FocusableElement {
  focus(): void
}

interface TriggerRegistration {
  disabled: boolean
  element: FocusableElement | null
  value: string
}

interface TabsContextValue {
  baseId: string
  focusByOffset: (currentValue: string, offset: number) => void
  focusFirst: () => void
  focusLast: () => void
  onValueChange: (value: string) => void
  registerTrigger: (registration: TriggerRegistration) => void
  size: TabsSize
  stretch: boolean
  unregisterTrigger: (value: string) => void
  value: string
}

export type TabsSize = 'sm' | 'md'

const TabsContext = createContext<TabsContextValue | null>(null)

export interface TabsProps extends Omit<DivElementProps, 'style'> {
  children: ReactNode
  onValueChange: (value: string) => void
  size?: TabsSize
  stretch?: boolean
  value: string
}

export interface TabsListProps extends Omit<DivElementProps, 'style'> {
  children: ReactNode
}

export interface TabsTriggerProps extends Omit<
  ButtonElementProps,
  'children' | 'onClick' | 'style'
> {
  children: ReactNode
  onClick?: ButtonElementProps['onClick']
  value: string
}

export interface TabsContentProps extends Omit<DivElementProps, 'style'> {
  children: ReactNode
  value: string
}

function useTabsContext(componentName: string): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error(`${componentName} must be used within Tabs.`)
  }

  return context
}

function sanitizeValue(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-')
}

function getEnabledTriggers(
  registrations: Map<string, TriggerRegistration>
): TriggerRegistration[] {
  return Array.from(registrations.values()).filter(
    (registration): registration is TriggerRegistration & { element: FocusableElement } =>
      registration.element !== null && !registration.disabled
  )
}

export function Tabs({
  children,
  onValueChange,
  size = 'md',
  stretch = false,
  value,
  ...props
}: TabsProps) {
  const generatedId = useId()
  const baseId = props.id ?? generatedId
  const triggerRegistrationsRef = useRef<Map<string, TriggerRegistration>>(new Map())

  const registerTrigger = useCallback((registration: TriggerRegistration) => {
    triggerRegistrationsRef.current.set(registration.value, registration)
  }, [])

  const unregisterTrigger = useCallback((triggerValue: string) => {
    triggerRegistrationsRef.current.delete(triggerValue)
  }, [])

  const focusTrigger = useCallback(
    (triggerValue: string) => {
      const registration = triggerRegistrationsRef.current.get(triggerValue)
      if (!registration?.element || registration.disabled) {
        return
      }

      registration.element.focus()
      onValueChange(triggerValue)
    },
    [onValueChange]
  )

  const focusByOffset = useCallback(
    (currentValue: string, offset: number) => {
      const enabledTriggers = getEnabledTriggers(triggerRegistrationsRef.current)
      const currentIndex = enabledTriggers.findIndex(
        (registration) => registration.value === currentValue
      )

      if (currentIndex === -1 || enabledTriggers.length === 0) {
        return
      }

      const nextIndex = (currentIndex + offset + enabledTriggers.length) % enabledTriggers.length
      const nextTrigger = enabledTriggers[nextIndex]
      focusTrigger(nextTrigger.value)
    },
    [focusTrigger]
  )

  const focusFirst = useCallback(() => {
    const enabledTriggers = getEnabledTriggers(triggerRegistrationsRef.current)
    const firstTrigger = enabledTriggers[0]
    if (!firstTrigger) {
      return
    }

    focusTrigger(firstTrigger.value)
  }, [focusTrigger])

  const focusLast = useCallback(() => {
    const enabledTriggers = getEnabledTriggers(triggerRegistrationsRef.current)
    const lastTrigger = enabledTriggers[enabledTriggers.length - 1]
    if (!lastTrigger) {
      return
    }

    focusTrigger(lastTrigger.value)
  }, [focusTrigger])

  return (
    <TabsContext.Provider
      value={{
        baseId,
        focusByOffset,
        focusFirst,
        focusLast,
        onValueChange,
        registerTrigger,
        size,
        stretch,
        unregisterTrigger,
        value
      }}
    >
      <html.div {...props} style={[styles.root, stretch && styles.rootStretch]}>
        {children}
      </html.div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, ...props }: TabsListProps) {
  const { stretch, value } = useTabsContext('TabsList')
  const triggerValues = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => (child.props as { value?: string }).value)
    .filter((triggerValue): triggerValue is string => typeof triggerValue === 'string')
  const count = triggerValues.length
  const activeIndex = Math.max(0, triggerValues.indexOf(value))

  return (
    <html.div
      {...props}
      aria-orientation='horizontal'
      role='tablist'
      style={[styles.list, stretch && styles.listStretch]}
    >
      {count > 1 ? (
        <TabIndicator activeIndex={activeIndex} count={count} stretch={stretch} />
      ) : null}
      {children}
    </html.div>
  )
}

export function TabsTrigger({ children, onClick, value, ...props }: TabsTriggerProps) {
  const context = useTabsContext('TabsTrigger')
  const { focusByOffset, focusFirst, focusLast, registerTrigger, unregisterTrigger } = context
  const isActive = context.value === value
  const triggerId = `${context.baseId}-trigger-${sanitizeValue(value)}`
  const panelId = `${context.baseId}-panel-${sanitizeValue(value)}`
  const triggerRef = useRef<FocusableElement | null>(null)
  const disabled = Boolean(props.disabled)

  const handleClick = (event: Parameters<NonNullable<TabsTriggerProps['onClick']>>[0]) => {
    onClick?.(event)
    if (!event.defaultPrevented) {
      context.onValueChange(value)
    }
  }

  useEffect(() => {
    registerTrigger({
      disabled,
      element: triggerRef.current,
      value
    })
  }, [disabled, registerTrigger, value])

  useEffect(() => {
    return () => {
      unregisterTrigger(value)
    }
  }, [unregisterTrigger, value])

  const handleKeyDown = (event: ButtonKeyDownEvent) => {
    props.onKeyDown?.(event)
    const keyboardEvent = event as ButtonKeyboardEvent

    if (keyboardEvent.defaultPrevented) {
      return
    }

    if (keyboardEvent.key === 'ArrowRight') {
      keyboardEvent.preventDefault?.()
      focusByOffset(value, 1)
      return
    }

    if (keyboardEvent.key === 'ArrowLeft') {
      keyboardEvent.preventDefault?.()
      focusByOffset(value, -1)
      return
    }

    if (keyboardEvent.key === 'Home') {
      keyboardEvent.preventDefault?.()
      focusFirst()
      return
    }

    if (keyboardEvent.key === 'End') {
      keyboardEvent.preventDefault?.()
      focusLast()
    }
  }

  return (
    <html.button
      {...props}
      aria-controls={panelId}
      aria-selected={isActive}
      id={triggerId}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      ref={(element) => {
        triggerRef.current = element as FocusableElement | null
      }}
      role='tab'
      style={[
        styles.trigger,
        context.size === 'sm' && styles.triggerSm,
        context.stretch && styles.triggerStretch,
        disabled && styles.triggerDisabled
      ]}
      tabIndex={isActive ? 0 : -1}
      type='button'
    >
      <html.span
        style={[
          styles.triggerLabel,
          context.size === 'sm' && styles.triggerLabelSm,
          isActive && styles.triggerLabelActive
        ]}
      >
        {children}
      </html.span>
    </html.button>
  )
}

export function TabsContent({ children, value, ...props }: TabsContentProps) {
  const context = useTabsContext('TabsContent')
  const triggerId = `${context.baseId}-trigger-${sanitizeValue(value)}`
  const panelId = `${context.baseId}-panel-${sanitizeValue(value)}`

  if (context.value !== value) {
    return null
  }

  return (
    <html.div
      {...props}
      aria-labelledby={triggerId}
      id={panelId}
      role='tabpanel'
      style={styles.content}
      tabIndex={0}
    >
      {children}
    </html.div>
  )
}
