import { Redirect } from 'expo-router'
import { isOnboardingCompleted } from '@/src/onboarding/onboardingStorage'

const forceOnboarding = __DEV__ && process.env.EXPO_PUBLIC_FORCE_ONBOARDING === '1'

export default function Index() {
  const completed = !forceOnboarding && isOnboardingCompleted()
  return <Redirect href={completed ? '/send' : '/onboarding'} />
}
