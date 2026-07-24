import {
  discordUrl,
  githubUrl,
  privacyPolicyUrl,
  sponsorUrl,
  termsOfServiceUrl,
  websiteUrl,
  xUrl
} from './links'

export type AboutLinkKey = 'website' | 'github' | 'discord' | 'x' | 'sponsor' | 'privacy' | 'terms'

export interface AboutLink {
  key: AboutLinkKey
  labelKey: string
  url: string
}

export const aboutLinkGroups: AboutLink[][] = [
  [
    { key: 'website', labelKey: 'settings:rows.website', url: websiteUrl },
    { key: 'github', labelKey: 'settings:rows.github', url: githubUrl },
    { key: 'discord', labelKey: 'settings:rows.discord', url: discordUrl },
    { key: 'x', labelKey: 'settings:rows.x', url: xUrl },
    { key: 'sponsor', labelKey: 'settings:rows.sponsor', url: sponsorUrl }
  ],
  [
    { key: 'privacy', labelKey: 'settings:rows.privacyPolicy', url: privacyPolicyUrl },
    { key: 'terms', labelKey: 'settings:rows.terms', url: termsOfServiceUrl }
  ]
]
