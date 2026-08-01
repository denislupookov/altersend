import { websiteUrl } from '@altersend/domain'
import logo from '../../assets/altersend-logo.png'
import { LanguageSelect } from '../LanguageSelect'

export function PageHeader() {
  return (
    <>
      <div className='mb-6 flex w-full max-w-[620px] items-center justify-between sm:hidden'>
        <a href={websiteUrl} aria-label='AlterSend'>
          <img src={logo} alt='AlterSend' className='h-7 w-auto object-contain' />
        </a>
        <LanguageSelect compact />
      </div>

      <div className='absolute right-6 top-6 hidden sm:block'>
        <LanguageSelect />
      </div>

      <a href={websiteUrl} aria-label='AlterSend' className='mb-[30px] hidden sm:block'>
        <img src={logo} alt='AlterSend' className='h-8 w-auto object-contain' />
      </a>
    </>
  )
}
