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

export type CommunityLinkKey = Extract<AboutLinkKey, 'github' | 'discord' | 'x'>

export interface CommunityLink extends AboutLink {
  key: CommunityLinkKey
}

const githubLink: CommunityLink = {
  key: 'github',
  labelKey: 'settings:rows.github',
  url: githubUrl
}
const discordLink: CommunityLink = {
  key: 'discord',
  labelKey: 'settings:rows.discord',
  url: discordUrl
}
const xLink: CommunityLink = { key: 'x', labelKey: 'settings:rows.x', url: xUrl }

export const communityLinks: CommunityLink[] = [discordLink, githubLink, xLink]

export const aboutLinkGroups: AboutLink[][] = [
  [
    { key: 'website', labelKey: 'settings:rows.website', url: websiteUrl },
    githubLink,
    discordLink,
    xLink,
    { key: 'sponsor', labelKey: 'settings:rows.sponsor', url: sponsorUrl }
  ],
  [
    { key: 'privacy', labelKey: 'settings:rows.privacyPolicy', url: privacyPolicyUrl },
    { key: 'terms', labelKey: 'settings:rows.terms', url: termsOfServiceUrl }
  ]
]
