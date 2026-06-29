import { useState } from 'react'
import { buildJoinUrl, formatFileSize, useShareViewModel } from '@altersend/domain'
import { Button, LinkCard, LinkRow, WaitingRadar, useTheme } from '@altersend/components'
import {
  ChevronsUpDownIcon,
  deviceIcon,
  FolderIcon,
  QrCodeIcon,
  ShareIcon
} from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { Popover, QRCode, QRModal, useToast } from '../../components'
import { TopicCopyButton } from './TopicCopyButton'

export function ShareView() {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const toast = useToast()
  const vm = useShareViewModel(t, {
    onPeerJoined: (peer) =>
      toast.show({
        title: peer.isKnown
          ? t('send:status.deviceConnected', { name: peer.name })
          : t('send:status.peerConnected'),
        durationMs: 2500
      }),
    onPeerPaired: (peer) =>
      toast.show({ title: t('send:status.pairedToast', { name: peer.name }), durationMs: 2500 }),
    onInviteFailed: (peer) =>
      toast.show({
        title: t('send:status.inviteFailedToast', { name: peer.name }),
        hint: t('send:status.inviteFailedHint'),
        variant: 'error',
        durationMs: 3500
      })
  })
  const [isQrOpen, setIsQrOpen] = useState(false)
  const hasConnectedDevices = vm.connectedCount > 0

  const copyTopic = async () => {
    if (!vm.topic) return
    await navigator.clipboard.writeText(vm.topic)
    vm.markCopied()
  }

  const filesCard = (
    <Popover
      variant='plain'
      align='left'
      trigger={
        <LinkCard>
          <LinkRow
            compact
            icon={<FolderIcon size={16} color={c.colorTextSecondary} />}
            label={t('common:files.count', { count: vm.files.length })}
            subtitle={formatFileSize(vm.totalSize)}
            trailing={<ChevronsUpDownIcon size={16} color={c.colorTextMuted} />}
            isLast
          />
        </LinkCard>
      }
    >
      {() => (
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          <LinkCard>
            {vm.files.map((file, index) => (
              <LinkRow
                key={file.path}
                compact
                file
                label={file.name}
                size={file.size}
                isLast={index === vm.files.length - 1}
              />
            ))}
          </LinkCard>
        </div>
      )}
    </Popover>
  )

  return (
    <>
      <div className='flex flex-col gap-6 pt-5'>
        {hasConnectedDevices ? (
          <div className='flex w-full gap-2'>
            <TopicCopyButton
              topic={vm.topic}
              copied={vm.isCopied}
              onCopy={() => void copyTopic()}
              placeholder={t('send:connection.placeholder')}
            />
            <div className='flex aspect-square shrink-0'>
              <Button
                variant='secondary'
                iconOnly
                width='full'
                aria-label={t('send:connection.showQrLabel')}
                icon={<QrCodeIcon size={18} />}
                onClick={() => setIsQrOpen(true)}
              />
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-5'>
            <div className='flex gap-6'>
              <aside
                className={`flex w-[240px] shrink-0 justify-center ${vm.hasDevices ? 'self-start' : ''}`}
              >
                {vm.topic ? (
                  <QRCode
                    imageLabel={t('send:connection.qrCodeLabel')}
                    loadingLabel={t('send:connection.generating')}
                    size={216}
                    value={buildJoinUrl(vm.topic)}
                  />
                ) : (
                  <div
                    className='flex items-center justify-center rounded-lg bg-surface-primary text-[12px] text-text-muted'
                    style={{ width: 216, height: 216 }}
                  >
                    {t('send:connection.generating')}
                  </div>
                )}
              </aside>

              <div
                className={`flex min-w-0 flex-1 flex-col gap-5 ${vm.hasDevices ? '' : 'justify-center'}`}
              >
                {vm.phase === 'waiting' && (
                  <div className='flex items-center gap-3'>
                    <WaitingRadar
                      size={44}
                      color={c.colorInfo}
                      pulsing
                      icon={<ShareIcon size={17} color={c.colorInfo} />}
                    />
                    <div className='min-w-0'>
                      <p className='m-0 text-[15px] font-bold leading-snug text-text-primary'>
                        {t('send:status.waitingForJoin')}
                      </p>
                      <p className='m-0 mt-0.5 text-[12px] leading-snug text-text-muted'>
                        {t('send:hints.keepOpen')}
                      </p>
                    </div>
                  </div>
                )}
                <div className='flex w-full'>
                  <TopicCopyButton
                    topic={vm.topic}
                    copied={vm.isCopied}
                    onCopy={() => void copyTopic()}
                    placeholder={t('send:connection.placeholder')}
                  />
                </div>
                {vm.hasDevices && filesCard}
              </div>
            </div>
            {!vm.hasDevices && filesCard}
          </div>
        )}

        {hasConnectedDevices && <div>{filesCard}</div>}

        {vm.hasDevices && (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between px-1'>
              <p className='m-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary'>
                {t('send:peer.devices')}
              </p>
              {vm.connectedCount > 0 && (
                <p className='m-0 text-[11.5px] font-medium text-text-muted'>
                  {t('send:peer.connectedCount', { count: vm.connectedCount })}
                </p>
              )}
            </div>
            <LinkCard>
              {vm.devices.map((row, index) => {
                const isLast = index === vm.devices.length - 1
                if (row.kind === 'connected') {
                  const Icon = row.deviceType ? deviceIcon(row.deviceType) : null
                  return (
                    <LinkRow
                      key={row.peerKey}
                      compact
                      icon={
                        Icon ? (
                          <Icon size={18} color={c.colorTextSecondary} />
                        ) : (
                          <span
                            style={{ color: c.colorInfo }}
                            className='font-mono text-[12px] font-semibold uppercase'
                          >
                            {row.name.slice(0, 2)}
                          </span>
                        )
                      }
                      iconBackground={Icon ? c.colorSurfacePrimary : c.colorInfoSubtle}
                      label={row.name}
                      subtitle={row.subtitle}
                      subtitleTone={row.subtitleTone}
                      progressPercent={row.progressPercent}
                      trailing={
                        row.action === 'pair' ? (
                          <Button
                            onClick={() => vm.pair(row.peerKey)}
                            size='sm'
                            variant='secondary'
                            pill
                          >
                            {t('send:peer.pair')}
                          </Button>
                        ) : row.action === 'pair-requested' ? (
                          <Button size='sm' variant='secondary' pill loading>
                            {t('send:peer.requested')}
                          </Button>
                        ) : undefined
                      }
                      isLast={isLast}
                    />
                  )
                }
                const PeerIcon = deviceIcon(row.deviceType)
                const isActive = row.action === 'inviting' || row.action === 'invite-sent'
                const label =
                  row.action === 'inviting'
                    ? t('send:peer.inviting')
                    : row.action === 'invite-sent'
                      ? t('send:peer.sent')
                      : t('send:peer.invite')
                return (
                  <LinkRow
                    key={row.peerKey}
                    compact
                    icon={<PeerIcon size={18} color={c.colorTextSecondary} />}
                    label={row.name}
                    subtitle={row.subtitle}
                    subtitleTone={row.subtitleTone}
                    onPress={() => void vm.invite(row.peerKey)}
                    trailing={
                      <Button
                        disabled={isActive}
                        loading={isActive}
                        onClick={() => void vm.invite(row.peerKey)}
                        size='sm'
                        variant='primary'
                        pill
                      >
                        {label}
                      </Button>
                    }
                    isLast={isLast}
                  />
                )
              })}
            </LinkCard>
          </div>
        )}
      </div>

      <QRModal topic={vm.topic} open={isQrOpen} onClose={() => setIsQrOpen(false)} />
    </>
  )
}
