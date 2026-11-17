import { useMemo } from 'react'
import { NATIVE_RELAY_MAX_BYTES } from '../constants/transfer'
import { getOfferKey, type ReceiveRow } from '../receive/downloadModel'
import type { ReceiveDownloads, ReceiveFileOffer } from '../receive/useReceiveDownloads'
import { lockedOfferKeys, splitRelayAllowance } from './relayAllowance'
import { useReceiveRelayLimit } from './useRelayLimit'

export interface ReceiveRelayAllowance {
  limited: boolean
  rows: ReceiveRow[]
  lockedKeys: ReadonlySet<string>
  freePendingOffers: ReceiveFileOffer[]
  freePendingBytes: number
}

const NO_LOCKED_KEYS: ReadonlySet<string> = new Set()

function sumSizes(offers: ReceiveFileOffer[]): number {
  return offers.reduce((sum, offer) => sum + offer.size, 0)
}

export function useReceiveRelayAllowance(downloads: ReceiveDownloads): ReceiveRelayAllowance {
  const limited = useReceiveRelayLimit()
  const { rows, states, pendingOffers } = downloads

  return useMemo(() => {
    if (!limited) {
      return {
        limited,
        rows,
        lockedKeys: NO_LOCKED_KEYS,
        freePendingOffers: pendingOffers,
        freePendingBytes: sumSizes(pendingOffers)
      }
    }

    const split = splitRelayAllowance(rows, states, NATIVE_RELAY_MAX_BYTES)
    const lockedKeys = lockedOfferKeys(split.lockedRows)
    const freePendingOffers = pendingOffers.filter((offer) => !lockedKeys.has(getOfferKey(offer)))

    return {
      limited,
      rows: [...split.freeRows, ...split.lockedRows],
      lockedKeys,
      freePendingOffers,
      freePendingBytes: sumSizes(freePendingOffers)
    }
  }, [limited, rows, states, pendingOffers])
}
