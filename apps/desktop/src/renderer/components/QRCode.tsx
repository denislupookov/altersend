import { useEffect, useState } from 'react'
import QRCodeLib from 'qrcode'
import { useTheme } from '@altersend/components'

interface QRCodeProps {
  value: string
  size?: number
  loadingLabel: string
  imageLabel: string
}

export function QRCode({ value, loadingLabel, imageLabel, size = 220 }: QRCodeProps) {
  const [svg, setSvg] = useState<string | null>(null)
  const { theme } = useTheme()
  const dark = theme.colors.colorBackground
  const light = theme.colors.colorTextPrimary

  useEffect(() => {
    let cancelled = false
    if (!value) {
      setSvg(null)
      return
    }

    void QRCodeLib.toString(value, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark,
        light
      }
    })
      .then((generated) => {
        if (!cancelled) {
          const scalable = generated
            .replace(/ width="\d+"/, ' width="100%"')
            .replace(/ height="\d+"/, ' height="100%"')
          setSvg(scalable)
        }
      })
      .catch((err) => {
        console.error('QRCode: failed to generate', err)
        if (!cancelled) setSvg(null)
      })

    return () => {
      cancelled = true
    }
  }, [value, dark, light])

  if (!svg) {
    return (
      <div
        className='flex items-center justify-center rounded-lg bg-background-subtle text-[12px] text-text-muted'
        style={{ width: size, height: size }}
      >
        {loadingLabel}
      </div>
    )
  }

  return (
    <div
      aria-label={imageLabel}
      className='rounded-lg p-3'
      dangerouslySetInnerHTML={{ __html: svg }}
      role='img'
      style={{ width: size, height: size, backgroundColor: light }}
    />
  )
}
