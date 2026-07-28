import { ExternalLink } from '@altersend/components'
import {
  discordUrl,
  downloadUrl,
  githubUrl,
  privacyPolicyUrl,
  supportEmail,
  termsOfServiceUrl,
  xUrl
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { BLOCK_WIDTH } from '../Card'

const XGlyph = () => (
  <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
    <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
  </svg>
)

const GithubGlyph = () => (
  <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
    <path d='M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z' />
  </svg>
)

const DiscordGlyph = () => (
  <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
    <path d='M20.317 4.369a19.8 19.8 0 0 0-4.885-1.515.07.07 0 0 0-.079.036c-.21.375-.444.865-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.07.07 0 0 0-.079-.036A19.7 19.7 0 0 0 3.677 4.37a.06.06 0 0 0-.03.025C.533 9.046-.32 13.58.099 18.058a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.028 14 14 0 0 0 1.226-1.994.076.076 0 0 0-.042-.106 13 13 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.07.07 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .079.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.891a.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.665a.06.06 0 0 0-.031-.026M8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419s.956-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418m7.975 0c-1.183 0-2.157-1.085-2.157-2.419s.955-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418' />
  </svg>
)

const SOCIALS = [
  { href: xUrl, label: 'X', glyph: <XGlyph /> },
  { href: githubUrl, label: 'GitHub', glyph: <GithubGlyph /> },
  { href: discordUrl, label: 'Discord', glyph: <DiscordGlyph /> }
]

export function Footer() {
  const { t } = useTranslation(['web'])

  return (
    <footer
      className={`mt-auto flex ${BLOCK_WIDTH} flex-col items-start gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-14`}
    >
      <div className='flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-text-faint'>
        <span>© {new Date().getFullYear()} AlterSend</span>
        <ExternalLink href={downloadUrl}>{t('web:footer.getApp')}</ExternalLink>
        <ExternalLink href={privacyPolicyUrl}>{t('web:footer.privacy')}</ExternalLink>
        <ExternalLink href={termsOfServiceUrl}>{t('web:footer.terms')}</ExternalLink>
        <ExternalLink href={`mailto:${supportEmail}`}>{t('web:footer.help')}</ExternalLink>
      </div>

      <div className='flex shrink-0 items-center gap-4 self-end text-text-faint sm:self-auto'>
        {SOCIALS.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={social.label}
            className='text-text-faint transition-colors hover:text-text-primary'
          >
            {social.glyph}
          </a>
        ))}
      </div>
    </footer>
  )
}
