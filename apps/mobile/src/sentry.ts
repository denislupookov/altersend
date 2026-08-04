import * as Sentry from '@sentry/react-native'
import { isCrashReportingEnabled } from './lifecycle/crashReportingStorage'

let initialized = false

function scrubPaths(s: string): string {
  return s
    .replace(/\/Users\/[^/\s"']+/g, '~')
    .replace(/\/home\/[^/\s"']+/g, '~')
    .replace(/\/var\/mobile\/Containers\/[^\s"']+/g, '~')
    .replace(/\/data\/data\/[^\s"']+/g, '~')
}

export function initSentry(): void {
  if (initialized) return
  if (!isCrashReportingEnabled()) return
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    beforeSend(event) {
      for (const ex of event.exception?.values ?? []) {
        if (ex.value) ex.value = scrubPaths(ex.value)
      }
      for (const bc of event.breadcrumbs ?? []) {
        if (bc.message) bc.message = scrubPaths(bc.message)
        if (bc.data) {
          for (const key of Object.keys(bc.data)) {
            if (typeof bc.data[key] === 'string') bc.data[key] = scrubPaths(bc.data[key] as string)
          }
        }
      }
      return event
    }
  })
  initialized = true
}

export function closeSentry(): void {
  if (!initialized) return
  void Sentry.close()
  initialized = false
}

export function captureException(error: unknown, context?: string): void {
  if (!isCrashReportingEnabled()) return
  Sentry.captureException(error, context ? { extra: { context } } : undefined)
}

export function captureIn(context: string): (error: unknown) => void {
  return (error) => captureException(error, context)
}
