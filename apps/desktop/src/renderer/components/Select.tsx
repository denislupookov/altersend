import { ChevronDownIcon } from '@altersend/components/icons'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  'aria-label': string
  id?: string
  className?: string
}

/**
 * Styled dropdown shared across the desktop renderer (camera picker, language
 * picker, …). Wraps a native `<select>` with a chevron affordance.
 */
export function Select({
  value,
  onChange,
  options,
  id,
  className,
  'aria-label': ariaLabel
}: SelectProps) {
  return (
    <div className={`relative${className ? ` ${className}` : ''}`}>
      <select
        id={id}
        aria-label={ariaLabel}
        className='w-full cursor-pointer appearance-none rounded-[10px] border border-border-primary bg-background-subtle py-3 pl-4 pr-10 text-[13px] text-text-primary transition-colors hover:border-border-strong focus:border-border-strong focus:outline-none'
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted'>
        <ChevronDownIcon size={16} />
      </span>
    </div>
  )
}
