import { ThemeType, useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { DemoVideo } from './DemoVideo'
import { MacWindow } from './MacWindow'
import { PageHeading } from './PageHeading'
import { VisualCard } from './VisualCard'
import type { OnboardingStep } from './steps'

interface StepViewProps {
  step: OnboardingStep
}

export function StepView({ step }: StepViewProps) {
  const { t } = useTranslation(['onboarding'])
  const { themeType } = useTheme()
  const screen = themeType === ThemeType.Light ? step.screen.light : step.screen.dark

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <VisualCard>
        {step.video ? (
          <DemoVideo poster={screen} video={step.video} />
        ) : (
          <div className='absolute inset-x-0 top-7 flex justify-center'>
            <MacWindow src={screen} />
          </div>
        )}
      </VisualCard>

      <div className='pt-6'>
        <PageHeading
          title={t(`onboarding:steps.${step.kind}.title`)}
          description={t(`onboarding:steps.${step.kind}.description`)}
        />
      </div>
    </div>
  )
}
