import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { linkifyText } from '@altersend/domain'
import { CheckIcon, CopyIcon, MessageSquareIcon } from '../../icons'
import { useTheme } from '../../theme'
import { Button } from '../Button'
import { LinkRow } from '../LinkRow'

const TEXT_CLAMP_LINES = 5

export interface ReceivedTextRowProps {
  content: string
  isFirst?: boolean
  copied: boolean
  subtitleLabel: string
  copyLabel: string
  copiedLabel: string
  showMoreLabel: string
  showLessLabel: string
  onCopy: () => void
  onOpenLink: (url: string) => void
}

export function ReceivedTextRow({
  content,
  isFirst = false,
  copied,
  subtitleLabel,
  copyLabel,
  copiedLabel,
  showMoreLabel,
  showLessLabel,
  onCopy,
  onOpenLink
}: ReceivedTextRowProps) {
  const { theme, fontFamilyName } = useTheme()
  const c = theme.colors
  const [expanded, setExpanded] = useState(false)
  const [fullLineCount, setFullLineCount] = useState<number | null>(null)

  const overflowing = fullLineCount !== null && fullLineCount > TEXT_CLAMP_LINES
  const numberOfLines =
    fullLineCount === null || expanded || !overflowing ? undefined : TEXT_CLAMP_LINES
  const fontStyle = fontFamilyName ? { fontFamily: fontFamilyName } : null

  return (
    <LinkRow
      bare
      alignTop
      isFirst={isFirst}
      icon={<MessageSquareIcon size={18} color={c.colorInfo} />}
      iconBackground={c.colorInfoSubtle}
      label={content}
      labelNode={
        <View>
          <Text
            style={[fontStyle, styles.textBody, { color: c.colorTextPrimary }]}
            numberOfLines={numberOfLines}
            onTextLayout={(e) => {
              if (fullLineCount === null) setFullLineCount(e.nativeEvent.lines.length)
            }}
          >
            {linkifyText(content).map((seg, i) =>
              seg.url ? (
                <Text
                  key={i}
                  accessibilityRole='link'
                  style={[fontStyle, styles.link, { color: c.colorInfo }]}
                  onPress={() => onOpenLink(seg.url as string)}
                >
                  {seg.text}
                </Text>
              ) : (
                seg.text
              )
            )}
          </Text>
          {overflowing ? (
            <Text
              style={[fontStyle, styles.showMore, { color: c.colorInfo }]}
              onPress={() => setExpanded((v) => !v)}
            >
              {expanded ? showLessLabel : showMoreLabel}
            </Text>
          ) : null}
        </View>
      }
      subtitle={subtitleLabel}
      subtitleTone='faint'
      trailing={
        <Button
          size='sm'
          variant={copied ? 'success' : 'ghost'}
          iconOnly
          aria-label={copied ? copiedLabel : copyLabel}
          icon={
            copied ? (
              <CheckIcon size={16} color={c.colorSuccess} />
            ) : (
              <CopyIcon size={16} color={c.colorTextSecondary} />
            )
          }
          onClick={onCopy}
        />
      }
    />
  )
}

const styles = StyleSheet.create({
  textBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500'
  },
  showMore: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4
  },
  link: {
    textDecorationLine: 'underline'
  }
})
