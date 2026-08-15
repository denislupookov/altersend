export type ReleasePlatform = 'desktop' | 'mobile'

export interface ReleaseHighlight {
  key: string
  titleKey: string
  descriptionKey: string
  platforms?: ReleasePlatform[]
}

export interface ReleaseNote {
  version: string
  highlights: ReleaseHighlight[]
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '2.0.0',
    highlights: [
      {
        key: 'pro',
        titleKey: 'common:whatsNew.releases.v2_0_0.pro.title',
        descriptionKey: 'common:whatsNew.releases.v2_0_0.pro.description'
      },
      {
        key: 'relay',
        titleKey: 'common:whatsNew.releases.v2_0_0.relay.title',
        descriptionKey: 'common:whatsNew.releases.v2_0_0.relay.description'
      },
      {
        key: 'background',
        platforms: ['mobile'],
        titleKey: 'common:whatsNew.releases.v2_0_0.background.title',
        descriptionKey: 'common:whatsNew.releases.v2_0_0.background.description'
      },
      {
        key: 'share',
        titleKey: 'common:whatsNew.releases.v2_0_0.share.title',
        descriptionKey: 'common:whatsNew.releases.v2_0_0.share.description'
      },
      {
        key: 'lightMode',
        titleKey: 'common:whatsNew.releases.v2_0_0.lightMode.title',
        descriptionKey: 'common:whatsNew.releases.v2_0_0.lightMode.description'
      }
    ]
  }
]
