import { useMemo } from 'react'
import { NATIVE_RELAY_MAX_BYTES } from '../constants/transfer'
import { getOfferKey, type PrimaryDownloadAction, type ReceiveRow } from '../receive/downloadModel'
import type { ReceiveDownloads, ReceiveFileOffer } from '../receive/useReceiveDownloads'
import { lockedOfferKeys, splitRelayAllowance } from './relayAllowance'
import { useReceiveRelayLimit } from './useRelayLimit'

export interface ReceiveRelayAllowance {
  limited: boolean
  rows: ReceiveRow[]
  lockedKeys: ReadonlySet<string>
  freePendingOffers: ReceiveFileOffer[]
  freePendingBytes: number
  primaryAction: PrimaryDownloadAction
  canReconnect: boolean
}

const NO_LOCKED_KEYS: ReadonlySet<string> = new Set()

function sumSizes(offers: ReceiveFileOffer[]): number {
  return offers.reduce((sum, offer) => sum + offer.size, 0)
}

export function useReceiveRelayAllowance(downloads: ReceiveDownloads): ReceiveRelayAllowance {
  const limited = useReceiveRelayLimit()
  const { rows, states, pendingOffers, pausedOffers, isDownloading, primaryAction } = downloads

  return useMemo(() => {
    const canReconnect = Object.values(states).every((state) => state.status === 'idle')

    if (!limited) {
      return {
        limited,
        rows,
        lockedKeys: NO_LOCKED_KEYS,
        freePendingOffers: pendingOffers,
        freePendingBytes: sumSizes(pendingOffers),
        primaryAction,
        canReconnect
      }
    }

    const split = splitRelayAllowance(rows, states, NATIVE_RELAY_MAX_BYTES)
    const lockedKeys = lockedOfferKeys(split.lockedRows)
    const freePendingOffers = pendingOffers.filter((offer) => !lockedKeys.has(getOfferKey(offer)))
    const canResumeFree =
      !isDownloading && pausedOffers.length > 0 && pausedOffers.length === freePendingOffers.length

    return {
      limited,
      rows: [...split.freeRows, ...split.lockedRows],
      lockedKeys,
      freePendingOffers,
      freePendingBytes: sumSizes(freePendingOffers),
      primaryAction:
        canResumeFree && primaryAction === 'download-all' ? 'resume-all' : primaryAction,
      canReconnect
    }
  }, [limited, rows, states, pendingOffers, pausedOffers, isDownloading, primaryAction])
}
