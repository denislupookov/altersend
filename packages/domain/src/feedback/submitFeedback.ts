const DISCORD_EMBED_COLOR = 0x5865f2

export interface FeedbackReport {
  webhookUrl: string | undefined
  title: string
  message: string
  version: string
  platform: string
  labels: { version: string; platform: string }
}

export async function submitFeedback({
  webhookUrl,
  title,
  message,
  version,
  platform,
  labels
}: FeedbackReport): Promise<boolean> {
  if (!webhookUrl || webhookUrl.includes('PLACEHOLDER')) return false

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title,
            description: message,
            color: DISCORD_EMBED_COLOR,
            fields: [
              { name: labels.version, value: `v${version}`, inline: true },
              { name: labels.platform, value: platform, inline: true }
            ],
            timestamp: new Date().toISOString()
          }
        ]
      })
    })
    return response.ok
  } catch {
    return false
  }
}
