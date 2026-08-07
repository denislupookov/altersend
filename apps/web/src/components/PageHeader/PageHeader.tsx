import { ThemeType, useTheme } from '@altersend/components'
import { websiteUrl } from '@altersend/domain'
import logoOnLight from '../../assets/altersend-logo-dark.png'
import logoOnDark from '../../assets/altersend-logo.png'
import { AppearanceToggle } from '../AppearanceToggle'
import { LanguageSelect } from '../LanguageSelect'

export function PageHeader() {
  const { themeType } = useTheme()
  const logo = themeType === ThemeType.Light ? logoOnLight : logoOnDark

  return (
    <>
      <div className='mb-6 flex w-full max-w-[620px] items-center justify-between sm:hidden'>
        <a href={websiteUrl} aria-label='AlterSend'>
          <img src={logo} alt='AlterSend' className='h-7 w-auto object-contain' />
        </a>
        <div className='flex items-center gap-2'>
          <AppearanceToggle />
          <LanguageSelect compact />
        </div>
      </div>

      <div className='absolute right-6 top-6 hidden items-center gap-2 sm:flex'>
        <AppearanceToggle />
        <LanguageSelect />
      </div>

      <a href={websiteUrl} aria-label='AlterSend' className='mb-[30px] hidden sm:block'>
        <img src={logo} alt='AlterSend' className='h-8 w-auto object-contain' />
      </a>
    </>
  )
}
