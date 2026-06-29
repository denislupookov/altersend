import { View, StyleSheet } from 'react-native'
import {
  getOverallProgress,
  getProgressState,
  getStatusTone,
  useTransferStore
} from '@altersend/domain'
import { LinkRow, useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { Text } from '@/src/components/ThemedText'

export function PreparingView() {
  const { t } = useTranslation(['send'])
  const uploadItems = useTransferStore((s) => s.uploadItems)
  const { theme } = useTheme()
  const { completed, total, percent } = getOverallProgress(uploadItems)
  const allCompleted = completed === total && total > 0

  const surfaceStyle = {
    backgroundColor: theme.colors.colorBackgroundSubtle,
    borderColor: theme.colors.colorBorderPrimary
  }

  return (
    <View style={styles.container}>
      <View style={[styles.card, surfaceStyle]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.colorTextPrimary }]}>
            {allCompleted ? t('send:status.uploadComplete') : t('send:status.uploadingFiles')}
          </Text>
          <Text style={[styles.percent, { color: theme.colors.colorTextPrimary }]}>{percent}%</Text>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: theme.colors.colorBorderPrimary }]}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${percent}%`,
                backgroundColor: allCompleted ? theme.colors.colorSuccess : theme.colors.colorAccent
              }
            ]}
          />
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.colorTextSecondary }]}>
          {t('send:preparing.uploadedCount', { completed, count: total })}
        </Text>
      </View>

      <View style={styles.fileList}>
        {uploadItems.map((item) => {
          const progress = getProgressState(item)
          return (
            <LinkRow
              key={item.path}
              file
              standalone
              label={item.name}
              size={item.size}
              status={{
                label:
                  item.status === 'completed'
                    ? t('send:status.uploaded')
                    : item.status === 'uploading'
                      ? t('send:status.uploading')
                      : t('send:status.waiting'),
                tone: getStatusTone(item)
              }}
              progress={
                progress === 'waiting' || progress === 'uploading' || progress === 'completed'
                  ? progress
                  : undefined
              }
            />
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 14,
    fontWeight: '600'
  },
  percent: {
    fontSize: 14,
    fontWeight: '700'
  },
  progressTrack: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: 3
  },
  subtitle: {
    fontSize: 12,
    marginTop: 8
  },
  fileList: {
    gap: 8
  }
})
