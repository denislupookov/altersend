import { websiteUrl } from '@altersend/domain'
import logo from '../../assets/altersend-logo.png'

export function BrandHeader() {
  return (
    <a href={websiteUrl} aria-label='AlterSend' className='mb-[30px]'>
      <img src={logo} alt='AlterSend' className='h-8 w-auto object-contain' />
    </a>
  )
}
