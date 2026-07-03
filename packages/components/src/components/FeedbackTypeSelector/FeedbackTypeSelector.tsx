import { Tabs, TabsList, TabsTrigger } from '../Tabs'

const TYPES = ['bug', 'feature', 'general'] as const
export type FeedbackType = (typeof TYPES)[number]
export { TYPES as FEEDBACK_TYPES }

interface FeedbackTypeSelectorProps {
  value: FeedbackType
  onChange: (type: FeedbackType) => void
  labels: Record<FeedbackType, string>
  disabled?: boolean
}

export function FeedbackTypeSelector({
  value,
  onChange,
  labels,
  disabled
}: FeedbackTypeSelectorProps) {
  return (
    <Tabs stretch value={value} onValueChange={(next) => onChange(next as FeedbackType)}>
      <TabsList>
        {TYPES.map((type) => (
          <TabsTrigger key={type} value={type} disabled={disabled}>
            {labels[type]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
